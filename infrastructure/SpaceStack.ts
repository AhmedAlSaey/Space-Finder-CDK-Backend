import { CfnOutput, Fn, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  Code,
  Function as LamdaFunction,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import {
  AuthorizationType,
  LambdaIntegration,
  MethodOptions,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { GenericTable } from "./GenericTable";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { AuthorizerWrapper } from "./auth/AuthorizerWrapper";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { WebAppDeployment } from "./WebAppDeployment";

export class SpaceStack extends Stack {
  private api = new RestApi(this, "SpaceApi");
  private authorizer: AuthorizerWrapper;
  private suffix: string;
  private spacesPhotoBucket: Bucket;

  // private spacesTable = new GenericTable('SpaceTable', 'spaceId', this)
  private spacesTable = new GenericTable(this, {
    primaryKey: "spaceId",
    tableName: "SpaceTable",
    createLambdaPath: "Create",
    readLambdaPath: "Read",
    updateLambdaPath: "Update",
    deleteLambdaPath: "Delete",
    secondaryIndices: ["location"],
  });

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.initializeSuffix();

    this.initializeSpacesPhotosBucket();
    this.authorizer = new AuthorizerWrapper(
      this,
      this.api,
      this.spacesPhotoBucket.bucketArn + "/*"
    );
    // new WebAppDeployment(this, this.suffix);

    const helloLamdaNodeJs = new NodejsFunction(this, "helloLamdaNodeJs", {
      entry: join(__dirname, "..", "services", "node-lamda", "hello.ts"),
      handler: "handler",
    });
    const s3ListPolicy = new PolicyStatement();
    s3ListPolicy.addActions("s3:ListAllMyBuckets");
    s3ListPolicy.addResources("*");
    helloLamdaNodeJs.addToRolePolicy(s3ListPolicy);

    let authorizerOptions: MethodOptions = {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: {
        authorizerId: this.authorizer.authorizer.authorizerId,
      },
    };

    // Hello API Lamda Integrations
    const helloLamdaIntegration = new LambdaIntegration(helloLamdaNodeJs);
    const helloFromLamdaResource = this.api.root.addResource("hello");
    helloFromLamdaResource.addMethod(
      "GET",
      helloLamdaIntegration,
      authorizerOptions
    );

    // Spaces API integrations:
    const spaceResources = this.api.root.addResource("spaces");
    spaceResources.addMethod("POST", this.spacesTable.createLamdaIntegration);
    spaceResources.addMethod("GET", this.spacesTable.readLamdaIntegration);
    spaceResources.addMethod("PUT", this.spacesTable.updateLamdaIntegration);
    spaceResources.addMethod("DELETE", this.spacesTable.deleteLamdaIntegration);
  }

  private initializeSuffix() {
    const shortStackId = Fn.select(2, Fn.split("/", this.stackId));
    this.suffix = Fn.select(4, Fn.split("-", shortStackId));
  }

  private initializeSpacesPhotosBucket() {
    this.spacesPhotoBucket = new Bucket(this, "spaces-photos", {
      bucketName: "spaces-photos-" + this.suffix,
      cors: [
        {
          // The below makes the bucket public
          allowedMethods: [HttpMethods.HEAD, HttpMethods.GET, HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    new CfnOutput(this, "spaces-photos-bucket-name", {
      value: this.spacesPhotoBucket.bucketName,
    });
  }
}
