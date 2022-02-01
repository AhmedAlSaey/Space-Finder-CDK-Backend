import { Stack } from "aws-cdk-lib";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { join } from "path";

export interface TableProps {
  tableName: string;
  primaryKey: string;
  createLambdaPath?: string;
  readLambdaPath?: string;
  updateLambdaPath?: string;
  deleteLambdaPath?: string;
  secondaryIndices?: string[];
}
export class GenericTable {
  private stack: Stack;
  private table: Table;
  private props: TableProps;

  private createLambda?: NodejsFunction;
  private readLambda?: NodejsFunction;
  private updateLambda?: NodejsFunction;
  private deleteLambda?: NodejsFunction;

  public createLamdaIntegration: LambdaIntegration;
  public readLamdaIntegration: LambdaIntegration;
  public updateLamdaIntegration: LambdaIntegration;
  public deleteLamdaIntegration: LambdaIntegration;

  public constructor(stack: Stack, props: TableProps) {
    this.props = props;
    this.stack = stack;
    this.initialize();
  }

  private initialize() {
    this.createTable();
    this.addSecondaryIndices();
    this.createLamdas();
    this.grantTableRights();
  }
  private createTable() {
    this.table = new Table(this.stack, this.props.tableName, {
      partitionKey: {
        name: this.props.primaryKey,
        type: AttributeType.STRING,
      },
      tableName: this.props.tableName,
    });
  }
  private createSingleLamda(lamdaName: string): NodejsFunction {
    const lamdaId = `${this.props.tableName}-${lamdaName}`;
    return new NodejsFunction(this.stack, lamdaId, {
      entry: join(
        __dirname,
        "..",
        "services",
        this.props.tableName,
        `${lamdaName}.ts`
      ),
      handler: "handler",
      functionName: lamdaId,
      environment: {
        TABLE_NAME: this.props.tableName,
        PRIMARY_KEY: this.props.primaryKey,
      },
    });
  }
  private createLamdas() {
    if (this.props.createLambdaPath) {
      this.createLambda = this.createSingleLamda(this.props.createLambdaPath);
      this.createLamdaIntegration = new LambdaIntegration(this.createLambda);
    }
    if (this.props.readLambdaPath) {
      this.readLambda = this.createSingleLamda(this.props.readLambdaPath);
      this.readLamdaIntegration = new LambdaIntegration(this.readLambda);
    }
    if (this.props.updateLambdaPath) {
      this.updateLambda = this.createSingleLamda(this.props.updateLambdaPath);
      this.updateLamdaIntegration = new LambdaIntegration(this.updateLambda);
    }
    if (this.props.deleteLambdaPath) {
      this.deleteLambda = this.createSingleLamda(this.props.deleteLambdaPath);
      this.deleteLamdaIntegration = new LambdaIntegration(this.deleteLambda);
    }
  }

  private addSecondaryIndices() {
    if (this.props.secondaryIndices) {
      for (const secondaryIndex of this.props.secondaryIndices) {
        this.table.addGlobalSecondaryIndex({
          indexName: secondaryIndex,
          partitionKey: {
            name: secondaryIndex,
            type: AttributeType.STRING,
          },
        });
      }
    }
  }

  private grantTableRights() {
    if (this.createLambda) {
      this.table.grantWriteData(this.createLambda);
    }
    if (this.readLambda) {
      this.table.grantReadData(this.readLambda);
    }
    if (this.updateLambda) {
      this.table.grantWriteData(this.updateLambda);
    }
    if (this.deleteLambda) {
      this.table.grantWriteData(this.deleteLambda);
    }
  }
}
