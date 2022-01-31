import { Stack, StackProps } from "aws-cdk-lib"
import { Construct } from "constructs";
import { Code, Function as LamdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda'
import { join } from 'path'
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { GenericTable } from "./GenericTable";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class SpaceStack extends Stack {

    private api = new RestApi(this, 'SpaceApi')
    private spacesTable = new GenericTable('SpaceTable', 'spaceId', this)

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)
        const helloLamda = new LamdaFunction(this, 'helloLamda', {
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset(join(__dirname, '..', 'services', 'hello')),
            handler: 'hello.main'
        })
        const helloLamdaNodeJs = new NodejsFunction(this, 'helloLamdaNodeJs', {
            entry: join(__dirname, '..', 'services', 'node-lamda', 'hello.ts'),
            handler: 'handler'
        })
        const helloLamdaIntegration = new LambdaIntegration(helloLamda)
        const helloFromLamdaResource = this.api.root.addResource('hello')
        helloFromLamdaResource.addMethod('GET', helloLamdaIntegration)
    }


}