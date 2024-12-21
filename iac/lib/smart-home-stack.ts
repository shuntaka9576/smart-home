import * as cdk from 'aws-cdk-lib';
import { pascalCase } from 'change-case';
import type { Construct } from 'constructs';
import { SmartHomeAIAgentResource } from './smart-home-ai-agent-resource';
import { SmartHomeDataPlatformResource } from './smart-home-data-platform-resource';

type Props = {
  env: string;
} & cdk.StackProps;

export class SmartHomeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    const idPrefix = pascalCase(`${props.env}SmartHome`);
    new SmartHomeAIAgentResource(this, `${idPrefix}AIAgentResource`, {
      env: props.env,
    });
    new SmartHomeDataPlatformResource(this, `${idPrefix}DataPlatformResource`, {
      env: props.env,
    });
  }
}
