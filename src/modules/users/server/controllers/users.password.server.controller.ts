/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import { Request, Response, NextFunction } from "express";
import { default as User, UserModel, AuthToken } from "../models/User";
import * as errorHandler from "../../../core/server/controllers/errors.server.controller";
import * as passport from "passport";
import * as crypto from "crypto";
import { Config } from "../../../../config/config";
import * as path from "path";
import { Mailer } from "../../../../config/lib/mailer";

export class Password {

  /**
   * Forgot for reset password (forgot POST)
   */
  public static async forgot(req: Request, res: Response, next: NextFunction) {
    let token: string;
    let forgotPasswordUser: any;
    let error: any;
    let promise: Promise<any>;
    promise = new Promise<string>(function (resolve, reject) {
      crypto.randomBytes(20, function (err, buffer) {
        resolve(buffer.toString("hex"));
      });
    });
    token = await promise.then();

    if (req.body.usernameOrEmail) {

      const usernameOrEmail = String(req.body.usernameOrEmail).toLowerCase();
      forgotPasswordUser = await User.findOne({
        $or: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      }, "-salt -password", function (err, user) {
        error = err;
        if (err || !user) {
          return res.status(400).send({
            message: "No account with that username or email has been found"
          });
        } else if (user.provider !== "local") {
          return res.status(400).send({
            message: "It seems like you signed up using your " + user.provider + " account, please sign in using that provider."
          });
        } else {
          user.resetPasswordToken = token;
          user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

          user.save(function (err) {
            if (err) {
              console.log("User saved Error:", err);
            }
          });
        }
      });
    } else {
      return res.status(422).send({
        message: "Username/email field must not be blank"
      });
    }
    if (!forgotPasswordUser) {
      return;
    }

    const baseUrl = Config.getInstance().getEnv().domain;

    const templatePath: string = "modules/users/server/templates/account_password_reset_2.html";
    const emailData = { url: baseUrl + "/api/auth/reset/" + token };
    const sendEmailResult = await new Mailer().sendEmail([forgotPasswordUser.email], "Forgot Password", templatePath, emailData);
    if (sendEmailResult) {
     res.json();
    } else {
     res.status(500).send({
        message: "Server Error"
      });
    }
  }

  /**
   * Reset password GET from email token
   */
  public static validateResetToken(req: Request, res: Response) {
    User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: {
        $gt: Date.now()
      }
    }, function (err, user) {
      if (err || !user) {
        return res.redirect("/password/reset/invalid");
      }

      return res.redirect("/password/reset/" + req.params.token);
    });
  }

  /**
   * Reset password POST from email token
   */
  public static reset(req: Request, res: Response, next: NextFunction) {
    // Init Variables
    const passwordDetails = req.body;
    let resetPasswordUser: any;
    let userPromise: Promise<UserModel> = undefined;
    userPromise = new Promise<UserModel>(function (resolve, reject) {
      resetPasswordUser = User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, user) {
        if (!err && user) {
          if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
            user.password = passwordDetails.newPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              if (err) {
                return res.status(422).send({
                  message: errorHandler.getErrorMessage(err)
                });
              } else {
                req.login(user, function (err) {
                  if (err) {
                    res.status(400).send(err);
                  } else {
                    // Remove sensitive data before return authenticated user
                    user.password = undefined;
                    user.salt = undefined;

                    res.json(user);
                    resolve(user);
                  }
                });
              }
            });
          } else {
            return res.status(422).send({
              message: "Passwords do not match"
            });
          }
        } else {
          return res.status(400).send({
            message: "Password reset token is invalid or has expired."
          });
        }
      });
    });

    // Send the email
    const emailTemplatePath = "modules/users/server/templates/reset-password-confirm-email.html";
    const emailData = {
      name: resetPasswordUser.displayName,
    };
    const subject: string = "Your password has been changed";

    const sendEmailResult = new Mailer().sendEmail([resetPasswordUser.email], subject, emailTemplatePath, emailData);
    if (sendEmailResult) {
      return res.status(200).send({
        message: "Email Sent"
      });
    } else {
      return res.status(500).send({
        message: "Server Error"
      });
    }
  }

  /**
   * Change Password
   */
  public static changePassword(req: Request, res: Response, next: NextFunction) {
    // Init Variables
    const passwordDetails = req.body;

    if (req.user) {
      if (passwordDetails.newPassword) {
        User.findById(req.user.id, function (err, user) {
          if (!err && user) {
            if (user.authenticate(passwordDetails.currentPassword)) {
              if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
                user.password = passwordDetails.newPassword;

                user.save(function (err) {
                  if (err) {
                    return res.status(422).send({
                      message: errorHandler.getErrorMessage(err)
                    });
                  } else {
                    req.login(user, function (err) {
                      if (err) {
                        res.status(400).send(err);
                      } else {
                        res.send({
                          message: "Password changed successfully"
                        });
                      }
                    });
                  }
                });
              } else {
                res.status(422).send({
                  message: "Passwords do not match"
                });
              }
            } else {
              res.status(422).send({
                message: "Current password is incorrect"
              });
            }
          } else {
            res.status(400).send({
              message: "User is not found"
            });
          }
        });
      } else {
        res.status(422).send({
          message: "Please provide a new password"
        });
      }
    } else {
      res.status(401).send({
        message: "User is not signed in"
      });
    }
  }

}

