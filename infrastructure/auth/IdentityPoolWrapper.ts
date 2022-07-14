import { CfnOutput } from "aws-cdk-lib";
import {
  UserPool,
  UserPoolClient,
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
} from "aws-cdk-lib/aws-cognito";
import {
  Effect,
  FederatedPrincipal,
  PolicyStatement,
  Role,
} from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class IdentityPoolWrapper {
  private scope: Construct;

  private userPool: UserPool;
  private userPoolClient: UserPoolClient;
  private identityPool: CfnIdentityPool;
  private authenticatedRole: Role;
  private unAuthenticatedRole: Role;
  private photoBucketArn: string;
  public adminRole: Role;

  constructor(
    scope: Construct,
    userPool: UserPool,
    userPoolClient: UserPoolClient,
    photoBucketArn: string
  ) {
    this.scope = scope;
    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
    this.photoBucketArn = photoBucketArn;
    this.initialize();
  }
  private initialize() {
    this.initializeIdentityPool();
    this.initializeRoles();
    this.attachRoles();
  }

  private initializeIdentityPool() {
    this.identityPool = new CfnIdentityPool(
      this.scope,
      "space-finder-identity-pool",
      {
        allowUnauthenticatedIdentities: true,
        cognitoIdentityProviders: [
          {
            clientId: this.userPoolClient.userPoolClientId,
            providerName: this.userPool.userPoolProviderName,
          },
        ],
      }
    );
    new CfnOutput(this.scope, "identity-pool-id", {
      value: this.identityPool.ref,
    });
  }

  private initializeRoles() {
    this.authenticatedRole = new Role(
      this.scope,
      "cognito-default-authenticated-role",
      {
        assumedBy: new FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "authenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );

    this.unAuthenticatedRole = new Role(
      this.scope,
      "cognito-default-unauthenticated-role",
      {
        assumedBy: new FederatedPrincipal(
          "cognito-identity.amazonaws.com",
          {
            StringEquals: {
              "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
            },
            "ForAnyValue:StringLike": {
              "cognito-identity.amazonaws.com:amr": "unauthenticated",
            },
          },
          "sts:AssumeRoleWithWebIdentity"
        ),
      }
    );

    this.adminRole = new Role(this.scope, "cognito-admin-role", {
      assumedBy: new FederatedPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
    });

    this.adminRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:ListAllMyBuckets", "s3:PutObject", "s3:PutObjectAcl"],
        resources: [this.photoBucketArn],
      })
    );
  }

  private attachRoles() {
    new CfnIdentityPoolRoleAttachment(this.scope, "roles-attachment", {
      identityPoolId: this.identityPool.ref,
      roles: {
        authenticated: this.authenticatedRole.roleArn,
        unauthenticated: this.unAuthenticatedRole.roleArn,
      },
      roleMappings: {
        adminsMapping: {
          type: "Token",
          ambiguousRoleResolution: "AuthenticatedRole",
          identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
        },
      },
    });
  }
}
