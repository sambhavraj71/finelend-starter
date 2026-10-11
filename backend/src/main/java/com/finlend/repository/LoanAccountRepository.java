
package com.finlend.repository;

import com.finlend.entity.LoanAccount;
import com.finlend.entity.LoanAccountStatus;
import java.math.BigDecimal;
import org.springframework.data.jpa.repository.Query;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LoanAccountRepository
        extends JpaRepository<LoanAccount, Long> {

    boolean existsByLoanApplication_Id(Long applicationId);
    
    long countByStatus(LoanAccountStatus status);

    @Query("""
        SELECT SUM(a.outstandingPrincipal)
        FROM LoanAccount a
        WHERE a.status = :status
    """)
    BigDecimal sumOutstandingPrincipalByStatus(
        @org.springframework.data.repository.query.Param("status")
        LoanAccountStatus status
    );
    long countByLoanApplication_Customer_Id(Long customerId);

    Optional<LoanAccount> findByLoanApplication_Id(
        Long applicationId
    );

    List<LoanAccount>
        findByLoanApplication_Customer_IdOrderByCreatedAtDesc(
            Long customerId
        );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM LoanAccount a WHERE a.id = :id")
    Optional<LoanAccount> findByIdForUpdate(
        @Param("id") Long id
    );
}
