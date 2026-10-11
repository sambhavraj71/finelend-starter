
package com.finlend.config;

import com.finlend.security.JwtAuthenticationFilter;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session -> session.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS))

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(
                                new HttpStatusEntryPoint(
                                        HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler(
                                (request, response, exception) -> response.setStatus(
                                        HttpServletResponse.SC_FORBIDDEN)))

                .authorizeHttpRequests(auth -> auth

                        // Internal error dispatch

                        .dispatcherTypeMatchers(
                                DispatcherType.ERROR)
                        .permitAll()

                        // Public authentication APIs

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/auth/register",
                                "/api/auth/login")
                        .permitAll()

                        // Public health endpoint

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/health")
                        .permitAll()

                        // Swagger documentation

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml")
                        .permitAll()

                        // Public active loan products

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/loan-products",
                                "/api/loan-products/{id}")
                        .permitAll()

                        // Admin-only loan product management

                        .requestMatchers(
                                "/api/loan-products/admin/**")
                        .hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/loan-products")
                        .hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/loan-products/{id}")
                        .hasRole("ADMIN")

                        .requestMatchers(
                                HttpMethod.PATCH,
                                "/api/loan-products/{id}/status")
                        .hasRole("ADMIN")

                        // Admin loan application listing

                        .requestMatchers(
                                "/api/loan-applications/admin/**")
                        .hasRole("ADMIN")

                        // Customer loan applications

                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/loan-applications")
                        .hasRole("CUSTOMER")

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/loan-applications/my",
                                "/api/loan-applications/{id}")
                        .hasRole("CUSTOMER")

                        // Customer loan account APIs

                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/loan-accounts/my",
                                "/api/loan-accounts/{id}",
                                "/api/loan-accounts/{id}/schedule",
                                "/api/loan-accounts/{id}/repayments")
                        .hasRole("CUSTOMER")

                        // Customer dashboard

                        .requestMatchers(
                                "/api/customer/**")
                        .hasRole("CUSTOMER")

                        // Admin operations:
                        // approvals, disbursements, repayments,
                        // EMI schedules, dashboards and reports

                        .requestMatchers(
                                "/api/admin/**")
                        .hasRole("ADMIN")

                        // Deny all unspecified endpoints

                        .anyRequest().denyAll())

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
