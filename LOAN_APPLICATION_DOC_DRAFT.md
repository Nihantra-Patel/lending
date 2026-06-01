# Loan Application

A **Loan Application** is the formal request record used to evaluate and process a borrower’s loan request. It captures applicant details, product selection, requested amount, repayment inputs, co-applicants, supporting documents, and collateral proposal (for secured loans). This record is the foundation for credit decisioning and loan creation.

To access Loan Application, go to:

> **Home > Lending > Loan > Loan Application**

## Prerequisites

---

Before creating a Loan Application, it is advised to have:

- Company and Loan Product setup
- Applicant details (Customer or Employee)
- Loan purpose (if used by your process)
- Document checklist and co-applicant information (if applicable)
- Collateral setup and security prices (for secured loans)

### How to create a Loan Application

---

1. Go to Loan Application List and click on Add Loan Application.
2. Select Applicant Type and enter applicant details.
3. Select Company and Loan Product.
4. Enter Loan Amount and review repayment inputs.
5. For secured loans, add Proposed Pledges.
6. Add co-applicants and documents if required.
7. Save and Submit.

### Additional Information

#### Core fields

- **Applicant Type / Applicant**: Borrower profile (Customer or Employee).
- **Application Date**: Date of application capture.
- **Loan Product**: Product under which application is raised.
- **Loan Amount**: Requested amount.
- **Rate of Interest**: Pulled from the selected loan product.
- **Status**: Application decision status (Open, Approved, Rejected).

#### Repayment details (term loans)

For term loans, repayment method can be based on either repayment periods or fixed repayment amount. The system calculates payable values and validates consistency between amount, interest, and tenure inputs.

#### Secured loan details

When **Is Secured Loan** is enabled:

- Proposed pledges are required.
- Security quantity and price are used to derive value.
- Post-haircut values contribute to maximum eligible loan amount from proposed collateral.

#### Applicant and duplicate handling

For customer applications, contact details can be used to identify existing borrowers. Where relevant, existing borrower information can be reused to avoid duplicate customer creation.

#### Company and policy validations

Loan Application enforces key checks such as:

- Loan product must belong to the selected company.
- Loan amount must respect configured product-level limits.
- For secured loans, requested amount cannot exceed collateral-backed maximum from proposed pledges.
- If sanctioned-limit controls are maintained for the applicant, application amount is checked against the sanctioned limit context.

#### From application to execution

Once approved, Loan Application supports operational progression:

- Create **Loan** from the approved application.
- Create **Loan Security Assignment** for secured applications.

#### Recommended operational practice

- Complete applicant and contact details before approval.
- Keep supporting documents and co-applicant records updated in the same application.
- Review collateral values and haircut impact before final approval in secured cases.
