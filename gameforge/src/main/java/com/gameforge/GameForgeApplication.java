package com.gameforge;

import com.gameforge.autoconfigure.PostgresDatabaseBootstrapAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication
@ComponentScan(
    excludeFilters =
        @ComponentScan.Filter(
            type = FilterType.ASSIGNABLE_TYPE,
            classes = PostgresDatabaseBootstrapAutoConfiguration.class))
public class GameForgeApplication {

  public static void main(String[] args) {
    SpringApplication.run(GameForgeApplication.class, args);
  }
}
