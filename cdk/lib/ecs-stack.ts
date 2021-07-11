import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as ecs from '@aws-cdk/aws-ecs';
import {Protocol} from '@aws-cdk/aws-ecs';
import * as rds from "@aws-cdk/aws-rds";
import {Duration} from "@aws-cdk/core";

interface EcsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
    rdsConfig: rds.DatabaseInstance
}

export class EcsStack extends cdk.Stack {

    ecsService: ecs.FargateService

    constructor(scope: cdk.Construct, id: string, props?: EcsStackProps) {
        super(scope, id, props);

        const ecsCluster = new ecs.Cluster(this, 'ecs-cluster', {
            vpc: props?.vpc,
            clusterName: 'petclinic',
            enableFargateCapacityProviders: true
        });

        const ecsTaskDefinition = new ecs.FargateTaskDefinition(this, 'task-definition', {
            cpu: 512,
            memoryLimitMiB: 1024
        });

        const rdsCredentialsSecret = props?.rdsConfig.secret!

        ecsTaskDefinition.addContainer('petclinic', {
            cpu: 512,
            memoryLimitMiB: 1024,
            containerName: 'petclinic',
            essential: true,
            image: ecs.ContainerImage.fromAsset("../docker", {}),
            portMappings: [
                {containerPort: 8080, protocol: Protocol.TCP}
            ],
            environment: {
                'SPRING_DATASOURCE_URL': `jdbc:mysql://${props?.rdsConfig.dbInstanceEndpointAddress!}:3306/petclinic?useUnicode=true`,
                'SPRING_PROFILES_ACTIVE': 'mysql,spring-data-jpa'
            },
            secrets: {
                'SPRING_DATASOURCE_USERNAME': ecs.Secret.fromSecretsManager(rdsCredentialsSecret, 'username'),
                'SPRING_DATASOURCE_PASSWORD': ecs.Secret.fromSecretsManager(rdsCredentialsSecret, 'password')
            },
            logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'PetClinicContainer' })
        })

        const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ecs-sg', {
            vpc: props?.vpc!,
            allowAllOutbound: true
        });

        this.ecsService = new ecs.FargateService(this, 'fargate-service', {
            cluster: ecsCluster,
            serviceName: 'petclinic',
            taskDefinition: ecsTaskDefinition,
            securityGroups: [ecsSecurityGroup],
            healthCheckGracePeriod: Duration.minutes(1)
        });

        ecsSecurityGroup.connections.allowTo(props?.rdsConfig!, ec2.Port.tcp(3306))
    }
}
