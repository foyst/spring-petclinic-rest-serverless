import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import {Protocol} from '@aws-cdk/aws-ecs';
import {ListenerAction} from "@aws-cdk/aws-elasticloadbalancingv2";

export class CdkStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'petclinic-vpc', {
        });

        // const mySqlInstance = new rds.DatabaseInstance(this, 'Instance', {
        //     engine: rds.DatabaseInstanceEngine.mysql({version: rds.MysqlEngineVersion.VER_8_0_23}),
        //     // optional, defaults to m5.large
        //     instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
        //     credentials: rds.Credentials.fromGeneratedSecret('syscdk'), // Optional - will default to 'admin' username and generated password
        //     vpc,
        //     vpcSubnets: {
        //         subnetType: ec2.SubnetType.ISOLATED
        //     }
        // });

        const ecsCluster = new ecs.Cluster(this, 'ecs-cluster', {
            vpc: vpc,
            clusterName: 'petclinic',
            enableFargateCapacityProviders: true
        });

        const ecsTaskDefinition = new ecs.FargateTaskDefinition(this, 'task-definition', {
            cpu: 512,
            memoryLimitMiB: 1024
        });

        ecsTaskDefinition.addContainer('petclinic', {
            cpu: 512,
            memoryLimitMiB: 1024,
            containerName: 'petclinic',
            essential: true,
            image: ecs.ContainerImage.fromAsset("../docker", {}),
            portMappings: [
                {containerPort: 8080, protocol: Protocol.TCP}
            ],
        })

        const ecsService = new ecs.FargateService(this, 'fargate-service', {
            cluster: ecsCluster,
            serviceName: 'petclinic',
            taskDefinition: ecsTaskDefinition
        });

        const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'load-balancer', {
            loadBalancerName: 'petclinic',
            vpc: vpc,
            internetFacing: true
        });

        const fargateTargetGroup = new elbv2.ApplicationTargetGroup(this, 'fargate-target-group', {
            vpc: vpc,
            protocol: elbv2.ApplicationProtocol.HTTP,
            targetGroupName: 'petclinic-fargate',
            targetType: elbv2.TargetType.IP,
            port: 8080
        })

        const listener = loadBalancer.addListener('listener', {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP
        });

        listener.addAction('petclinic-action', {
            action: ListenerAction.weightedForward([
                {targetGroup: fargateTargetGroup, weight: 1}
            ])
        });

        // attach service to load balancer
        ecsService.attachToApplicationTargetGroup(fargateTargetGroup)

        //
    }
}
