
package com.finlend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_accounts")
public class LoanAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String accountNumber;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "loan_application_id",
        nullable = false,
        unique = true
    )
    private LoanApplication loanApplication;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal principalAmount;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal outstandingPrincipal;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal annualInterestRate;

    @Column(nullable = false)
    private Integer tenureMonths;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyEmi;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LoanAccountStatus status = LoanAccountStatus.ACTIVE;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public LoanApplication getLoanApplication() {
        return loanApplication;
    }
    public void setLoanApplication(LoanApplication loanApplication) {
        this.loanApplication = loanApplication;
    }

    public BigDecimal getPrincipalAmount() {
        return principalAmount;
    }
    public void setPrincipalAmount(BigDecimal principalAmount) {
        this.principalAmount = principalAmount;
    }

    public BigDecimal getOutstandingPrincipal() {
        return outstandingPrincipal;
    }
    public void setOutstandingPrincipal(BigDecimal outstandingPrincipal) {
        this.outstandingPrincipal = outstandingPrincipal;
    }

    public BigDecimal getAnnualInterestRate() {
        return annualInterestRate;
    }
    public void setAnnualInterestRate(BigDecimal annualInterestRate) {
        this.annualInterestRate = annualInterestRate;
    }

    public Integer getTenureMonths() { return tenureMonths; }
    public void setTenureMonths(Integer tenureMonths) {
        this.tenureMonths = tenureMonths;
    }

    public BigDecimal getMonthlyEmi() { return monthlyEmi; }
    public void setMonthlyEmi(BigDecimal monthlyEmi) {
        this.monthlyEmi = monthlyEmi;
    }

    public LoanAccountStatus getStatus() { return status; }
    public void setStatus(LoanAccountStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
