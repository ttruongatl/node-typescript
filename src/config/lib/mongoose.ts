/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import mongoose = require("mongoose");
import * as path from "path";
import * as _ from "lodash";
import { Config } from "./../config";
export class Mongoose {
  private env: any;
  constructor(env: any) {
    this.env = env;
  }

  public connect() {
    mongoose.Promise = global.Promise;
    const options = _.merge(this.env.db.options || {}, { useMongoClient: true });
    const isDebugMode = this.env.db.debug;
    const connection = mongoose.connect(this.env.db.uri, options, function (err) {
      // Log Error
      if (err) {
        console.error("Could not connect to MongoDB!");
        console.log(err);
      } else {
        // Enabling mongoose debug mode if required
        mongoose.set("debug", isDebugMode);
      }
    });
    return connection;
  }

  public loadModels(): void {
    Config.getInstance().modelFiles.forEach(function (modelPath: any) {
      require(path.resolve(modelPath));
    });
  }

  public disconnect() {
    mongoose.connection
      .close(function (err) {
        console.info("Disconnected from MongoDB.");
        return err;
      });
  }

}
