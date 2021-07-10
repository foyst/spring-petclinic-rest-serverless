import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

interface RdsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
}

export class RdsStack extends cdk.Stack {

    rdsConfig: rds.DatabaseInstance

    constructor(scope: cdk.Construct, id: string, props?: RdsStackProps) {
        super(scope, id, props);

        const mySqlInstance = new rds.DatabaseInstance(this, 'Instance', {
            engine: rds.DatabaseInstanceEngine.mysql({version: rds.MysqlEngineVersion.VER_5_7_33}),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
            databaseName: 'petclinic',
            credentials: rds.Credentials.fromGeneratedSecret('syscdk'), // Optional - will default to 'admin' username and generated password
            vpc: props?.vpc!,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE
            }
        });

        this.rdsConfig = mySqlInstance
    }
}
