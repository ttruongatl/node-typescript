/**
 * Module dependencies
 */

import * as path from "path";
import { Config } from "../../../../config/config";
import * as passport from "passport";
import * as mongoose from "mongoose";
const User = mongoose.model("User");
import * as express from "express";
import { UserModel } from "../models/User";

/**
 * Module init function
 */
module.exports = function (app: express.Application) {
  // Serialize sessions
  passport.serializeUser(function (user: UserModel, done) {
    done(undefined, user.id);
  });

  // Deserialize sessions
  passport.deserializeUser(function (id, done) {
    User.findOne({
      _id: id
    }, "-salt -password", function (err, user) {
      done(err, user);
    });
  });

  // Initialize strategies
  Config.getGlobbedPaths(path.join(__dirname, "./strategies/**/*.js"), undefined).forEach(function (strategy) {
    require(path.resolve(strategy))(Config.getInstance());
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
