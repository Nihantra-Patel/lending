# Loan Interest Accrual

In accounting, accrued interest refers to the amount of interest that has been incurred, as of a specific date, on a loan or other financial obligation but has not yet been paid out. Accrued interest can either be in the form of accrued interest revenue, for the lender, or accrued interest expense, for the borrower.

![Loan Interest Accrual](/files/Loan Interest Accrual.png)

In Frappe Lending, interest accrual is processed through a background job as per company accrual policy. During this process, the amount of interest accumulated between the previous interest accrual date and the process execution date is booked as income and corresponding accounting entries are posted. This amount temporarily sits in the accrued/receivable side until the demand for this amount is generated.

![Interest Accrual Ledger](/files/Interest Accrual Ledger.png)

### Types of interest accrual

#### Normal Interest Accrual

**Normal Interest** is the standard interest charged as per the loan terms, reflecting the regular cost of borrowing.

#### Penalty Interest Accrual

**Penalty Interest** accrual is imposed on delayed repayment amounts. It is applied on overdue EMI components. In Lending, a portion related to interest component can be tracked as additional interest for internal accounting treatment.

![](/files/mdgdQXJ.png)

### Additional scenarios and behavior

#### 1. Accrual is not always daily

Accrual frequency is controlled by the Company setting **Loan Accrual Frequency** (Daily, Weekly, Monthly). The scheduler checks whether the run date is an accrual day and posts accrual accordingly.

#### 2. Company day-count convention affects interest amount

Per-day and total interest are affected by **Interest Day-Count Convention** at Company level (for example Actual/365, Actual/Actual, 30/360, 30/365, Actual/360). This directly changes divisor/day treatment used in interest calculation.

#### 3. Behavior differs for term loans and non-term loans

For term loans, accrual is processed schedule-wise and aligned with repayment schedule breaks and accrual frequency breaks. For non-term loans, accrual is computed from last accrual date to posting date on pending principal.

#### 4. Penal accrual starts after grace period

Penal accrual is posted only after crossing **Grace Period in Days** configured on Loan Product. Penal rate comes from loan penalty rate when available, otherwise from Loan Product penalty rate.

#### 5. Additional Interest component in penal flow

In penal accrual processing, the system may derive and post an **Additional Interest** portion (especially interest-linked penal component) separately for accounting and demand handling.

#### 6. Line of Credit month-end scenario

For line of credit products using **No Interest Accrual Till Month End**, first normal accrual starts from the first day of the next month instead of accruing immediately from disbursement date.

#### 7. Freeze date handling

If a loan is frozen, accrual boundaries are restricted using freeze date so accrual posting does not continue beyond allowed freeze logic.

#### 8. Written-off stage accounting behavior

For written-off loans, accrual handling is more restrictive and posting behavior depends on write-off stage and related dates. This prevents incorrect income recognition after write-off cutover.

#### 9. Overlap protection for normal accruals

System validates overlapping normal-interest accrual windows and blocks duplicate overlapping accrual postings.

#### 10. Required setup check

If Loan Accrual Frequency is not configured at Company level, accrual processing throws an error and will not proceed until setup is completed.
