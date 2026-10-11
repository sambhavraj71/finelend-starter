package com.finlend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "emi_installments",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_emi_account_installment",
        columnNames = {"loan_account_id", "installment_number"}
    )
)
public class EmiInstallment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_account_id", nullable = false)
    private LoanAccount loanAccount;

    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal openingBalance;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal emiAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal principalComponent;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal interestComponent;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal closingBalance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmiPaymentStatus paymentStatus = EmiPaymentStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public LoanAccount getLoanAccount() { return loanAccount; }
    public void setLoanAccount(LoanAccount loanAccount) {
        this.loanAccount = loanAccount;
    }

    public Integer getInstallmentNumber() { return installmentNumber; }
    public void setInstallmentNumber(Integer installmentNumber) {
        this.installmentNumber = installmentNumber;
    }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) {
        this.openingBalance = openingBalance;
    }

    public BigDecimal getEmiAmount() { return emiAmount; }
    public void setEmiAmount(BigDecimal emiAmount) {
        this.emiAmount = emiAmount;
    }

    public BigDecimal getPrincipalComponent() {
        return principalComponent;
    }
    public void setPrincipalComponent(BigDecimal principalComponent) {
        this.principalComponent = principalComponent;
    }

    public BigDecimal getInterestComponent() {
        return interestComponent;
    }
    public void setInterestComponent(BigDecimal interestComponent) {
        this.interestComponent = interestComponent;
    }

    public BigDecimal getClosingBalance() { return closingBalance; }
    public void setClosingBalance(BigDecimal closingBalance) {
        this.closingBalance = closingBalance;
    }

    public EmiPaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(EmiPaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
