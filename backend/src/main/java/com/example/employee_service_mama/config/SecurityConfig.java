package com.example.employee_service_mama.config;


import com.example.employee_service_mama.util.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        int saltLength = 16;   // 16 bytes
        int hashLength = 32;   // 32 bytes
        int parallelism = 1;   // currently recommended
        int memory = 65536;    // 64MB
        int iterations = 3;    // recommended minimum
        return new Argon2PasswordEncoder(saltLength, hashLength, parallelism, memory, iterations);
    }
    @Bean
    public SecurityFilterChain filterchain(HttpSecurity http, JwtFilter jwtfilter) throws Exception{
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {}) // 👈 VERY IMPORTANT: enable CORS for Spring Security
                .authorizeHttpRequests(auth->
                        auth.requestMatchers("/api/user/signin","/api/user/forgot-password","/api/user/reset-password","/api/attendance/login/{userId}","/api/user/add","/ws/**","/topic/**","/app/**","api/attendance/user/{userId}","/api/attendance/test/**").permitAll()
                                .anyRequest().authenticated()). addFilterBefore(jwtfilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

}
