package org.springframework.samples.petclinic.lambda;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
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

@Configuration
public class LambdaConfig {

    private static final Logger LOG = LoggerFactory.getLogger(LambdaConfig.class);

    private ClinicService clinicService;

    private ObjectMapper objectMapper;

    @Autowired
    public LambdaConfig(final ClinicService clinicService, final ObjectMapper objectMapper) {
        this.clinicService = clinicService;
        this.objectMapper = objectMapper;
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
    public Function<Integer, Owner> getOwnerById() {
        return (ownerId) -> {
            LOG.info("Lambda Request for Owner with id: " + ownerId);
            final Owner owner = this.clinicService.findOwnerById(ownerId);
            return owner;
        };
    }
}
