# Spring Cloud Function / GraalVM Native demo

This repository demonstrates how to take a Spring Boot application, convert endpoints into AWS Lambda functions using `spring-cloud-function`, use the strangler-fig pattern to gradually migrate operations to serverless using CDK, and finally significantly improve the cold start time by building native binaries using GraalVM.

This example is based on the [Spring Petclinic codebase](https://github.com/spring-petclinic/spring-petclinic-rest), which represents a real-world example of a Spring Boot REST API, using Spring Data JPA backed to a MySQL DB.

The codebase is split up into branches that snapshot various milestones in this process, so you can see the gradual approach taken to get from containerised Spring Boot Application through to GraalVM-based Lambda functions.

## How to run

Start on the `master` branch.

In the root folder, run `cd cdk && npm install`

Run `./mvnw clean package` and copy the `target/spring-petclinic-rest-2.4.2.jar` file into the `docker` folder (TODO: need to streamline this into either the Maven or CDK build)

You can checkout the branches in this order, running `cdk deploy --require-approval=never --all` between each branch to see how you can gradually transition from ECS container, to Java Lambdas and finally GraalVM Lambdas:
```
master -> 1-spring-cloud-function -> 2-spring-cloud-native
```

You can also jump to any of these branches if you want to go straight to a particular phase

## Comparison between Java and GraalVM Lambdas

There is a `java-vs-native` branch, that stands up both Java 8 and GraalVM variants of the Lambda functions served on separate load balancers. You can use this branch to conduct performance comparisons between the two and also demonstrate how both variants can be built from the same codebase with minimal changes, all driven from Maven POM profiles.

## Teardown

When you're done with the above you can run this command to tear everything down:
```cdk destroy --require-approval=never --profile personal --all```

## Additional Petclinic Readme

If you'd like to know more about the Petclinic sample application, you can [view it's readme here](https://github.com/spring-petclinic/spring-petclinic-rest/blob/master/readme.md)
