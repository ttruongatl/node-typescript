#!/bin/bash

# Set vars that typically do not vary by app
BRANCH=$(git rev-parse --symbolic-full-name --abbrev-ref HEAD)
SHA1=$(git rev-parse HEAD)
VERSION=$BRANCH-$SHA1-$(date +%s)
DESCRIPTION=$(git log -1 --pretty=%B)
DESCRIPTION=${DESCRIPTION:0:180} # truncate to 180 chars - max beanstalk version description is 200
ZIP=$VERSION.zip
EB_BUCKET=
EB_DEVELOPMENT_APP_NAME=
EB_DEVELOPMENT_ENV_NAME=
EB_AUTOMATION_TEST_APP_NAME=
EB_AUTOMATION_TEST_ENV_NAME=
DEPLOY_ENV=${1:-testing}
AWS_REGION=

echo "DEPLOY ENVIRONMENT: $DEPLOY_ENV"

aws configure set default.region $AWS_REGION

# Zip up the Dockerrun file (feel free to zip up an .ebextensions directory with it)
zip -j $ZIP aws/elastic-beanstalk/Dockerrun.aws.json

aws s3 cp $ZIP s3://$EB_BUCKET/$ZIP

# DEPLOY TO DEVELOPMENT SERVER
aws elasticbeanstalk create-application-version --application-name "$EB_DEVELOPMENT_APP_NAME" \
    --version-label $VERSION --description "$DESCRIPTION" --source-bundle S3Bucket=$EB_BUCKET,S3Key=$ZIP

# Update the environment to use the new application version
if [ -z "$EB_DEVELOPMENT_ENV_NAME" ]; then
    echo "EB_DEVELOPMENT_ENV_NAME is not set, skipping deployment step"
else
    aws elasticbeanstalk update-environment --environment-name $EB_DEVELOPMENT_ENV_NAME \
        --version-label $VERSION
fi

# Clean up
rm $ZIP
