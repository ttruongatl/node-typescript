
/**
 * Module dependencies
 */

import { Profile } from "../controllers/users.profile.server.controller";
import { Authentication } from "../controllers/users.authentication.server.controller";
import { Password } from "../controllers/users.password.server.controller";
import * as authorization from "../controllers/users.authorization.server.controller";

module.exports = function (app: any) {

  // Setting up the users profile api
  app.route("/api/users/me").get(Profile.me);
  app.route("/api/users").put(Profile.update);
  app.route("/api/users/accounts").delete(Authentication.removeOAuthProvider);
  app.route("/api/users/password").post(Password.changePassword);
  app.route("/api/users/picture").post(Profile.changeProfilePicture);

  // Finish by binding the user middleware
  app.param("userId", authorization.userByID);
};
