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
import java.util.function.Supplier;

@Configuration
public class LambdaConfig {

    private static final Logger LOG = LoggerFactory.getLogger(LambdaConfig.class);

    @Autowired
    private ClinicService clinicService;

    @Bean
    public Supplier<Collection<Owner>> getAllOwners() {
        return () -> {
            LOG.info("Lambda Request for all Owners");
            return this.clinicService.findAllOwners();
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
