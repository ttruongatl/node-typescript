/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import { Request, Response, NextFunction } from "express";
import { default as User, UserModel, AuthToken } from "../models/User";
import * as errorHandler from "../../../core/server/controllers/errors.server.controller";
import * as _ from "lodash";
import * as mongoose from "mongoose";

/**
 * User middleware
 */
export function userByID (req: any, res: Response, next: NextFunction, id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: "User is invalid"
    });
  }

  User.findOne({
    _id: id
  }).exec(function (err, user) {
    if (err) {
      return next(err);
    } else if (!user) {
      return next(new Error("Failed to load User " + id));
    }

    req.profile = user;
    next();
  });
}
