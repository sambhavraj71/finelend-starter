
package com.finlend.repository;

import com.finlend.entity.EmiPayment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.finlend.entity.EmiInstallment;
import com.finlend.entity.EmiPaymentStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.math.BigDecimal;
import java.util.List;

public interface EmiPaymentRepository
        extends JpaRepository<EmiPayment, Long> {

    List<EmiPayment> findByLoanAccount_IdOrderByInstallment_InstallmentNumberAsc(
            Long loanAccountId);

    boolean existsByInstallment_Id(Long installmentId);

    @Query("""
                SELECT SUM(p.amount)
                FROM EmiPayment p
            """)
    BigDecimal sumTotalCollected();

    @Query("""
                SELECT SUM(p.installment.principalComponent)
                FROM EmiPayment p
            """)
    BigDecimal sumTotalPrincipalCollected();

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

    @Query("""
                SELECT SUM(p.installment.interestComponent)
                FROM EmiPayment p
            """)
    BigDecimal sumTotalInterestCollected();

    @Query("""
                SELECT p
                FROM EmiPayment p
                JOIN FETCH p.installment
                ORDER BY p.paidAt DESC
            """)
    List<EmiPayment> findAllWithInstallmentsOrderByPaidAtDesc();
}
