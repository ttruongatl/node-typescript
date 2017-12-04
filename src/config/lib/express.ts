
/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import * as express from "express";
import { Config } from "./../config";
import * as _ from "lodash";
import * as compress from "compression";
import * as bodyParser from "body-parser";
import * as path from "path";
import * as session from "express-session";
import * as connectMongo from "connect-mongo";

import * as lusca from "lusca";
import * as hbs from "express-hbs";
import * as passport from "passport";
import * as passportLocal from "passport-local";
const LocalStrategy = passportLocal.Strategy;
import * as morgan from "morgan";
import * as errorHandler from "errorhandler";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";

export class Express {
  private env: any;
  private app: express.Application;
  private config: Config;

  constructor(env: any) {
    this.env = env;
    this.app = express();
    this.config = Config.getInstance();
  }

  private initLocalVariables(): void {
    // Setting application local variables
    this.app.locals.title = this.env.app.title;
    // this.app.locals.description = this.app.env.description;
    if (this.env.secure && this.env.secure.ssl === true) {
      this.app.locals.secure = this.env.secure.ssl;
    }
    this.app.locals.keywords = this.env.app.keywords;
    this.app.locals.googleAnalyticsTrackingID = this.env.app.googleAnalyticsTrackingID;
    this.app.locals.logo = this.env.logo;
    this.app.locals.favicon = this.env.favicon;
    this.app.locals.env = process.env.NODE_ENV;
    this.app.locals.domain = this.env.domain;

    // Passing the request url to environment locals
    this.app.use(function (req, res, next) {
      res.locals.host = req.protocol + "://" + req.hostname;
      res.locals.url = req.protocol + "://" + req.headers.host + req.originalUrl;
      next();
    });
  }

  private initMiddleware(): void {

    // Environment dependent middleware
    if (process.env.NODE_ENV === "development") {
      // Disable views cache
      this.app.set("view cache", false);
    } else if (process.env.NODE_ENV === "production") {
      this.app.locals.cache = "memory";
    }

    this.app.use(cors());

    // Request body parsing middleware should be above methodOverride
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));
    this.app.use(bodyParser.json());

    this.app.use(cookieParser());
  }

  private initViewEngine(): void {
    this.app.engine("html", hbs.express4({
      extname: ".html"
    }));
    this.app.set("view engine", "html");
    this.app.set("views", path.resolve("./"));
  }

  private initSession(connection: any) {
    const MongoStore = connectMongo(session);

    // Express MongoDB session storage
    this.app.use(session({
      saveUninitialized: true,
      resave: true,
      secret: this.env.sessionSecret,
      cookie: {
        maxAge: this.env.sessionCookie.maxAge,
        httpOnly: this.env.sessionCookie.httpOnly,
        secure: this.env.sessionCookie.secure && this.env.secure.ssl
      },
      name: this.env.sessionKey,
      store: new MongoStore({
        mongooseConnection: connection,
        collection: this.env.sessionCollection
      })
    }));

    // Add Lusca CSRF Middleware
    this.app.use(lusca.xframe("SAMEORIGIN"));
    this.app.use(lusca.xssProtection(true));
  }

  private initModulesServerRoutes() {
    // Globbing routing files
    const app = this.app;
    Config.getInstance().routeFiles.forEach(function (routePath: string) {
      require(path.resolve(routePath))(app);
    });
  }

  private initErrorRoutes(): void {

    this.app.use(errorHandler());
  }

  private initModulesConfiguration(): void {
    const app = this.app;
    Config.getInstance().configFiles.forEach(function (configPath: string) {
      require(path.resolve(configPath))(app);
    });
  }

  /**
   * Configure the modules ACL policies
   */
  private initModulesServerPolicies(): void {
    // Globbing policy files
    Config.getInstance().policyFiles.forEach(function (policyPath: string) {
      require(path.resolve(policyPath)).invokeRolesPolicies();
    });
  }

  public init(connection: any): express.Application {
    this.initLocalVariables();
    this.initMiddleware();
    this.initViewEngine();
    if (connection) {
      this.initSession(connection);
    }
    this.initErrorRoutes();
    this.initModulesConfiguration();
    this.initModulesServerPolicies();
    this.initModulesServerRoutes();

    return this.app;
  }
}
