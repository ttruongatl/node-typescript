/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import * as _ from "lodash";
import * as glob from "glob";
import { environment } from "./env/environment";
import { environment_prod } from "./env/environment.prod";
import { environment_test } from "./env/environment.test";

export class Config {

  private env: any;
  public routeFiles: any;
  public modelFiles: any;
  public configFiles: any;
  public policyFiles: any;
  private static instance: Config;

  private constructor() {
    if (process.env.NODE_ENV === "production") {
      this.env = environment_prod;
    } else if (process.env.NODE_ENV === "test") {
      this.env = environment_test;
    }
    else {
      this.env = environment;
    }
  }

  static getInstance() {
    if (!Config.instance) {
      Config.instance = new Config();
      Config.instance.initGlobalConfigFiles();
    }
    return Config.instance;
  }

  public getEnv(): any {
    return this.env;
  }

  static getGlobbedPaths(globPatterns: any, excludes: any) {
    // URL paths regex
    const urlRegex = new RegExp("^(?:[a-z]+:)?\/\/", "i");

    // The output array
    let output = new Array();
    const getGlobbedPaths = Config.getGlobbedPaths;
    // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
    if (_.isArray(globPatterns)) {
      globPatterns.forEach(function (globPattern) {
        output = _.union(output, getGlobbedPaths(globPattern, excludes));
      });
    } else if (_.isString(globPatterns)) {
      if (urlRegex.test(globPatterns)) {
        output.push(globPatterns);
      } else {
        let files = glob.sync(globPatterns);
        if (excludes) {
          files = files.map(function (file: any) {
            if (_.isArray(excludes)) {
              for (const i in excludes) {
                if (excludes.hasOwnProperty(i)) {
                  file = file.replace(excludes[i], "");
                }
              }
            } else {
              file = file.replace(excludes, "");
            }
            return file;
          });
        }
        output = _.union(output, files);
      }
    }

    return output;
  }

  private initGlobalConfigFiles(): void {

    // Setting Globbed model files
    // config.files.server.models = getGlobbedPaths(assets.server.models);

    // Setting Globbed route files
    this.routeFiles = Config.getGlobbedPaths(this.env.files.routes, undefined);
    this.modelFiles = Config.getGlobbedPaths(this.env.files.models, undefined);
    this.configFiles = Config.getGlobbedPaths(this.env.files.configs, undefined);
    this.policyFiles = Config.getGlobbedPaths(this.env.files.policies, undefined);
  }
}
