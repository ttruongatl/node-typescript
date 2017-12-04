
/**
 * Module dependencies
 */
import * as passport from "passport";
import * as passportLocal from "passport-local";
import * as mongoose from "mongoose";
const LocalStrategy = passportLocal.Strategy;
const User = mongoose.model("User");

module.exports = function () {
  // Use local strategy
  passport.use(new LocalStrategy({
    usernameField: "usernameOrEmail",
    passwordField: "password"
  },
    function (usernameOrEmail, password, done) {
      User.findOne({
        $or: [{
          username: usernameOrEmail.toLowerCase()
        }, {
          email: usernameOrEmail.toLowerCase()
        }]
      }, function (err, user: any) {
        if (err) {
          return done(err);
        }
        if (!user || !user.authenticate(password)) {
          return done(undefined, false, {
            message: "Invalid username or password (" + (new Date()).toLocaleTimeString() + ")"
          });
        }
        return done(undefined, user);
      });
    }));
};
