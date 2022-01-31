import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs";
import { Code, Function as LamdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda'
import { join } from 'path'
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { GenericTable } from "./GenericTable";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'

export class SpaceStack extends Stack {

    private api = new RestApi(this, 'SpaceApi')
    private spacesTable = new GenericTable('SpaceTable', 'spaceId', this)

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)
        
        const helloLamdaNodeJs = new NodejsFunction(this, 'helloLamdaNodeJs', {
            entry: join(__dirname, '..', 'services', 'node-lamda', 'hello.ts'),
            handler: 'handler'
        })
        const s3ListPolicy = new PolicyStatement()
        s3ListPolicy.addActions('s3:ListAllMyBuckets');
        s3ListPolicy.addResources('*')
        helloLamdaNodeJs.addToRolePolicy(s3ListPolicy)
        
        const helloLamdaIntegration = new LambdaIntegration(helloLamdaNodeJs)
        const helloFromLamdaResource = this.api.root.addResource('hello')
        helloFromLamdaResource.addMethod('GET', helloLamdaIntegration)
    }


}