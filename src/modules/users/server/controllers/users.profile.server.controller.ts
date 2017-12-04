/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import { Request, Response, NextFunction } from "express";
import { default as User, UserModel, AuthToken } from "../models/User";
import * as errorHandler from "../../../core/server/controllers/errors.server.controller";
import * as passport from "passport";
import * as _ from "lodash";
import * as validator from "validator";

export class Profile {

  public static whitelistedFields = ["fullName", "email", "username"];
  /**
   * Update user details
   */
  public static update (req: Request, res: Response) {
    // Init constiables
    let user = req.user;

    if (user) {
      // Update whitelisted fields only
      user = _.extend(user, _.pick(req.body, Profile.whitelistedFields));

      user.updated = Date.now();
      user.displayName = user.fullName;

      user.save(function (err: any) {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        } else {
          req.login(user, function (err) {
            if (err) {
              res.status(400).send(err);
            } else {
              res.json(user);
            }
          });
        }
      });
    } else {
      res.status(401).send({
        message: "User is not signed in"
      });
    }
  }

  /**
   * Update profile picture
   */
  public static changeProfilePicture (req: Request, res: Response) {
    // const user = req.user;
    // let existingImageUrl: any;
    // let multerConfig: any;


    // if (useS3Storage) {
    //   multerConfig = {
    //     storage: multerS3({
    //       s3: s3,
    //       bucket: config.aws.s3.bucket,
    //       acl: "public-read"
    //     })
    //   };
    // } else {
    //   multerConfig = config.uploads.profile.image;
    // }

    // Filtering to upload only images
    // multerConfig.fileFilter = require(path.resolve("./config/lib/multer")).imageFileFilter;

    // const upload = multer(multerConfig).single("newProfilePicture");

    // if (user) {
    //   existingImageUrl = user.profileImageURL;
    //   uploadImage()
    //     .then(updateUser)
    //     .then(deleteOldImage)
    //     .then(login)
    //     .then(function () {
    //       res.json(user);
    //     })
    //     .catch(function (err) {
    //       res.status(422).send(err);
    //     });
    // } else {
    //   res.status(401).send({
    //     message: "User is not signed in"
    //   });
    // }

    // function uploadImage() {
    //   return new Promise(function (resolve, reject) {
    //     upload(req, res, function (uploadError) {
    //       if (uploadError) {
    //         reject(errorHandler.getErrorMessage(uploadError));
    //       } else {
    //         resolve();
    //       }
    //     });
    //   });
    // }

    // function updateUser() {
    //   return new Promise(function (resolve, reject) {
    //     user.profileImageURL = config.uploads.storage === "s3" && config.aws.s3 ?
    //       req.file.location :
    //       "/" + req.file.path;
    //     user.save(function (err, theuser) {
    //       if (err) {
    //         reject(err);
    //       } else {
    //         resolve();
    //       }
    //     });
    //   });
    // }

    // function deleteOldImage() {
    //   return new Promise(function (resolve, reject) {
    //     if (existingImageUrl !== User.schema.path("profileImageURL").defaultValue) {
    //       if (useS3Storage) {
    //         try {
    //           const { region, bucket, key } = amazonS3URI(existingImageUrl);
    //           const params = {
    //             Bucket: config.aws.s3.bucket,
    //             Key: key
    //           };

    //           s3.deleteObject(params, function (err) {
    //             if (err) {
    //               console.log("Error occurred while deleting old profile picture.");
    //               console.log("Check if you have sufficient permissions : " + err);
    //             }

    //             resolve();
    //           });
    //         } catch (err) {
    //           console.warn(`${existingImageUrl} is not a valid S3 uri`);

    //           return resolve();
    //         }
    //       } else {
    //         fs.unlink(path.resolve("." + existingImageUrl), function (unlinkError) {
    //           if (unlinkError) {

    //             // If file didn"t exist, no need to reject promise
    //             if (unlinkError.code === "ENOENT") {
    //               console.log("Removing profile image failed because file did not exist.");
    //               return resolve();
    //             }

    //             console.error(unlinkError);

    //             reject({
    //               message: "Error occurred while deleting old profile picture"
    //             });
    //           } else {
    //             resolve();
    //           }
    //         });
    //       }
    //     } else {
    //       resolve();
    //     }
    //   });
    // }

    // function login() {
    //   return new Promise(function (resolve, reject) {
    //     req.login(user, function (err) {
    //       if (err) {
    //         res.status(400).send(err);
    //       } else {
    //         resolve();
    //       }
    //     });
    //   });
    // }
  }

  /**
   * Send User
   */
  public static me (req: Request, res: Response) {
    // Sanitize the user - short term solution. Copied from core.server.controller.js
    // TODO create proper passport mock: See https://gist.github.com/mweibel/5219403
    let safeUserObject: any = undefined;
    if (req.user) {
      safeUserObject = {
        displayName: validator.escape(req.user.displayName),
        provider: validator.escape(req.user.provider),
        username: validator.escape(req.user.username),
        created: req.user.created.toString(),
        roles: req.user.roles,
        profileImageURL: req.user.profileImageURL,
        email: validator.escape(req.user.email),
        fullName: validator.escape(req.user.fullName),
        additionalProvidersData: req.user.additionalProvidersData
      };
    }

    res.json(safeUserObject);
  }
}
