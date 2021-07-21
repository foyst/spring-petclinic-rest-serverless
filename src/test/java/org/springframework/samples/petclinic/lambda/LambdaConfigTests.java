/*
 * Copyright 2012-2020 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.springframework.samples.petclinic.lambda;

import com.amazonaws.services.lambda.runtime.events.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.cloud.function.adapter.aws.FunctionInvoker;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.converter.AbstractMessageConverter;
import org.springframework.samples.petclinic.PetClinicApplication;
import org.springframework.util.MimeType;
import reactor.core.publisher.Flux;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.fail;

/**
 *
 * @author Oleg Zhurakousky
 *
 */
public class LambdaConfigTests {

	ObjectMapper mapper = new ObjectMapper();

	String sampleLBEvent = "{\n" +
        "    \"requestContext\": {\n" +
        "        \"elb\": {\n" +
        "            \"targetGroupArn\": \"arn:aws:elasticloadbalancing:us-east-1:326898601910:targetgroup/petclinic-lambda-get-owner-by-id/fa7bf29574c85d8e\"\n" +
        "        }\n" +
        "    },\n" +
        "    \"httpMethod\": \"GET\",\n" +
        "    \"path\": \"/api/owners/25\",\n" +
        "    \"queryStringParameters\": {},\n" +
        "    \"headers\": {\n" +
        "        \"accept\": \"*/*\",\n" +
        "        \"accept-encoding\": \"gzip, deflate, br\",\n" +
        "        \"connection\": \"keep-alive\",\n" +
        "        \"host\": \"petclinic-1616387032.us-east-1.elb.amazonaws.com\",\n" +
        "        \"postman-token\": \"496ca963-71c8-422c-9c5a-341a6357aa99\",\n" +
        "        \"user-agent\": \"PostmanRuntime/7.25.0\",\n" +
        "        \"x-amzn-trace-id\": \"Root=1-60f49c43-6b86b59959a99be15ecbd477\",\n" +
        "        \"x-forwarded-for\": \"86.1.111.95\",\n" +
        "        \"x-forwarded-port\": \"80\",\n" +
        "        \"x-forwarded-proto\": \"http\"\n" +
        "    },\n" +
        "    \"body\": \"\",\n" +
        "    \"isBase64Encoded\": false\n" +
        "}";

	@BeforeEach
	public void before() throws Exception {
        System.setProperty("MAIN_CLASS", PetClinicApplication.class.getName());
		System.clearProperty("spring.cloud.function.routing-expression");
		System.clearProperty("spring.cloud.function.definition");
		this.getEnvironment().clear();
	}

    private Map<String, String> getEnvironment() throws Exception {
        Map<String, String> env = System.getenv();
        Field field = env.getClass().getDeclaredField("m");
        field.setAccessible(true);
        return (Map<String, String>) field.get(env);
    }

	@SuppressWarnings("rawtypes")
	@Test
	public void shouldReturn404WithEmptyBodyGivenUnknownOwnerId() throws Exception {
		System.setProperty("spring.cloud.function.definition", "getOwnerById");
		FunctionInvoker invoker = new FunctionInvoker();

		InputStream targetStream = new ByteArrayInputStream(this.sampleLBEvent.getBytes());
		ByteArrayOutputStream output = new ByteArrayOutputStream();
		invoker.handleRequest(targetStream, output, null);

		Map result = mapper.readValue(output.toByteArray(), Map.class);
		System.out.println(result);
		assertThat(result.get("statusCode")).isEqualTo(404);
		assertThat(result.get("body")).isEqualTo(null);
	}
}
