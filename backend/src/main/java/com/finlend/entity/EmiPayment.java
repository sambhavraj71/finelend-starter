
package com.finlend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "emi_payments",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_payment_installment",
            columnNames = "installment_id"
        ),
        @UniqueConstraint(
            name = "uk_payment_reference",
            columnNames = "reference_number"
        )
    }
)
public class EmiPayment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_account_id", nullable = false)
    private LoanAccount loanAccount;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "installment_id", nullable = false)
    private EmiInstallment installment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "processed_by_id", nullable = false)
    private AppUser processedBy;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, unique = true, length = 80)
    private String referenceNumber;

    @Column(nullable = false, updatable = false)
    private LocalDateTime paidAt;

    @PrePersist
    public void onCreate() {
        paidAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public LoanAccount getLoanAccount() { return loanAccount; }
    public void setLoanAccount(LoanAccount loanAccount) {
        this.loanAccount = loanAccount;
    }

    public EmiInstallment getInstallment() { return installment; }
    public void setInstallment(EmiInstallment installment) {
        this.installment = installment;
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

    public LocalDateTime getPaidAt() { return paidAt; }
}
