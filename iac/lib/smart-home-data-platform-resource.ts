import dotenv from '@dotenvx/dotenvx';
import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway,
  aws_events,
  aws_events_targets,
  aws_lambda,
  aws_lambda_nodejs,
} from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { pascalCase } from 'change-case';
import type { Construct } from 'constructs';

interface Props {
  env: string;
}

export class SmartHomeDataPlatformResource extends cdk.Resource {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const resourcePrefix = `${props.env}-smart-home-data-platform`;
    const prismaCommandHooks = {
      beforeBundling(_inputDir: string, _outputDir: string): string[] {
        return [];
      },
      afterBundling(inputDir: string, outputDir: string): string[] {
        return [
          `cp ${inputDir}/node_modules/.pnpm/@prisma+client@6.0.1_prisma@6.0.1/node_modules/.prisma/client/libquery_engine-linux-arm64-openssl-3.0.x.so.node ${outputDir}`,
        ];
      },
      beforeInstall(_inputDir: string, _outputDir: string): string[] {
        return [];
      },
    };
    const saveHomeConditionFunction = new aws_lambda_nodejs.NodejsFunction(
      this,
      pascalCase(`${resourcePrefix}Function`),
      {
        functionName: `${resourcePrefix}-save-home-condition`,
        entry:
          '../apps/smart-home-data-platform/src/interfaces/lambda/eventbridge/store-home-condition-handler.ts',
        memorySize: 512,
        timeout: cdk.Duration.seconds(60),
        runtime: Runtime.NODEJS_22_X,
        architecture: aws_lambda.Architecture.ARM_64,
        environment: dotenv.config({
          path: '../apps/smart-home-data-platform/.env',
        }).parsed,
        bundling: {
          commandHooks: prismaCommandHooks,
        },
      }
    );

    new aws_events.Rule(
      this,
      pascalCase(`${resourcePrefix}Every15MinutesRule`),
      {
        schedule: aws_events.Schedule.cron({
          minute: '0,15,30,45',
          hour: '*',
          day: '*',
          month: '*',
          year: '*',
        }),
        targets: [
          new aws_events_targets.LambdaFunction(saveHomeConditionFunction),
        ],
      }
    );

    const restApiLambda = new aws_lambda_nodejs.NodejsFunction(
      this,
      pascalCase(`${resourcePrefix}APIFunction`),
      {
        functionName: `${resourcePrefix}-rest-api`,
        runtime: aws_lambda.Runtime.NODEJS_22_X,
        architecture: aws_lambda.Architecture.ARM_64,
        entry:
          '../apps/smart-home-data-platform/src/interfaces/lambda/api-gatway/rest-api-handler.ts',
        tracing: aws_lambda.Tracing.ACTIVE,
        loggingFormat: aws_lambda.LoggingFormat.JSON,
        timeout: cdk.Duration.seconds(60),
        environment: dotenv.config({
          path: '../apps/smart-home-data-platform/.env',
        }).parsed,
        bundling: {
          commandHooks: prismaCommandHooks,
        },
      }
    );

    const restApi = new aws_apigateway.LambdaRestApi(
      this,
      pascalCase(`${resourcePrefix}RESTAPI`),
      {
        restApiName: `${resourcePrefix}-rest-api`,
        handler: restApiLambda,
        defaultCorsPreflightOptions: {
          allowOrigins: ['*'],
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowHeaders: aws_apigateway.Cors.DEFAULT_HEADERS,
          maxAge: cdk.Duration.minutes(5),
        },
        deployOptions: {
          stageName: 'v1',
          tracingEnabled: true,
        },
        defaultMethodOptions: { apiKeyRequired: true },
      }
    );

    const plan = restApi.addUsagePlan(
      pascalCase(`${resourcePrefix}UsagePlan`),
      { name: resourcePrefix }
    );
    plan.addApiStage({ stage: restApi.deploymentStage });

    const apiKey = restApi.addApiKey(pascalCase(`${resourcePrefix}APIKey`), {
      apiKeyName: `${resourcePrefix}-development`,
    });
    plan.addApiKey(apiKey);
  }
}
