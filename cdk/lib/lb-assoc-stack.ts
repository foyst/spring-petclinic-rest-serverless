import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import {Construct, Duration} from '@aws-cdk/core';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import {ListenerAction, ListenerCondition} from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ecs from "@aws-cdk/aws-ecs/lib/fargate/fargate-service";
import * as targets from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import {LambdaStack} from "./lambda-stack";

interface LoadBalancerAssociationStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
    lbListener: elbv2.ApplicationListener
    ecsService: ecs.FargateService
    lambdaStack: LambdaStack
}

export class LoadBalancerAssociationStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: LoadBalancerAssociationStackProps) {
        super(scope, id, props);

        const fargateTargetGroup = new elbv2.ApplicationTargetGroup(this, 'fargate-target-group', {
            vpc: props?.vpc,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetGroupName: 'petclinic-fargate',
            targetType: elbv2.TargetType.IP,
            port: 8080,
            healthCheck: {
                path: '/actuator/health',
                enabled: true,
                healthyHttpCodes: '200',
                healthyThresholdCount: 2,
                interval: Duration.seconds(15),
                unhealthyThresholdCount: 2
            }
        })

        props?.lbListener.addAction('petclinic-default-action', {
            action: ListenerAction.weightedForward([
                {targetGroup: fargateTargetGroup, weight: 1}
            ]),
        });

        const getAllOwnersTargetGroup = new elbv2.ApplicationTargetGroup(this, 'get-all-owners-target-group', {
            vpc: props?.vpc,
            targetGroupName: 'petclinic-lambda-get-all-owners',
            targetType: elbv2.TargetType.LAMBDA,
            targets: [new targets.LambdaTarget(props?.lambdaStack.getAllOwnersFunction!)]
        })

        props?.lbListener.addAction('petclinic-owners-action', {
            conditions: [ListenerCondition.pathPatterns(['/api/owners'])],
            priority: 10,
            action: ListenerAction.weightedForward([
                {targetGroup: fargateTargetGroup, weight: 1},
                {targetGroup: getAllOwnersTargetGroup, weight: 1}
            ])
        });

        const getOwnerByIdTargetGroup = new elbv2.ApplicationTargetGroup(this, 'get-owner-by-id-target-group', {
            vpc: props?.vpc,
            targetGroupName: 'petclinic-lambda-get-owner-by-id',
            targetType: elbv2.TargetType.LAMBDA,
            targets: [new targets.LambdaTarget(props?.lambdaStack.getOwnerByIdFunction!)]
        })

        props?.lbListener.addAction('petclinic-owner-by-id-action', {
            conditions: [ListenerCondition.pathPatterns(['/api/owners/*'])],
            priority: 11,
            action: ListenerAction.weightedForward([
                {targetGroup: fargateTargetGroup, weight: 1},
                {targetGroup: getOwnerByIdTargetGroup, weight: 1}
            ])
        });

        // attach service to load balancer
        props?.ecsService.attachToApplicationTargetGroup(fargateTargetGroup)
    }
}
