
package com.finlend.repository;

import com.finlend.entity.EmiInstallment;
import com.finlend.entity.EmiPaymentStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import com.finlend.entity.EmiPaymentStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.List;
import java.util.Optional;

public interface EmiInstallmentRepository
        extends JpaRepository<EmiInstallment, Long> {

    boolean existsByLoanAccount_Id(Long loanAccountId);

    long countByPaymentStatus(EmiPaymentStatus status);

    List<EmiInstallment> findByLoanAccount_IdOrderByInstallmentNumberAsc(
            Long loanAccountId);

    Optional<EmiInstallment> findFirstByLoanAccount_IdAndPaymentStatusInOrderByInstallmentNumberAsc(
            Long loanAccountId,
            List<EmiPaymentStatus> statuses);

    long countByLoanAccount_IdAndPaymentStatusNot(
            Long loanAccountId,
            EmiPaymentStatus status);

    @Query("""
                SELECT e
                FROM EmiInstallment e
                JOIN FETCH e.loanAccount a
                WHERE e.paymentStatus IN :statuses
                AND e.dueDate < :today
                ORDER BY e.dueDate ASC, e.id ASC
            """)
    List<EmiInstallment> findOverdueInstallments(
            @Param("statuses") Collection<EmiPaymentStatus> statuses,
            @Param("today") LocalDate today);

}
