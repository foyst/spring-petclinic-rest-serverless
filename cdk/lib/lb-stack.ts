import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import {ApplicationListener, ApplicationLoadBalancer} from "@aws-cdk/aws-elasticloadbalancingv2";

interface LoadBalancerStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
}

export class LoadBalancerStack extends cdk.Stack {

    loadBalancer: ApplicationLoadBalancer
    listener: ApplicationListener;

    constructor(scope: cdk.Construct, id: string, props?: LoadBalancerStackProps) {
        super(scope, id, props);

        this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'load-balancer', {
            loadBalancerName: 'petclinic',
            vpc: props?.vpc!,
            internetFacing: true
        });

        this.listener = this.loadBalancer.addListener('listener', {
            port: 80,
            protocol: elbv2.ApplicationProtocol.HTTP
        });
    }
}
