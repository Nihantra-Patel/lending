# Loan Waivers

A **loan waiver** refers to the cancellation or forgiveness of the interest or charge component of a loan for a specific period or in particular circumstances. This means that the borrower is either not required to pay the interest accrued on the loan, or the lender refunds or credits the interest that has already been paid.

Current doc:

To make a waiver, go to:

> **Home > Lending > Disbursement and Repayment > Loan Repayment**

**1. How to create a Loan Waiver**
----------------------------------

1. Go to the Loan Repayment List, and click on Add Loan Repayment.
2. Select the repayment type as Interest, Penalty, or Charges Waiver.
3. Select the loan account number against which the waiver is done and enter the waiver amount.
4. Save and submit.

Once the waiver entry is submitted the overdue demands are knocked off as per the amount waived and the waived amount is updated in the respective demands

![Loan Demand Waiver](/files/Loan Demand Waiver.png)

On submitting an Interest Loan Waiver, below are the typical accounting entries that are posted

![Loan Interest Waiver Accounting](/files/Loan Interest Waiver Accounting.png)

As you can see in the above screenshot income booking is also reversed in case the waiver is done on a non-NPA loan.

### Additional Information

#### Different types of waivers

- **Interest Waiver**: Used to waive due interest exposure. In waiver validation, system considers overdue interest and other pending interest components applicable on the loan at waiver time. On non-NPA loans, income reversal entries are also posted.
- **Penalty Waiver**: Used to waive penal dues. This covers pending penalty components and related penalty-side outstanding at repayment time. For non-NPA loans, penalty income reversal behavior is applied.
- **Charges Waiver**: Used to waive charge demands (processing charges, penalty charges, and other configured demand charges) that are outstanding against the loan.

#### Auto waiver behavior (new functionality)

In specific closure situations, waiver entries can be auto-created by the system after repayment submission.

- Auto-close eligibility is evaluated from loan closure conditions such as shortfall within product-level write-off limit and acceptable excess handling.
- If auto-close condition is met, system recalculates pending amounts and creates waiver/adjustment entry automatically for the pending component.
- The system can auto-create one of these entries based on what is still pending at that moment: Interest Waiver, Penalty Waiver, Charges Waiver, or Principal Adjustment.

This makes final closure smoother by automatically clearing small residual components without requiring users to manually post separate waiver entries.
