import dotenv from '@dotenvx/dotenvx';
import * as cdk from 'aws-cdk-lib';
import { aws_iam, aws_lambda } from 'aws-cdk-lib';
import { pascalCase } from 'change-case';
import type { Construct } from 'constructs';

interface Props {
  env: string;
}

export class SmartHomeAIAgentResource extends cdk.Resource {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    const resourcePrefix = `${props.env}-smart-home-ai-agent`;

    const lambdaFunction = new aws_lambda.DockerImageFunction(
      this,
      `${pascalCase(resourcePrefix)}Function`,
      {
        functionName: `${props.env}-${resourcePrefix}`,
        code: aws_lambda.DockerImageCode.fromImageAsset('..', {
          file: 'apps/smart-home-ai-agent/Dockerfile',
          cacheDisabled: false,
        }),
        memorySize: 512,
        timeout: cdk.Duration.minutes(10),
        architecture: aws_lambda.Architecture.ARM_64,
        environment: dotenv.config({
          path: '../apps/smart-home-ai-agent/.env',
        }).parsed,
      }
    );

    lambdaFunction.addToRolePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: ['arn:aws:bedrock:us-east-1::foundation-model/*'],
      })
    );

    lambdaFunction.addFunctionUrl({
      authType: aws_lambda.FunctionUrlAuthType.NONE, // FIXME: 公開しっぱなし注意
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [aws_lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
      },
    });
  }
}
