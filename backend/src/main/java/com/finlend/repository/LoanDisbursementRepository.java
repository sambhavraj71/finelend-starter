
package com.finlend.repository;

import com.finlend.entity.LoanDisbursement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface LoanDisbursementRepository
        extends JpaRepository<LoanDisbursement, Long> {

    @Query("""
        SELECT SUM(d.amount)
        FROM LoanDisbursement d
    """)
    BigDecimal sumTotalDisbursed();

    List<LoanDisbursement> findAllByOrderByDisbursedAtDesc();

    @Query(value = """
        SELECT
            DATE_FORMAT(disbursed_at, '%Y-%m') AS report_month,
            COUNT(*) AS total_loans,
            COALESCE(SUM(amount), 0) AS total_amount
        FROM loan_disbursements
        GROUP BY DATE_FORMAT(disbursed_at, '%Y-%m')
        ORDER BY report_month DESC
    """, nativeQuery = true)
    List<Object[]> getMonthlyDisbursementReport();
}
