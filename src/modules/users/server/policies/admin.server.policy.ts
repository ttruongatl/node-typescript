/**
 * Module dependencies
 */
import * as acl from "acl";
import * as express from "express";
// Using the memory backend
const aclInstance = new acl(new acl.memoryBackend());

/**
 * Invoke Admin Permissions
 */
exports.invokeRolesPolicies = function () {
  aclInstance.allow([{
    roles: ["admin"],
    allows: [{
      resources: "/api/users",
      permissions: "*"
    }, {
      resources: "/api/users/:userId",
      permissions: "*"
    }]
  }]);
};

/**
 * Check If Admin Policy Allows
 */
export function isAllowed (req: express.Request, res: express.Response, next: express.NextFunction) {
  const roles = (req.user) ? req.user.roles : ["guest"];

  // Check for user roles
  aclInstance.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send("Unexpected authorization error");
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: "User is not authorized"
        });
      }
    }
  });
}
