#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SmartHomeStack } from '../lib/smart-home-stack';

const app = new cdk.App();

const env = app.node.tryGetContext('env');

if (env == null) {
  throw new Error('not found env');
}

new SmartHomeStack(app, `${env}-smart-home-stack`, { env });
