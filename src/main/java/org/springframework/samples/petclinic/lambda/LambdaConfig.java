package org.springframework.samples.petclinic.lambda;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.samples.petclinic.model.Owner;
import org.springframework.samples.petclinic.service.ClinicService;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class LambdaConfig {

    private static final Logger LOG = LoggerFactory.getLogger(LambdaConfig.class);

    private ClinicService clinicService;

    private ObjectMapper objectMapper;

    final Pattern ownerByIdPattern;

    @Autowired
    public LambdaConfig(final ClinicService clinicService, final ObjectMapper objectMapper) {
        this.clinicService = clinicService;
        this.objectMapper = objectMapper;
        ownerByIdPattern = Pattern.compile("/api/owners/(\\d+)");
    }

    @Bean
    public Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> getAllOwners() {
        return (requestEvent) -> {
            LOG.info("Lambda Request for all Owners");
            final Collection<Owner> allOwners = this.clinicService.findAllOwners();
            try {
                return new APIGatewayProxyResponseEvent()
                    .withIsBase64Encoded(false)
                    .withBody(objectMapper.writeValueAsString(allOwners))
                    .withHeaders(buildDefaultHeaders())
                    .withStatusCode(200);
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        };
    }

    @Bean
    public Function<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> getOwnerById() {
        return (requestEvent) -> {
            LOG.info("Lambda Request for Owner");
            final Matcher matcher = ownerByIdPattern.matcher(requestEvent.getPath());
            if (matcher.matches()) {
                final Integer ownerId = Integer.valueOf(matcher.group(1));
                final Owner owner = this.clinicService.findOwnerById(ownerId);
                if (owner != null) {
                    return buildOwnerMessage(owner);
                } else return ownerNotFound();
            }
            else return ownerNotFound();
        };
    }

    private APIGatewayProxyResponseEvent buildOwnerMessage(Owner owner) {
        final Map<String, String> headers = buildDefaultHeaders();
        try {
            APIGatewayProxyResponseEvent responseEvent = new APIGatewayProxyResponseEvent()
                .withIsBase64Encoded(false)
                .withBody(objectMapper.writeValueAsString(owner))
                .withHeaders(headers)
                .withStatusCode(200);
            return responseEvent;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private Map<String, String> buildDefaultHeaders() {
        final Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        return headers;
    }

    private APIGatewayProxyResponseEvent ownerNotFound() {
        final Map<String, String> headers = buildDefaultHeaders();
        APIGatewayProxyResponseEvent responseEvent = new APIGatewayProxyResponseEvent()
            .withIsBase64Encoded(false)
            .withHeaders(headers)
            .withBody("")
            .withStatusCode(404);
        return responseEvent;
    }
}
