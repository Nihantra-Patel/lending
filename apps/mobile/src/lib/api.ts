/**
 * Thin client for the Frappe Lending mobile_api backend.
 *
 * All calls hit `https://<site>/api/method/lending.mobile_api.<module>.<fn>`.
 * Auth is cookie/token based and handled by the FrappeProvider (frappe-react-sdk);
 * here we only shape requests/responses for the screens.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * On web the app is served by Frappe itself (e.g. dev-testcase.com/borrow-portal),
 * so API calls are same-origin — no host, no CORS. On native (iOS/Android) the
 * app is a standalone binary and must point at an absolute site URL, configured
 * via app.json -> expo.extra.frappeSiteUrl.
 */
export const SITE_URL: string =
  Platform.OS === "web"
    ? ""
    : (Constants.expoConfig?.extra?.frappeSiteUrl as string) || "https://dev-testcase.com";

const METHOD_BASE = `${SITE_URL}/api/method`;

export type LoanProduct = {
  name: string;
  product_name: string;
  rate_of_interest: number;
  maximum_loan_amount: number;
  repayment_schedule_type: string;
};

export type LoanSummary = {
  name: string;
  loan_product: string;
  status: string;
  loan_amount: number;
  disbursed_amount: number;
  total_amount_paid: number;
  total_payment?: number;
  monthly_repayment_amount: number;
  is_npa: number;
  days_past_due: number;
  disbursement_date: string | null;
};

export type JourneyMeta = { journey_type: string; title: string; description: string | null };

export type JourneyField = {
  label: string;
  fieldname: string;
  fieldtype: "Data" | "Number" | "Float" | "Select" | "Date" | "Check" | "Text" | "File" | "Phone" | "Email";
  reqd: boolean;
  options: string[];
  placeholder: string | null;
  help_text: string | null;
};

export type Journey = {
  journey_type: string;
  title: string;
  description: string | null;
  sections: { title: string; fields: JourneyField[] }[];
};

export type Summary = {
  total_loans: number;
  active_loans: number;
  total_borrowed: number;
  total_paid: number;
  outstanding: number;
  overdue_loans: number;
  npa_loans: number;
};

export type Application = {
  name: string;
  loan_product: string;
  loan_amount: number;
  rate_of_interest: number;
  repayment_periods: number;
  status: string;
  stage: string;
  posting_date: string;
};

export type Dues = {
  as_on_date: string;
  oldest_due_date: string | null;
  overdue_principal: number;
  overdue_interest: number;
  penalty_amount: number;
  charges: number;
  total_due: number;
  principal_outstanding: number;
};

export type ScheduleRow = {
  payment_date: string;
  principal_amount: number;
  interest_amount: number;
  total_payment: number;
  balance_loan_amount: number;
};

export type Profile = {
  user: string;
  full_name: string;
  email: string | null;
  mobile_no: string | null;
  image: string | null;
};

type FrappeMessage<T> = { message: T };

async function call<T>(method: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${METHOD_BASE}/${method}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = (await res.json())?._server_messages || "";
    } catch {
      /* ignore */
    }
    throw new Error(`Request failed (${res.status}). ${detail}`);
  }
  const json = (await res.json()) as FrappeMessage<T>;
  return json.message;
}

export const api = {
  login: (usr: string, pwd: string) =>
    call<unknown>("login", { usr, pwd }),
  logout: () => call<unknown>("logout"),
  getProfile: () => call<Profile>("lending.mobile_api.auth.get_profile"),
  getLoanProducts: () =>
    call<LoanProduct[]>("lending.mobile_api.loan.get_loan_products"),
  getLoanProduct: (loan_product: string) =>
    call<LoanProduct>("lending.mobile_api.loan.get_loan_product", { loan_product }),
  getSummary: () => call<Summary>("lending.mobile_api.loan.get_summary"),
  listLoans: () => call<LoanSummary[]>("lending.mobile_api.loan.list_loans"),
  listApplications: () => call<Application[]>("lending.mobile_api.loan.list_applications"),
  getApplication: (loan_application: string) =>
    call<Application>("lending.mobile_api.loan.get_application", { loan_application }),
  getLoan: (loan: string) =>
    call<LoanSummary>("lending.mobile_api.loan.get_loan", { loan }),
  listJourneys: () =>
    call<JourneyMeta[]>("lending.mobile_api.onboarding.list_journeys"),
  getJourney: (journey_type: string) =>
    call<Journey>("lending.mobile_api.onboarding.get_onboarding_journey", { journey_type }),
  apply: (payload: {
    loan_product: string;
    loan_amount: number;
    repayment_periods: number;
    journey_type?: string;
    journey_data?: string;
  }) => call<{ loan_application: string; message: string }>(
    "lending.mobile_api.loan.apply",
    payload
  ),
  estimate: (loan_product: string, loan_amount: number, tenure: number) =>
    call<{ emi: number; total_payable: number; total_interest: number; rate_of_interest: number }>(
      "lending.mobile_api.repayment.estimate",
      { loan_product, loan_amount, tenure }
    ),
  getDues: (loan: string) =>
    call<Dues>("lending.mobile_api.repayment.get_dues", { loan }),
  getSchedule: (loan: string) =>
    call<ScheduleRow[]>("lending.mobile_api.repayment.get_schedule", { loan }),
  getKycStatus: (loan: string) =>
    call<{ status: string | null; verified: boolean }>(
      "lending.mobile_api.kyc.get_kyc_status",
      { loan }
    ),
  getKycStatusForApplication: (loan_application: string) =>
    call<{ available?: boolean; status: string | null; verified: boolean }>(
      "lending.mobile_api.kyc.get_kyc_status",
      { loan_application }
    ),
  getApplicationFlow: (loan_application: string) =>
    call<{ has_workflow: boolean; workflow?: string; state: string; actions: string[] }>(
      "lending.mobile_api.workflow.get_application_flow",
      { loan_application }
    ),
  applyApplicationAction: (loan_application: string, action: string) =>
    call<{ ok: boolean; state: string; message: string }>(
      "lending.mobile_api.workflow.apply_application_action",
      { loan_application, action }
    ),
};

export const inr = (n: number | null | undefined) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
