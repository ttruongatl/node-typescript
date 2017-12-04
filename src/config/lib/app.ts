/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

import * as express from "express";
import { Express } from "./express";

import * as bodyParser from "body-parser";
import * as passport from "passport";
import * as passportLocal from "passport-local";
import * as http from "http";
import { Config } from "../config";
import { Mongoose } from "./mongoose";

export class App {
    private app: express.Application;
    private env: any;
    constructor() {
        this.env  = Config.getInstance().getEnv();
    }

    private init(): void {
        const config = this.env;
        const mongoose = new Mongoose(config);
        const connection = mongoose.connect();
        mongoose.loadModels();
        this.app = new Express(config).init(connection);
    }

    public start() {
        this.init();
        const __this = this;
        // Start the app by listening on <port> at <host>
        this.app.listen(this.env.port, this.env.host, function () {
            // Create server URL
            const server = (process.env.NODE_ENV === "secure" ? "https://" : "http://") + __this.env.host + ":" + __this.env.port;
            // Logging initialization
            console.log("--");
            console.log(__this.env.app.title);
            console.log();
            console.log("Environment:     " + process.env.NODE_ENV);
            console.log("Server:          " + server);
            console.log("Database:        " + __this.env.db.uri);
            console.log("App version:     " + __this.env.version);
        });

        return this.app;
    }
}
