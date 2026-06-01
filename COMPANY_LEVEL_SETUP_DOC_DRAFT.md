# Company Level Setup

**Company Level Setup in Frappe Lending defines default policy controls used across loan products, repayment behavior, classification logic, and accrual processing.**

These settings are maintained at Company level so teams can enforce one lending policy baseline for all products under that company.

To access Company Level Setup, go to:

> Home > Accounting > Company > (Open Company) > Lending tab

## Prerequisites

---

Before configuring Company Level Setup, it is advised to have the following ready:

- Company master
- Loan Classification master records
- Loan Demand Offset Order records
- Internal lending policy values for DPD, restructuring, accrual, and write-off

### How to configure Company Level Setup

---

1. Open the Company record.
2. Go to the Lending tab.
3. Enter policy values in Loan Settings and collection configuration fields.
4. Configure Loan Classification Ranges and IRAC Provisioning Configuration tables.
5. Save.

### Additional Information

#### Enable Loan Accounting

When enabled, lending transactions follow accounting-enforced flows and related entries become part of accounting-ledger-driven processing. In day-to-day operations, this setting is used to determine whether loan accounting rules should be applied for lending transactions under that company.

#### Restructure Limit % (Overall)

Defines the overall restructuring cap as a percentage. This value is used in restructure limit processing to calculate permissible restructuring exposure against outstanding position when branch-level limits are not set.

#### Watch Period Post Loan Restructure (In Days)

Defines the post-restructure watch-period length. This watch period is used during NPA and classification handling after approved normal restructures, and it controls when certain status transitions can happen.

#### Interest Day-Count Convention

Controls how per-day interest is computed for accrual calculations. Depending on selected convention (for example Actual/365, 30/360, Actual/Actual), the system changes the year divisor and day treatment used in interest amount calculation.

#### Minimum days between Disbursement date and first Repayment date

Provides a company-level default minimum gap between disbursement date and first repayment date. This value is inherited by Loan Product when not explicitly set there, and is used in cycle-date schedule logic to avoid too-early first installments.

#### Collection Offset Logic Based On

Defines the intended policy basis for collection offset strategy (NPA Flag or Days Past Due). In current code paths, actual demand allocation routing is driven by loan state (standard/sub-standard/written-off/settlement) and configured offset sequences; keep this field aligned with policy governance.

#### Days Past Due Threshold

Represents company-level DPD threshold used for collection policy configuration. In current implementation, NPA thresholding is primarily product-driven, so this field should be maintained as a policy-level control value and for future-ready setup consistency.

#### Days Past Due Threshold For Auto Write Off

Defines the DPD level beyond which loan write-off processing can be triggered by the automated classification flow. This is used during daily DPD evaluation and write-off initiation checks.

#### Collection Offset Sequence for Standard Asset

Default demand-allocation order for collections on standard assets. Used as fallback when Loan Product-level sequence is not set.

#### Collection Offset Sequence for Sub Standard Asset

Default demand-allocation order for sub-standard/NPA collections. Used as fallback when Loan Product-level sequence is not set.

#### Collection Offset Sequence for Written Off Asset

Default allocation order for recovery collections after write-off. Used as fallback when Loan Product-level sequence is not set.

#### Collection Offset Sequence for Settlement Collection

Default allocation order used during settlement-oriented collections (for example full/partial settlement flows). Used as fallback when Loan Product-level sequence is not set.

#### Loan Accrual Frequency

Defines accrual cycle at company level (Daily, Weekly, or Monthly). Scheduler and accrual processing use this value to determine whether a date is an accrual day and how accrual breaks are generated.

### Table Configuration

#### Configuring Loan Classification Ranges

Use this table to map DPD ranges to classification codes/names, with separate handling for written-off and non-written-off assets.

Each row includes:

- Classification Code
- Min DPD Range
- Max DPD Range
- Is Written Off

Functionally, these ranges are used when assigning or updating loan classification based on current DPD. Keep DPD bands non-overlapping and complete enough to avoid unclassified gaps.

#### Configuring IRAC Provisioning Configuration

Use this table to define provisioning rates by classification and security type combination.

Each row includes:

- Classification Code
- Security Type (Secured, Unsecured, Semi-Secured)
- Provision Rate

This table is also validated for uniqueness at Company level to prevent duplicate classification + security type combinations. Maintain one clear rate per combination for consistent provisioning policy.

### Validation Notes

- Duplicate Loan Classification Range rows for the same Classification Code and Is Written Off combination are blocked.
- Duplicate IRAC Provisioning rows for the same Classification Code and Security Type combination are blocked.
- Collection offset sequences can be configured at both Company and Loan Product levels; Loan Product overrides Company when set.
