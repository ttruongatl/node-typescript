import * as bcrypt from "bcrypt-nodejs";
import * as crypto from "crypto";
import * as mongoose from "mongoose";
import * as validator from "validator";
import { Config } from "./../../../../config/config";
import * as owasp from "owasp-password-strength-test";
import * as generatePassword from "generate-password";

const env = Config.getInstance().getEnv();

export interface UserModel extends mongoose.Document {
  fullName: string;
  displayName: string;
  email: string;
  username: string;
  password: string;
  salt: string;
  profileImageURL: string;
  provider: string;
  providerData: {};
  additionalProvidersData: {};
  roles: String[];
  updated: Date;
  created: Date;
  /* For reset password */
  resetPasswordToken: String;
  resetPasswordExpires: Date;
  hashPassword: (password: string) => string;
  authenticate: (password: string) => boolean;
  findUniqueUsername: (username: string, suffix: any, callback: any) => void;
  generateRandomPassphrase: () => Promise<string>;
}

export type AuthToken = {
  accessToken: string,
  kind: string
};

/**
 * A Validation function for local strategy properties
 */
const validateLocalStrategyProperty = function (property: any) {
  return ((this.provider !== "local" && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy email
 */
const validateLocalStrategyEmail = function (email: any) {
  return ((this.provider !== "local" && !this.updated) || validator.isEmail(email, { require_tld: false }));
};

/**
 * A Validation function for username
 * - at least 3 characters
 * - only a-z0-9_-.
 * - contain at least one alphanumeric character
 * - not in list of illegal usernames
 * - no consecutive dots: "." ok, ".." nope
 * - not begin or end with "."
 */

const validateUsername = function (username: string) {
  const usernameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
  return (
    this.provider !== "local" ||
    (username && usernameRegex.test(username) && env.illegalUsernames.indexOf(username) < 0)
  );
};

/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
    default: "",
    validate: [validateLocalStrategyProperty, "Please fill in your full name"]
  },
  displayName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    index: {
      unique: true,
      sparse: true // For this to work on a previously indexed field, the index must be dropped & the application restarted.
    },
    lowercase: true,
    trim: true,
    default: "",
    validate: [validateLocalStrategyEmail, "Please fill a valid email address"]
  },
  username: {
    type: String,
    unique: "Username already exists",
    required: "Please fill in a username",
    validate: [validateLocalStrategyProperty, "Please fill in your username"],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    default: ""
  },
  salt: {
    type: String
  },
  profileImageURL: {
    type: String,
    default: ""
  },
  provider: {
    type: String,
    required: "Provider is required"
  },
  providerData: {},
  additionalProvidersData: {},
  roles: {
    type: [{
      type: String,
      enum: ["user", "admin"]
    }],
    default: ["user"],
    required: "Please provide at least one role"
  },
  updated: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  /* For reset password */
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
});


/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre("save", function (next) {
  if (this.password && this.isModified("password")) {
    this.salt = crypto.randomBytes(16).toString("base64");
    this.password = this.hashPassword(this.password);
  }

  next();
});

/**
 * Hook a pre validate method to test the local password
 */
UserSchema.pre("validate", function (next) {
  if (this.provider === "local" && this.password && this.isModified("password")) {
    const result = owasp.test(this.password);
    if (result.errors.length) {
      const error = result.errors.join(" ");
      this.invalidate("password", error);
    }
  }

  next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function (password: string) {
  if (this.salt && password) {
    return crypto.pbkdf2Sync(password, new Buffer(this.salt, "base64"), 10000, 64, "SHA1").toString("base64");
  } else {
    return password;
  }
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password: string) {
  return this.password === this.hashPassword(password);
};

/**
 * Find possible not used username
 */
UserSchema.methods.findUniqueUsername = function (username: string, suffix: any, callback: any) {
  const _this = this;
  const possibleUsername = username.toLowerCase() + (suffix || "");

  User.findOne({
    username: possibleUsername
  }, function (err: any, user: UserModel) {
    if (!err) {
      if (!user) {
        callback(possibleUsername);
      } else {
        return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
      }
    } else {
      callback(undefined);
    }
  });
};


/**
 * Generates a random passphrase that passes the owasp test
 * Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
 * NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
 */

UserSchema.methods.generateRandomPassphrase = function () {
  return new Promise(function (resolve, reject) {
    let password = "";
    const repeatingCharacters = new RegExp("(.)\\1{2,}", "g");

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 20 || repeatingCharacters.test(password)) {
      // build the random password
      password = generatePassword.generate({
        length: Math.floor(Math.random() * (20)) + 20, // randomize length between 20 and 40 characters
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true
      });

      // check if we need to remove any repeating characters
      password = password.replace(repeatingCharacters, "");
    }

    // Send the rejection back if the passphrase fails to pass the strength test
    if (owasp.test(password).errors.length) {
      reject(new Error("An unexpected problem occured while generating the random passphrase"));
    } else {
      // resolve with the validated passphrase
      resolve(password);
    }
  });
};

// export const User: UserType = mongoose.model<UserType>("User", userSchema);
const User: mongoose.Model<UserModel> = mongoose.model<UserModel>("User", UserSchema);
export default User;
