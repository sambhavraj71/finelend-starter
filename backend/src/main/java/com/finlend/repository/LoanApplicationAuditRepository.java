
package com.finlend.repository;

import com.finlend.entity.LoanApplicationAudit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoanApplicationAuditRepository
        extends JpaRepository<LoanApplicationAudit, Long> {

    List<LoanApplicationAudit>
        findByLoanApplication_IdOrderByChangedAtAscIdAsc(
            Long loanApplicationId
        );
}
