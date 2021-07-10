import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import {Construct} from '@aws-cdk/core';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import {ListenerAction} from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ecs from "@aws-cdk/aws-ecs/lib/fargate/fargate-service";

interface LoadBalancerAssociationStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
    lbListener: elbv2.ApplicationListener
    ecsService: ecs.FargateService
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
                healthyThresholdCount: 2
            }
        })

        props?.lbListener.addAction('petclinic-action', {
            action: ListenerAction.weightedForward([
                {targetGroup: fargateTargetGroup, weight: 1}
            ])
        });

        // attach service to load balancer
        props?.ecsService.attachToApplicationTargetGroup(fargateTargetGroup)
    }
}
