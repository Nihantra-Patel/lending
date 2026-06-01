# Loan Product

**A loan product can be categorized as an offering given by a NBFC or a Bank to its borrowers.**

Frappe Lending allows users to define different loan products along with their various attributes like the rate of interest, schedule type, etc.

To access the Loan Product, go to:

> Home > Lending > Loan > Loan Product

## Prerequisites

---

Before creating a Loan Product, it is advised to create the following:

- Company
- Loan Category

### How to create a Loan Product

---

1. Go to the Loan Product List, and click on Add Loan Product.
2. Enter the loan product details like product code, product name, rate of interest, repayment schedule type, etc.
3. Save

### Repayment/Amortization Schedule Types

#### Monthly as per repayment start date

If this option is selected a monthly repayment schedule is generated upon loan disbursement as per the repayment start date selected by the user. For this option, there can only be one active repayment schedule at a time, so if multiple partial/tranches are disbursed for this schedule type then a new active repayment schedule is generated and the old schedule is marked as inactive. Here users can also change the frequency of payment to weekly, quarterly, or one-time instead of the monthly default.

#### Pro-rated calendar months

If this option is selected a monthly repayment schedule is generated upon loan disbursement with the payment details as per calendar months. In this option user also gets to choose whether the payment date should be the End of the current month or Start of the next month. For this option as well there can be only one repayment schedule at a time.

#### Monthly as per cycle date

If this option is selected a monthly repayment schedule is generated upon loan disbursement as per the cyclic date selected by the user in the loan product, however user can override this at the time of loan booking. For this option as well there can be only one repayment schedule at a time. Here also users can change the frequency of payment to weekly, quarterly, or one-time instead of the monthly default.

#### Line of Credit

This repayment schedule is useful for line of credit loans where an upper limit is sanctioned and multiple disbursements are made within the limit. For this repayment type there can be multiple active repayment schedules with different payment frequencies.

#### Flat Interest Rate

This option is useful when interest is handled as a flat-rate schedule across the tenure. It is generally used in products where repayment breakup follows a predefined flat-interest pattern.

### Additional Information

#### BPI Recovery Method

This field controls how broken period interest (interest between disbursement date and first EMI period) is recovered. You can recover it as upfront deduction, amortize it across tenure, add it to first EMI, or add it to last EMI.

#### Cyclic Day Of the Month

This is used with Monthly as per cycle date schedule type. It defines the day of the month on which repayment is considered due. It helps standardize due dates across borrowers for operational convenience.

#### Days Past Due Threshold for NPA

This value defines when a loan should be treated as NPA based on days past due. Once borrower delinquency crosses this threshold, the system can treat the account as non-performing.

#### Minimum days between Disbursement date and first Repayment date

This field ensures that the first repayment date is not too close to disbursement. If the gap is smaller than this value, first repayment can be shifted to the next eligible cycle so borrowers get a minimum initial repayment window.

#### Excess Amount Acceptance Limit

During final repayment, if borrower pays extra and the excess amount is within this limit, loan can still be auto-closed and excess is parked in customer refund handling. If excess is above this limit, the excess amount can still be parked in customer refund account but the loan may remain open.

#### Auto Write Off Amount

During closure, if a small shortfall remains and it is within this limit, the system can auto-waive or write off the residual amount and proceed with loan closure.

#### Grace Period in Days

This defines the number of days after due date during which penal interest is not charged. Penalty interest starts applying only after this grace period is crossed.

### Excess amount acceptance and auto write-off limits

---

![](/files/MWMNZoX.png)

If the final repayment made is short of some amount and the amount is within Auto Write Off Amount, the amount will be auto-waived and the loan will be closed.

Similarly, in case the borrower makes the final payment with some excess amount and the amount is within Excess Amount Acceptance Limit, the amount is parked in the customer refund account and the loan is closed. If the excess amount is more than the acceptance limit, the amount is still parked in customer refund account but the loan still remains open.
