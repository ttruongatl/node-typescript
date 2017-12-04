
"use strict";

/**
 * Module dependencies
 */
import * as adminPolicy from "../policies/admin.server.policy";
import { Admin } from "../controllers/admin.server.controller";

module.exports = function (app: any) {
  // User route registration first. Ref: #713
  require("./users.server.routes.js")(app);

  // Users collection routes
  app.route("/api/users")
    .get(adminPolicy.isAllowed, Admin.list);

  // Single user routes
  app.route("/api/users/:userId")
    .get(adminPolicy.isAllowed, Admin.read)
    .put(adminPolicy.isAllowed, Admin.update)
    .delete(adminPolicy.isAllowed, Admin.delete);

  // Finish by binding the user middleware
  app.param("userId", Admin.userByID);
};
