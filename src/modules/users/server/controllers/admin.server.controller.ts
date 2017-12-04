/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import { Request, Response, NextFunction } from "express";
import { default as User, UserModel, AuthToken } from "../models/User";
import * as errorHandler from "../../../core/server/controllers/errors.server.controller";
import * as passport from "passport";
import * as mongoose from "mongoose";

export class Admin {
  /**
   * Show the current user
   */
  public static read = function (req: any, res: Response) {
    res.json(req.model);
  };

  /**
   * Update a User
   */
  public static update = function (req: any, res: Response) {
    const user = req.model;

    // For security purposes only merge these parameters
    user.fullName = req.body.fullName;
    user.displayName = user.fullName;
    user.roles = req.body.roles;

    user.save(function (err: any) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.json(user);
    });
  };

  /**
   * Delete a user
   */
  public static delete = function (req: any, res: Response) {
    const user = req.model;

    user.remove(function (err: any) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.json(user);
    });
  };

  /**
   * List of Users
   */
  public static list = function (req: Request, res: Response) {
    User.find({}, "-salt -password -providerData").sort("-created").populate("user", "displayName").exec(function (err, users) {
      if (err) {
        return res.status(422).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.json(users);
    });
  };

  /**
   * User middleware
   */
  public static userByID = function (req: any, res: Response, next: NextFunction, id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({
        message: "User is invalid"
      });
    }

    User.findById(id, "-salt -password -providerData").exec(function (err, user) {
      if (err) {
        return next(err);
      } else if (!user) {
        return next(new Error("Failed to load user " + id));
      }

      req.model = user;
      next();
    });
  };
}
