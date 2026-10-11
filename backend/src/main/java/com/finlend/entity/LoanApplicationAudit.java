
package com.finlend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loan_application_audits")
public class LoanApplicationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private AppUser reviewer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LoanApplicationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LoanApplicationStatus newStatus;

    @Column(length = 1000)
    private String remarks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @PrePersist
    public void onCreate() {
        changedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }

    public LoanApplication getLoanApplication() {
        return loanApplication;
    }

    public void setLoanApplication(LoanApplication loanApplication) {
        this.loanApplication = loanApplication;
    }

    public AppUser getReviewer() { return reviewer; }

    public void setReviewer(AppUser reviewer) {
        this.reviewer = reviewer;
    }

    public LoanApplicationStatus getPreviousStatus() {
        return previousStatus;
    }

    public void setPreviousStatus(LoanApplicationStatus previousStatus) {
        this.previousStatus = previousStatus;
    }

    public LoanApplicationStatus getNewStatus() {
        return newStatus;
    }

    public void setNewStatus(LoanApplicationStatus newStatus) {
        this.newStatus = newStatus;
    }

    public String getRemarks() { return remarks; }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getChangedAt() { return changedAt; }
}
