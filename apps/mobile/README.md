# Lending — Native Borrower App

A true native mobile app (Expo / React Native) for **Frappe Lending**, structured
as a monorepo inside the lending app (Raven-style):

```
lending/
├── lending/            # Frappe backend (Python) — banking core
│   └── mobile_api/     # Stable REST surface the app talks to
└── apps/mobile/        # This Expo / React Native app (Android / iOS / web)
```

The app does **no** loan math or accounting. It is a thin client over the
`lending.mobile_api.*` whitelisted endpoints; all interest, NPA, accounting and
compliance logic stays in the core lending DocTypes. KYC/e-Sign status is read
(via the backend) from the separate `ekyc_india` (Digio) app, which is never
modified.

## Screens

| Screen        | Backend method                                  |
| ------------- | ----------------------------------------------- |
| Login         | `login`                                         |
| My Loans      | `lending.mobile_api.loan.list_loans`            |
| Loan detail   | `loan.get_loan`, `repayment.get_dues`, `repayment.get_schedule`, `kyc.get_kyc_status` |
| Apply         | `loan.get_loan_products`, `loan.apply`          |
| Profile       | `auth.get_profile`, `logout`                    |

## Develop

```bash
cd apps/mobile
yarn install          # or npm install
yarn web              # browser preview
yarn ios              # iOS simulator
yarn android          # Android emulator
```

Configure the backend URL in `app.json` → `expo.extra.frappeSiteUrl`
(default `https://dev-testcase.com`). For local web testing against a dev site,
ensure CORS / `allow_cors` permits the Expo origin.

## Build for stores

```bash
npx eas build -p android   # .apk / .aab
npx eas build -p ios       # .ipa
```
