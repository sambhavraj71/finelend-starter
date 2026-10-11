
package com.finlend.repository;

import com.finlend.entity.LoanApplication;
import com.finlend.entity.LoanApplicationStatus;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LoanApplicationRepository
        extends JpaRepository<LoanApplication, Long> {

    @Query("""
        SELECT a
        FROM LoanApplication a
        WHERE a.customer.id = :customerId
        ORDER BY a.createdAt DESC
    """)
    List<LoanApplication> findByCustomer_IdOrderByCreatedAtDesc(
        @Param("customerId") Long customerId
    );

    long countByStatus(LoanApplicationStatus status);

    List<LoanApplication> findAllByOrderByCreatedAtDesc();

    @Query("""
        SELECT COUNT(a)
        FROM LoanApplication a
        WHERE a.customer.id = :customerId
    """)
    long countByCustomer_Id(
        @Param("customerId") Long customerId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT a
        FROM LoanApplication a
        WHERE a.id = :id
    """)
    Optional<LoanApplication> findByIdForUpdate(
        @Param("id") Long id
    );
}
