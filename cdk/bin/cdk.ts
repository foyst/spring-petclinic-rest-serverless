#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import {VpcStack} from "../lib/vpc-stack";
import {RdsStack} from "../lib/rds-stack";
import {LoadBalancerStack} from "../lib/lb-stack";
import {EcsStack} from "../lib/ecs-stack";
import {LoadBalancerAssociationStack} from "../lib/lb-assoc-stack";
import {LambdaStack} from "../lib/lambda-stack";
import {Runtime} from "@aws-cdk/aws-lambda";
import {DockerImage} from "@aws-cdk/core";

const app = new cdk.App();

const vpcStack = new VpcStack(app, 'VpcStack')
const rdsStack = new RdsStack(app, 'RdsStack', {
    vpc: vpcStack.vpc
})
const javaLbStack = new LoadBalancerStack(app, 'JavaLBStack', {
    vpc: vpcStack.vpc,
    prefix: "java"
})
const graalVmLbStack = new LoadBalancerStack(app, 'GraalVMLBStack', {
    vpc: vpcStack.vpc,
    prefix: "graalvm"
})
const ecsStack = new EcsStack(app, 'ECSStack', {
    vpc: vpcStack.vpc,
    rdsConfig: rdsStack.rdsConfig
})
const javaLambdaStack = new LambdaStack(app, 'JavaLambdaStack', {
    vpc: vpcStack.vpc,
    prefix: "java",
    rdsConfig: rdsStack.rdsConfig,
    bundlingOptions: {
        image: Runtime.JAVA_8.bundlingImage,
        command:
            [
                "/bin/sh",
                "-c",
                ["cd /asset-input/ ",
                    "./mvnw clean package -P lambda,package-lambda-jar -DskipTests",
                    "cp /asset-input/target/spring-petclinic-rest-2.4.2-aws.jar /asset-output/"].join(" && ")
            ]
    },
    lambdaOptions: {
        runtime: Runtime.JAVA_8,
        handler: 'org.springframework.cloud.function.adapter.aws.FunctionInvoker',
        memorySize: 3072,
        envVariables: {'SPRING_PROFILES_ACTIVE': 'mysql,spring-data-jpa'}
    }
})
const graalvmLambdaStack = new LambdaStack(app, 'GraalVMLambdaStack', {
    vpc: vpcStack.vpc,
    prefix: "graalvm",
    rdsConfig: rdsStack.rdsConfig,
    bundlingOptions: {
        image: DockerImage.fromRegistry("ghcr.io/graalvm/graalvm-ce:21.2.0"),
        command:
            [
                "/bin/sh",
                "-c",
                ["cd /asset-input/ ",
                    "./mvnw clean package -DskipTests -P lambda,package-lambda-native",
                    "cp /asset-input/target/spring-petclinic-rest-2.4.2-native-zip.zip /asset-output/"].join(" && ")
            ]
    },
    lambdaOptions: {
        runtime: Runtime.PROVIDED_AL2,
        handler: 'duff.Class',
        memorySize: 256,
        envVariables: {'SPRING_PROFILES_ACTIVE': 'mysql,spring-data-jpa,native'}
    }
})
const javaLbAssociationStack = new LoadBalancerAssociationStack(app, 'JavaLBAssociationStack', {
    vpc: vpcStack.vpc,
    lbListener: javaLbStack.listener,
    ecsService: ecsStack.ecsService,
    prefix: "java",
    lambdaStack: javaLambdaStack
})
const graalVmLbAssociationStack = new LoadBalancerAssociationStack(app, 'GraalVMLBAssociationStack', {
    vpc: vpcStack.vpc,
    lbListener: graalVmLbStack.listener,
    ecsService: ecsStack.ecsService,
    prefix: "graalvm",
    lambdaStack: graalvmLambdaStack
})
