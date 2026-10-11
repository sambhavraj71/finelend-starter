
package com.finlend.repository;

import com.finlend.entity.LoanProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanProductRepository
        extends JpaRepository<LoanProduct, Long> {

    boolean existsByCodeIgnoreCase(String code);

    List<LoanProduct> findByActiveTrueOrderByNameAsc();

    List<LoanProduct> findAllByOrderByNameAsc();
}
