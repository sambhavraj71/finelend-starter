
package com.finlend.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlovalExceptionHandler {

        private ResponseEntity<Map<String, Object>> response(
                        HttpStatus status,
                        String message,
                        HttpServletRequest request) {
                Map<String, Object> body = new LinkedHashMap<>();

                body.put("timestamp", Instant.now().toString());
                body.put("status", status.value());
                body.put("error", status.getReasonPhrase());
                body.put("message", message);
                body.put("path", request.getRequestURI());

                return ResponseEntity.status(status).body(body);
        }

        @ExceptionHandler(ResponseStatusException.class)
        public ResponseEntity<Map<String, Object>> handleStatus(
                        ResponseStatusException exception,
                        HttpServletRequest request) {
                HttpStatus status = HttpStatus.resolve(
                                exception.getStatusCode().value());

                if (status == null) {
                        status = HttpStatus.INTERNAL_SERVER_ERROR;
                }

                String message = exception.getReason() != null
                                ? exception.getReason()
                                : status.getReasonPhrase();

                return response(status, message, request);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<Map<String, Object>> handleValidation(
                        MethodArgumentNotValidException exception,
                        HttpServletRequest request) {
                String message = exception.getBindingResult()
                                .getFieldErrors()
                                .stream()
                                .findFirst()
                                .map(error -> error.getField() + ": " +
                                                (error.getDefaultMessage() == null
                                                                ? "Invalid value"
                                                                : error.getDefaultMessage()))
                                .orElse("Validation failed");

                return response(
                                HttpStatus.BAD_REQUEST,
                                message,
                                request);
        }

        @ExceptionHandler(ConstraintViolationException.class)
        public ResponseEntity<Map<String, Object>> handleConstraint(
                        ConstraintViolationException exception,
                        HttpServletRequest request) {
                return response(
                                HttpStatus.BAD_REQUEST,
                                "Request validation failed",
                                request);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<Map<String, Object>> handleInvalidJson(
                        HttpMessageNotReadableException exception,
                        HttpServletRequest request) {
                return response(
                                HttpStatus.BAD_REQUEST,
                                "Invalid request body",
                                request);
        }
}
