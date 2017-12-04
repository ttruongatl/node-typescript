/**
 * @license
 * Copyright MIT. All Rights Reserved.
 *
 */

// import entire SDK
import aws = require("aws-sdk");
import { Config } from "../config";
import * as hbs from "express-hbs";
import * as handlebars from "handlebars";
import * as path from "path";
import * as fs from "fs";

const appEnv = Config.getInstance().getEnv();
aws.config.update({
  accessKeyId: appEnv.aws.accessKeyId,
  secretAccessKey: appEnv.aws.secretAccessKey,
  region: "us-east-1"
});

const ses = new aws.SES({ apiVersion: "2010-12-01" });

export class Mailer {
  private from = "smisy@smisy.io";

  constructor() {}

  private generateEmail(templatePath: string, parameter: any): string {
    let htmlExport: string = undefined;
    const htmlData = fs.readFileSync(path.resolve(templatePath), "utf-8");
    const template = handlebars.compile(htmlData);
    htmlExport = template(parameter);

    return htmlExport;
  }

  public sendEmail(to: string[], subject: string, templatePath: string, parameter: any): Promise<aws.SES.SendEmailResponse> {
    const body = this.generateEmail(templatePath, parameter);

    const sendEmailReq: aws.SES.SendEmailRequest = {
      Source: this.from,
      Destination: { ToAddresses: to },
      Message: {
        Subject: {
          Data: subject
        },
        Body: {
          Html: {
            Data: body
          }
        }
      }
    };
    const promise = new Promise<aws.SES.SendEmailResponse>(function (resolve, reject) {
      ses.sendEmail(sendEmailReq, function (err: aws.AWSError, data: aws.SES.SendEmailResponse) {
        if (err) {
          resolve(undefined);
          throw err;
        } else {
          resolve(data);
        }
      });
    });

    return promise;
  }
}
