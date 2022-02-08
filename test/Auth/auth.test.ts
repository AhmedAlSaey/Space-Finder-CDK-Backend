import { AuthService } from "./AuthService";
import { config } from "./config";
import * as AWS from "aws-sdk";
import { BucketBase } from "aws-cdk-lib/aws-s3";
import { Aws } from "aws-cdk-lib";

AWS.config.region = config.REGION;

const getBuckets = async () => {
  let buckets;
  try {
    buckets = await new AWS.S3().listBuckets().promise();
  } catch (error) {
    buckets = undefined;
  }
  return buckets;
};

async function callStuff() {
  const authService = new AuthService();
  const user = await authService.login(
    config.TEST_USER_NAME,
    config.TEST_USER_PASSWORD
  );
  await authService.getAWSTemporaryCreds(user);
  //This line is impotant in order to access the credentials within the event object
  const someCreds = AWS.config.credentials;
  const buckets = await getBuckets();
  console.log("Done");
}

callStuff();
