# Settlements

**Loan settlement** refers to an agreement between a borrower and a lender to resolve the outstanding loan balance for an amount less than what is owed. In a loan settlement, the lender agrees to accept a lump-sum payment that is less than the total outstanding balance in exchange for closing the loan. This is often done in cases where the borrower is facing financial difficulties and is unable to repay the full amount of the loan.

To make a Settlement Entry, go to:

> **Home > Lending > Disbursement and Repayment > Loan Repayment**

**1. How to make a settlement**
-------------------------------

1. Go to the Loan Repayment List, and click on Add Loan Repayment.
2. Enter the loan account, repayment type as Full/Partial or Write Off Settlement and the amount to be repaid.
3. Save and submit.

### Additional Information

#### Full Settlement vs Partial Settlement

- **Full Settlement** is used when borrower and lender agree to settle the loan in one final settlement event.
- **Partial Settlement** is used when settlement collection is done as part of a negotiated recovery flow but full closure is not completed in the same entry.

In settlement-type repayments, collection allocation follows **Settlement Collection Offset Sequence**.

#### Write Off Settlement scenario

**Write Off Settlement** is used when the loan has already moved into written-off state and a settlement recovery is collected afterwards. This is different from normal full settlement on active/disbursed loans.

#### Important validation cases

- Full Settlement cannot be backdated before the latest repayment value date for that loan (or that disbursement in LoC context).
- After Full Settlement, only waiver entries (Interest, Penalty, Charges) are allowed as subsequent entries.
- Write Off Recovery / Write Off Settlement entries are only allowed when the loan is in written-off lifecycle.

#### Line of Credit (LoC) settlement behavior

For LoC loans, settlement and repayment entries can be linked to a specific disbursement. In this case, validation, schedule status updates, and some settlement checks are applied at disbursement level.

#### Auto-close impact during settlement

During settlement posting, system evaluates auto-close conditions using Loan Product settings such as write-off limit and excess amount acceptance behavior. Based on these conditions, loan status can move to Settled/Closed as applicable.

#### Recovery allocation after write-off

For write-off recovery and write-off settlement collections, repayment allocation also considers previously waived components and accrued pending components so that recovery accounting remains consistent.

#### Offset sequence source

Settlement allocation order is taken from Loan Product first. If not set there, Company-level settlement sequence is used as fallback.
