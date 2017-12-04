
/**
 * Module dependencies
 */

import { Authentication } from "../controllers/users.authentication.server.controller";
import { Password } from "../controllers/users.password.server.controller";

module.exports = function (app: any) {

  // Setting up the users authentication api
  app.route("/api/auth/signup").post(Authentication.signup);
  app.route("/api/auth/signin").post(Authentication.signin);
  app.route("/api/auth/signout").get(Authentication.signout);

  // Setting up the users password api
  app.route("/api/auth/forgot").post(Password.forgot);
  app.route("/api/auth/reset/:token").get(Password.validateResetToken);
  app.route("/api/auth/reset/:token").post(Password.reset);

  // Setting the oauth routes
  app.route("/api/auth/:strategy").get(Authentication.oauthCall);
  app.route("/api/auth/:strategy/callback").get(Authentication.oauthCallback);
};
