
package com.finlend.controller;

import com.finlend.dto.*;
import com.finlend.service.LoanProductService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan-products")
public class LoanProductController {

    private final LoanProductService service;

    public LoanProductController(LoanProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<LoanProductResponse> getActiveProducts() {
        return service.getActiveProducts();
    }

    @GetMapping("/{id}")
    public LoanProductResponse getProduct(@PathVariable Long id) {
        return service.getActiveById(id);
    }

    @GetMapping("/admin/all")
    public List<LoanProductResponse> getAllProducts() {
        return service.getAllProducts();
    }

    @PostMapping
    public ResponseEntity<LoanProductResponse> create(
            @Valid @RequestBody LoanProductRequest request
    ) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.create(request));
    }

    @PutMapping("/{id}")
    public LoanProductResponse update(
            @PathVariable Long id,
            @Valid @RequestBody LoanProductRequest request
    ) {
        return service.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public LoanProductResponse changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody LoanProductStatusRequest request
    ) {
        return service.changeStatus(id, request);
    }
}
