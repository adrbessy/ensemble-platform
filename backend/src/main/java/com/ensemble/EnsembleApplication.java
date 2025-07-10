
package com.ensemble;

import com.ensemble.model.User;
import com.ensemble.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class EnsembleApplication {
    public static void main(String[] args) {
        SpringApplication.run(EnsembleApplication.class, args);
    }

    @Bean
    CommandLineRunner init(UserRepository userRepo) {
        return args -> {
            if (userRepo.count() == 0) {
                userRepo.save(new User("adrien", "adrien@mail.com"));
            }
        };
    }
}
