# Loan Repayment

**Loan repayment** refers to the process of paying back the borrowed amount (loan principal) along with any interest and fees over a specified period, according to the terms agreed upon between the borrower and the lender. Loan repayment can occur through periodic payments (monthly, quarterly, etc.) or in a lump sum, depending on the loan agreement.

To access the Loan Repayment, go to:

> **Home > Lending > Disbursement and Repayment > Loan Repayment**

**1. How to create a Loan Repayment**
-------------------------------------

1. Go to the Loan Repayment List, and click on Add Loan Repayment.
2. Enter the loan account, repayment type and the amount to be repaid.
3. Save and submit.

**2. Collection Offset Sequences**
----------------------------------

A **Collection Offset Sequence** in Loan Repayment refers to a structured method used to determine how borrower payments are allocated across loan components such as principal, interest, penalty, and charges. This ensures transparent allocation, especially for partial payments.

Frappe Lending allows users to define 4 collection offset sequences under the Loan tab in Company:

1. For Standard Assets (Non-NPA loans)
2. For Sub-standard Assets (NPA loans)
3. For Settlement Collection
4. For Written Off Assets

![](/files/phjd9KM.png)

**3. Advance and Pre Payment**
------------------------------

Whenever a borrower makes an Advance/Pre-payment, the loan is rescheduled and a new repayment schedule is generated based on the type of payment.

- **Advance Payment**

  A payment is treated as an advance payment when the repayment type is selected as Advance Payment and the excess amount falls between one EMI and two EMI amounts (for term loan validation flow). In this case, upcoming EMI handling follows advance payment rules.

- **Pre Payment**

  Any excess payment outside advance-payment criteria is generally treated in pre-payment logic. Excess amount after applicable interest adjustments is pushed toward principal and schedule is adjusted accordingly.

In both types, EMI amount generally remains the same while tenure or the last payment adjusts as required.

### Additional Information

#### Loan status-based repayment restrictions

- If loan status is **Closed**, only selected waiver/adjustment types are allowed.
- If loan status is **Written Off**, repayment is restricted to **Write Off Recovery** or **Write Off Settlement** (except internal write-off waiver flows).
- After **Full Settlement**, only waiver types (Interest, Penalty, Charges) are allowed for subsequent entries.

#### Full Settlement backdate restriction

Full Settlement cannot be posted with a value date earlier than the latest existing repayment date for that loan (or loan disbursement in line-of-credit context).

#### Validation for waiver amount

For Interest/Penalty/Charges Waiver, waived amount cannot be greater than the corresponding overdue amount available at the time of repayment.

#### Validate Normal Repayment behavior

If **Validate Normal Repayment** is enabled in Loan Product, amount paid in Normal Repayment cannot exceed payable amount.

#### Line of Credit (LoC) specific behavior

In LoC loans, repayments can be linked to a specific disbursement. Allocation, schedule closing, and certain validations are performed at loan-disbursement level when provided.

#### Security Deposit Adjustment repayment

For Security Deposit Adjustment, amount paid cannot exceed available security deposit and cannot exceed payable amount (except adjustment-specific flows).

#### Auto-close and auto-waiver scenario

During repayment, auto-close logic evaluates shortfall and excess conditions against Loan Product settings such as Auto Write Off Amount and Excess Amount Acceptance Limit.

If auto-close condition is satisfied, system may auto-create one pending component entry to complete closure flow:

- Interest Waiver
- Penalty Waiver
- Charges Waiver
- Principal Adjustment

#### Write-off recovery collection behavior

When loan is in written-off/settled recovery path, repayment allocation includes recovery-aware handling of pending waiver balances and accrued components to ensure correct collection tracking.

#### Source of offset sequence (fallback rule)

Offset sequence is first taken from Loan Product. If not set there, system falls back to Company-level sequence for that asset state.
