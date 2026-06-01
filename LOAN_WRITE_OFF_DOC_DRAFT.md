# Loan Write Off

A **loan write-off** refers to the process by which a lender formally acknowledges that a loan is unlikely to be repaid and removes it from its balance sheet as an asset. This is an accounting action that reflects the lender's recognition of the loss associated with the uncollectible loan. However, writing off a loan does not mean that the borrower is absolved of the debt; the borrower is still legally obligated to repay the loan, and the lender may continue to attempt to recover the funds through various means.

To access the Loan Write Off, go to:

> **Home > Lending > Loan Adjustments > Loan Write Off**

**2. How to create a Loan Write Off**
-------------------------------------

1. Go to the Loan Write Off List, and click on Add Loan Write Off.
2. Enter the loan account and the principal amount to be written off.
3. Save and submit.

On submitting the Loan Write Off entry the loan is marked as written off and the accounting entries are posted as below.

![](/files/aH2TgZJ.png)

### Additional Information

#### Write-off amount validation

Loan Write Off validates that the write-off amount matches the pending principal amount for the loan at that point in time. This prevents partial or excess principal write-off through this document flow.

#### Settlement write-off vs regular write-off

- **Regular write-off** is used when the loan is moved into written-off state as part of delinquency/write-off processing.
- **Settlement write-off** is used in settlement-oriented scenarios where write-off is created as part of closure/settlement flow.

Both flows update written-off totals and status handling, but settlement behavior is controlled separately through settlement flags and repayment status transitions.

#### Auto write-off trigger scenario

System can auto-create loan write-off when DPD crosses the Company-level threshold (**Days Past Due Threshold For Auto Write Off**) during classification processing.

#### Relationship with waivers

Write-off flow can automatically create waiver entries with internal write-off waiver marking for pending components such as:

- Interest Waiver
- Penalty Waiver
- Charges Waiver

This helps clean up non-principal pending components while moving principal to write-off.

#### Recovery after write-off

Write-off does not end recovery. Repayments can still be collected through write-off recovery flows such as:

- **Write Off Recovery**
- **Write Off Settlement**

These repayment types use dedicated write-off recovery accounting paths and help track post write-off collections.
