import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import {BundlingOutput, Duration} from '@aws-cdk/core';
import * as rds from "@aws-cdk/aws-rds";
import {Code, Function, Runtime} from "@aws-cdk/aws-lambda";
import * as path from "path";
import {homedir} from "os";

interface LambdaStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
    rdsConfig: rds.DatabaseInstance
}

export class LambdaStack extends cdk.Stack {
    getAllOwnersFunction: Function;
    getOwnerByIdFunction: Function;

    constructor(scope: cdk.Construct, id: string, props?: LambdaStackProps) {
        super(scope, id, props);

        const rdsCredentialsSecret = props?.rdsConfig.secret!

        const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'ecs-sg', {
            vpc: props?.vpc!,
            allowAllOutbound: true
        });

        const bundlingOptions = {
            bundling: {
                image: Runtime.JAVA_8.bundlingImage,
                command: [
                    "/bin/sh",
                    "-c",
                    ["cd /asset-input/ ",
                        // "ls -lsah ",
                        "./mvnw clean package -P lambda -DskipTests ",
                        "cp /asset-input/target/spring-petclinic-rest-2.4.2-aws.jar /asset-output/"].join(" && ")
                ],
                outputType: BundlingOutput.ARCHIVED,
                user: 'root',
                volumes: [{hostPath: `${homedir()}/.m2`, containerPath: '/root/.m2/'}]
            }
        };

        const envVariables = {
            'SPRING_DATASOURCE_URL': `jdbc:mysql://${props?.rdsConfig.dbInstanceEndpointAddress!}:3306/petclinic?useUnicode=true`,
            'SPRING_PROFILES_ACTIVE': 'mysql,spring-data-jpa',
            'SPRING_DATASOURCE_USERNAME': rdsCredentialsSecret.secretValueFromJson('username').toString(),
            'SPRING_DATASOURCE_PASSWORD': rdsCredentialsSecret.secretValueFromJson('password').toString()
        }

        const baseProps = {
            vpc: props?.vpc,
            runtime: Runtime.JAVA_8,
            code: Code.fromAsset(path.join(__dirname, '../../'), bundlingOptions),
            handler: 'org.springframework.cloud.function.adapter.aws.FunctionInvoker',
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE
            },
            memorySize: 3072,
            timeout: Duration.minutes(1),
            securityGroups: [lambdaSecurityGroup]
        }

        this.getAllOwnersFunction = new Function(this, 'GetAllOwnersFunction', {
            ...baseProps,
            functionName: 'get-all-owners',
            environment: {
                ...envVariables,
                'SPRING_CLOUD_FUNCTION_DEFINITION': 'getAllOwners'
            },
        })

        this.getOwnerByIdFunction = new Function(this, 'GetOwnerByIdFunction', {
            ...baseProps,
            functionName: 'get-owner-by-id',
            environment: {
                ...envVariables,
                'SPRING_CLOUD_FUNCTION_DEFINITION': 'getOwnerById'
            },
        })

        lambdaSecurityGroup.connections.allowTo(props?.rdsConfig!, ec2.Port.tcp(3306))
    }
}
