# NPA Classification

**NPA (Non-Performing Asset) classification** in loans refers to the categorization of loans that are overdue for a specified period and are no longer generating income. In simple terms, when a borrower fails to make principal or interest payments for an extended period, the loan is classified as an NPA by the lender. NPA classification helps financial institutions monitor the quality of their loan portfolios and ensure they take necessary actions to manage risks.

Frappe Lending has out-of-the-box NPA classification processes that help users manage NPA loans efficiently.

## 1. Days Past Due update

Loan Classification process runs every day and updates the count of Days Past Due (DPD) for each active loan. This count is also updated in near real-time when repayment and related loan events are processed.

![](/files/I6hNEJV.png)

Users can also track historical day-wise DPD data in **Days Past Due Logs**.

![](/files/FCMD2WD.png)

## 2. NPA Marking

NPA marking is based on DPD crossing configured threshold values.

Important correction:

- The threshold used for NPA marking is primarily taken from **Loan Product** (`Days Past Due Threshold for NPA`).
- Company-level DPD threshold is used for **auto write-off trigger**, not as the primary NPA marking threshold.

When DPD crosses the configured NPA limit, loan is auto-marked as NPA.

![](/files/ZfADryn.png)

This threshold is evaluated based on the oldest overdue EMI demand path used in classification processing.

![](/files/xL1t3ZO.png)

## 3. Manual NPA marking and unmarking

There are cases when users need to override system behavior and manually mark or unmark loan as NPA.

- **Manual NPA Marking** allows user override even if normal threshold conditions are not currently met.
- **Manual Unmark NPA** allows user-driven reversal, but system applies guardrails in specific scenarios.

Once manual override is used, system behavior follows override flags until user changes those flags again.

## 4. New/important behavior to capture in documentation

### Watch period after restructure

If a normal restructure is approved and the loan enters NPA context, system sets a watch period end date using company setting **Watch Period Post Loan Restructure (In Days)**.

During watch period:

- NPA-linked classification handling uses watch-period-aware behavior.
- Manual unmark operations are restricted before watch period end date.

### Linked customer/loan NPA propagation

NPA status updates propagate through linked active loans of the same applicant context, with logging through NPA log records and DPD logs.

### Freeze-account impact on DPD/NPA

If loan is frozen, classification and DPD processing apply freeze-aware boundaries, including demand/accrual reversals and DPD recomputation behavior for freeze transitions.

### Line of Credit behavior

For line-of-credit loans, DPD is tracked at disbursement level and aggregated to loan-level max DPD for overall status handling.

### Auto write-off trigger link

When DPD crosses Company-level **Days Past Due Threshold For Auto Write Off**, system can auto-initiate loan write-off creation in classification flow.

## 5. Practical notes

- Keep Loan Product NPA thresholds configured correctly per product.
- Configure Company watch period and auto write-off threshold intentionally.
- Use manual mark/unmark only for controlled override cases with proper audit discipline.
