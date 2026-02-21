package com.example.employee_service_mama;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableAsync
public class  EmployeeServiceMamaApplication {

	public static void main(String[] args) {
		SpringApplication.run(EmployeeServiceMamaApplication.class, args);
	}
}
