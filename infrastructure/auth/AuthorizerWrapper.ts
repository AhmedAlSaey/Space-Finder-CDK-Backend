import { CfnOutput } from "aws-cdk-lib";
import {
  CognitoUserPoolsAuthorizer,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import {
  UserPool,
  UserPoolClient,
  CfnUserPoolGroup,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { IdentityPoolWrapper } from "./IdentityPoolWrapper";

export class AuthorizerWrapper {
  private scope: Construct;
  private api: RestApi;

  private userPool: UserPool;
  private userPoolClient: UserPoolClient;
  public authorizer: CognitoUserPoolsAuthorizer;
  private identityPoolWrapper: IdentityPoolWrapper;

  constructor(scope: Construct, api: RestApi) {
    this.scope = scope;
    this.api = api;
    this.initializer();
  }

  private initializer = () => {
    this.createUserPool();
    this.addUserPoolClient();
    this.createAuthorizer();
    this.initializeIdentityPoolWrapper();
    this.createAdminsGroup();
  };

  private createUserPool = () => {
    this.userPool = new UserPool(this.api, "space-finder-user-pool", {
      userPoolName: "space-finder-user-pool",
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
    });
    new CfnOutput(this.scope, "UserPoolId", {
      value: this.userPool.userPoolId,
    });
  };

  private addUserPoolClient = () => {
    this.userPoolClient = this.userPool.addClient(
      "space-finder-user-pool-client",
      {
        userPoolClientName: "space-finder-user-pool-client",
        authFlows: {
          adminUserPassword: true,
          custom: true,
          userPassword: true,
          userSrp: true,
        },
        generateSecret: false,
      }
    );
    new CfnOutput(this.scope, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  };

  private createAuthorizer = () => {
    this.authorizer = new CognitoUserPoolsAuthorizer(
      this.scope,
      "space-finder-user-authorizer",
      {
        cognitoUserPools: [this.userPool],
        authorizerName: "space-finder-user-authorizer",
        identitySource: "method.request.header.Authorization",
      }
    );
    this.authorizer._attachToApi(this.api);
  };

  private initializeIdentityPoolWrapper() {
    this.identityPoolWrapper = new IdentityPoolWrapper(
      this.scope,
      this.userPool,
      this.userPoolClient
    );
  }

  private createAdminsGroup = () => {
    new CfnUserPoolGroup(this.scope, "admins", {
      groupName: "admin",
      userPoolId: this.userPool.userPoolId,
      roleArn: this.identityPoolWrapper.adminRole.roleArn,
    });
  };
}
