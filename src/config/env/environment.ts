export const environment = {
  app: {
    title: "MEAN.JS",
    description: "Full-Stack JavaScript with MongoDB, Express, AngularJS, and Node.js",
    keywords: "mongodb, express, angularjs, node.js, mongoose, passport",
    googleAnalyticsTrackingID: ""
  },
  db: {
    promise: global.Promise,
    uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || "mongodb://" + (process.env.DB_1_PORT_27017_TCP_ADDR || "localhost") + "/node-typescript",
    options: {
       useMongoClient: true
    },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  },
  port: 3000,
  host: "0.0.0.0",
  domain: process.env.DOMAIN || "http://localhost:3000",
  sessionCookie: {
    maxAge: 86400000,
    httpOnly: true,
    secure: false
  },
  sessionSecret: "MEAN",
  sessionKey: "sessionId",
  sessionCollection: "sessions",
  csrf: {
    csrf: false,
    csp: false,
    xframe: "SAMEORIGIN",
    p3p: "ABCDEF",
    xssProtection: true
  },
  logo: "modules/core/client/img/brand/logo.png",
  favicon: "modules/core/client/img/brand/favicon.ico",
  illegalUsernames: ["meanjs", "administrator", "password", "admin", "user",
    "unknown", "anonymous", "null", "undefined", "api"
  ],
  uploads: {
    profile: {
      image: {
        dest: "./modules/users/client/img/profile/uploads/",
        limits: {
          fileSize: 1048576
        }
      }
    }
  },
  shared: {
    owasp: {
      allowPassphrases: true,
      maxLength: 128,
      minLength: 10,
      minPhraseLength: 20,
      minOptionalTestsToPass: 4
    }
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.S3_BUCKET
    }
  },
  version: "0.4.0",
  files: {
    routes: ["modules/!(core)/server/routes/**/*.js", "modules/core/server/routes/**/*.js"],
    models: ["modules/!(core)/server/models/**/*.js", "modules/core/server/models/**/*.js"],
    configs: ["modules/!(core)/server/config/**/*.js", "modules/core/server/config/**/*.js"],
    policies: ["modules/!(core)/server/policies/**/*.js", "modules/core/server/policies/**/*.js"]
  }
};
