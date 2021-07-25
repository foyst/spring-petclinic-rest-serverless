#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import {VpcStack} from "../lib/vpc-stack";
import {RdsStack} from "../lib/rds-stack";
import {LoadBalancerStack} from "../lib/lb-stack";
import {EcsStack} from "../lib/ecs-stack";
import {LoadBalancerAssociationStack} from "../lib/lb-assoc-stack";
import {LambdaStack} from "../lib/lambda-stack";

const app = new cdk.App();

const vpcStack = new VpcStack(app, 'VpcStack')
const rdsStack = new RdsStack(app, 'RdsStack', {
    vpc: vpcStack.vpc
})
const lbStack = new LoadBalancerStack(app, 'LBStack', {
    vpc: vpcStack.vpc
})
const ecsStack = new EcsStack(app, 'ECSStack', {
    vpc: vpcStack.vpc,
    rdsConfig: rdsStack.rdsConfig
})
const lambdaStack = new LambdaStack(app, 'LambdaStack', {
    vpc: vpcStack.vpc,
    rdsConfig: rdsStack.rdsConfig
})
const lbAssociationStack = new LoadBalancerAssociationStack(app, 'LBAssociationStack', {
    vpc: vpcStack.vpc,
    lbListener: lbStack.listener,
    ecsService: ecsStack.ecsService,
    lambdaStack: lambdaStack
})

