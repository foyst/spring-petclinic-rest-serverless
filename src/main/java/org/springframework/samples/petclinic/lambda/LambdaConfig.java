package org.springframework.samples.petclinic.lambda;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.samples.petclinic.model.Owner;
import org.springframework.samples.petclinic.service.ClinicService;

import java.util.Collection;
import java.util.function.Function;

@Configuration
public class LambdaConfig {

    private static final Logger LOG = LoggerFactory.getLogger(LambdaConfig.class);

    @Autowired
    private ClinicService clinicService;

    @Bean
    public Function<Integer, Collection<Owner>> getAllOwners() {
        return ownerId -> {
            LOG.info("Request for Owner by Id");
            return this.clinicService.findAllOwners();
		};
    }
}
