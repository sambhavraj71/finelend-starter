
package com.finlend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_disbursements")
public class LoanDisbursement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "loan_account_id",
        nullable = false,
        unique = true
    )
    private LoanAccount loanAccount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "processed_by", nullable = false)
    private AppUser processedBy;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, unique = true, length = 60)
    private String referenceNumber;

    @Column(nullable = false, updatable = false)
    private LocalDateTime disbursedAt;

    @PrePersist
    public void onCreate() {
        disbursedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public LoanAccount getLoanAccount() { return loanAccount; }
    public void setLoanAccount(LoanAccount loanAccount) {
        this.loanAccount = loanAccount;
    }

    public AppUser getProcessedBy() { return processedBy; }
    public void setProcessedBy(AppUser processedBy) {
        this.processedBy = processedBy;
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public LocalDateTime getDisbursedAt() { return disbursedAt; }
}
