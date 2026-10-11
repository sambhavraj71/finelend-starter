
package com.finlend.service;

import com.finlend.dto.*;
import com.finlend.entity.LoanProduct;
import com.finlend.repository.LoanProductRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class LoanProductService {

    private final LoanProductRepository repository;

    public LoanProductService(LoanProductRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public LoanProductResponse create(LoanProductRequest request) {
        validateRange(request);

        String code = normalizeCode(request.code());

        if (repository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Product code already exists"
            );
        }

        LoanProduct product = new LoanProduct();
        applyRequest(product, request);
        product.setCode(code);
        product.setActive(true);

        try {
            return toResponse(repository.saveAndFlush(product));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Product code already exists"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<LoanProductResponse> getActiveProducts() {
        return repository.findByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<LoanProductResponse> getAllProducts() {
        return repository.findAllByOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LoanProductResponse getActiveById(Long id) {
        LoanProduct product = findProduct(id);

        if (!product.isActive()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Loan product not found"
            );
        }

        return toResponse(product);
    }

    @Transactional
    public LoanProductResponse update(
            Long id, LoanProductRequest request
    ) {
        validateRange(request);

        LoanProduct product = findProduct(id);
        String code = normalizeCode(request.code());

        if (!product.getCode().equalsIgnoreCase(code)
                && repository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Product code already exists"
            );
        }

        applyRequest(product, request);
        product.setCode(code);

        try {
            return toResponse(repository.saveAndFlush(product));
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, "Product code already exists"
            );
        }
    }

    @Transactional
    public LoanProductResponse changeStatus(
            Long id, LoanProductStatusRequest request
    ) {
        LoanProduct product = findProduct(id);
        product.setActive(request.active());
        return toResponse(repository.saveAndFlush(product));
    }

    private LoanProduct findProduct(Long id) {
        return repository.findById(id).orElseThrow(() ->
            new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Loan product not found"
            )
        );
    }

    private void validateRange(LoanProductRequest request) {
        if (request.minAmount().compareTo(request.maxAmount()) > 0) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Minimum amount cannot exceed maximum amount"
            );
        }

        if (request.minTenureMonths() > request.maxTenureMonths()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Minimum tenure cannot exceed maximum tenure"
            );
        }
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }

    private void applyRequest(
            LoanProduct product, LoanProductRequest request
    ) {
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setMinAmount(request.minAmount());
        product.setMaxAmount(request.maxAmount());
        product.setAnnualInterestRate(
            request.annualInterestRate()
        );
        product.setMinTenureMonths(
            request.minTenureMonths()
        );
        product.setMaxTenureMonths(
            request.maxTenureMonths()
        );
    }

    private LoanProductResponse toResponse(LoanProduct product) {
        return new LoanProductResponse(
            product.getId(),
            product.getCode(),
            product.getName(),
            product.getDescription(),
            product.getMinAmount(),
            product.getMaxAmount(),
            product.getAnnualInterestRate(),
            product.getMinTenureMonths(),
            product.getMaxTenureMonths(),
            product.isActive(),
            product.getCreatedAt(),
            product.getUpdatedAt()
        );
    }
}
