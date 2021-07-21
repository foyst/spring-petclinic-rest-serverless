package org.springframework.samples.petclinic.lambda;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.GenericMessage;
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
    public Function<APIGatewayProxyRequestEvent, Message<Collection<Owner>>> getAllOwners() {
        return (requestEvent) -> {
            LOG.info("Lambda Request for all Owners");
            final Collection<Owner> allOwners = this.clinicService.findAllOwners();
            final Map<String, Object> headers = new HashMap<>();
            headers.put("Content-Type", "application/json");
            return new GenericMessage<>(allOwners, headers);
        };
    }

    @Bean
    public Function<APIGatewayProxyRequestEvent, Message<String>> getOwnerById() {
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

    private GenericMessage buildOwnerMessage(Owner owner) {
        final Map<String, Object> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        try {
            final String ownerJson = objectMapper.writeValueAsString(owner);
            return new GenericMessage(ownerJson, headers);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private Message<String> ownerNotFound() {
        final Map<String, Object> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("statusCode", 404);
        return new GenericMessage("", headers);
    }
}
