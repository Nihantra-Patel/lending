# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Loan application and account endpoints for the native borrower app.

These wrap the core Loan Application and Loan DocTypes. The app sends a thin
payload (amount, tenure, product); the backend builds, validates and creates the
real documents, running all underwriting validations in the core controllers.
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate

from lending.mobile_api.utils import elevated, ensure_owns_loan, get_current_applicant


@frappe.whitelist()
def get_loan_products() -> list[dict]:
	"""List loan products the borrower can apply for, for the apply screen."""

	products = frappe.get_all(
		"Loan Product",
		filters={"disabled": 0},
		fields=[
			"name",
			"product_name",
			"rate_of_interest",
			"maximum_loan_amount",
			"repayment_schedule_type",
		],
	)
	return products


@frappe.whitelist()
def get_loan_product(loan_product: str) -> dict:
	"""Return the key details of a single loan product for the apply screen."""

	doc = frappe.db.get_value(
		"Loan Product",
		loan_product,
		["name", "product_name", "rate_of_interest", "maximum_loan_amount", "repayment_schedule_type"],
		as_dict=True,
	)
	return doc or {}


@frappe.whitelist()
def apply(
	loan_product: str,
	loan_amount: float,
	repayment_periods: int,
	repayment_start_date: str | None = None,
	journey_type: str | None = None,
	journey_data: dict | str | None = None,
) -> dict:
	"""Create a Loan Application for the logged-in borrower.

	The native "Apply" button posts here. We construct and submit the real Loan
	Application so all core underwriting validations run server-side. Any
	product-specific onboarding fields captured by the dynamic journey form are
	stored alongside the application via ``Borrower Onboarding Submission``.
	"""

	applicant_type, applicant = get_current_applicant()

	company = frappe.defaults.get_user_default("Company") or frappe.db.get_single_value(
		"Global Defaults", "default_company"
	)
	if not company:
		frappe.throw(_("No default company is configured for loan applications."))

	rate_of_interest = frappe.db.get_value("Loan Product", loan_product, "rate_of_interest")

	application = frappe.new_doc("Loan Application")
	application.update(
		{
			"applicant_type": applicant_type,
			"applicant": applicant,
			"company": company,
			"posting_date": getdate(),
			"loan_product": loan_product,
			"loan_amount": flt(loan_amount),
			"is_term_loan": 1,
			"rate_of_interest": rate_of_interest,
			"repayment_method": "Repay Over Number of Periods",
			"repayment_periods": int(repayment_periods),
		}
	)
	if repayment_start_date:
		application.repayment_start_date = getdate(repayment_start_date)

	# The borrower (Customer role) is authorised to create their own application,
	# but cannot write the Loan Application DocType directly; create it on their
	# behalf after we have set applicant to their own Customer.
	with elevated():
		application.insert(ignore_permissions=True)
		application.submit()

	if journey_data:
		import json

		from lending.mobile_api.onboarding import save_submission

		if isinstance(journey_data, str):
			journey_data = json.loads(journey_data)
		save_submission(application.name, journey_type, journey_data)

	return {
		"loan_application": application.name,
		"status": application.status,
		"loan_amount": flt(application.loan_amount, 2),
		"rate_of_interest": application.rate_of_interest,
		"repayment_periods": application.repayment_periods,
		"message": _("Your loan application has been submitted."),
	}


@frappe.whitelist()
def list_applications() -> list[dict]:
	"""Return the borrower's loan applications (apply history screen)."""

	applicant_type, applicant = get_current_applicant()
	rows = frappe.get_all(
		"Loan Application",
		filters={"applicant_type": applicant_type, "applicant": applicant},
		fields=[
			"name",
			"loan_product",
			"loan_amount",
			"rate_of_interest",
			"repayment_periods",
			"status",
			"workflow_state",
			"posting_date",
		],
		order_by="posting_date desc",
	)
	for r in rows:
		r["stage"] = r.get("workflow_state") or r.get("status")
	return rows


@frappe.whitelist()
def get_application(loan_application: str) -> dict:
	"""Return a single application's details for the tracking screen."""

	applicant_type, applicant = get_current_applicant()
	app = frappe.db.get_value(
		"Loan Application",
		loan_application,
		[
			"name",
			"applicant_type",
			"applicant",
			"loan_product",
			"loan_amount",
			"rate_of_interest",
			"repayment_periods",
			"status",
			"workflow_state",
			"posting_date",
		],
		as_dict=True,
	)
	if not app or app.applicant_type != applicant_type or app.applicant != applicant:
		frappe.throw(_("Loan application not found."), frappe.PermissionError)

	app["stage"] = app.get("workflow_state") or app.get("status")
	return app


@frappe.whitelist()
def get_summary() -> dict:
	"""Portfolio summary for the landing page header."""

	applicant_type, applicant = get_current_applicant()
	loans = frappe.get_all(
		"Loan",
		filters={"applicant_type": applicant_type, "applicant": applicant, "docstatus": ["<", 2]},
		fields=["status", "loan_amount", "total_amount_paid", "total_payment", "is_npa", "days_past_due"],
	)

	active_statuses = {"Sanctioned", "Partially Disbursed", "Disbursed", "Active", "Loan Closure Requested"}
	total_borrowed = sum(flt(l.loan_amount) for l in loans)
	total_paid = sum(flt(l.total_amount_paid) for l in loans)
	outstanding = sum(
		max(flt(l.total_payment) - flt(l.total_amount_paid), 0) for l in loans if l.status in active_statuses
	)

	return {
		"total_loans": len(loans),
		"active_loans": len([l for l in loans if l.status in active_statuses]),
		"total_borrowed": flt(total_borrowed, 2),
		"total_paid": flt(total_paid, 2),
		"outstanding": flt(outstanding, 2),
		"overdue_loans": len([l for l in loans if flt(l.days_past_due) > 0]),
		"npa_loans": len([l for l in loans if l.is_npa]),
	}


@frappe.whitelist()
def list_loans() -> list[dict]:
	"""Return the borrower's active/closed loan accounts for the home list."""

	applicant_type, applicant = get_current_applicant()
	return frappe.get_all(
		"Loan",
		filters={
			"applicant_type": applicant_type,
			"applicant": applicant,
			"docstatus": ["<", 2],
		},
		fields=[
			"name",
			"loan_product",
			"status",
			"loan_amount",
			"disbursed_amount",
			"total_amount_paid",
			"monthly_repayment_amount",
			"is_npa",
			"days_past_due",
			"disbursement_date",
		],
		order_by="posting_date desc",
	)


@frappe.whitelist()
def get_loan(loan: str) -> dict:
	"""Return a single loan's details. Ownership enforced."""

	ensure_owns_loan(loan)
	doc = frappe.db.get_value(
		"Loan",
		loan,
		[
			"name",
			"loan_product",
			"status",
			"loan_amount",
			"rate_of_interest",
			"disbursed_amount",
			"total_payment",
			"total_amount_paid",
			"total_principal_paid",
			"monthly_repayment_amount",
			"repayment_periods",
			"disbursement_date",
			"repayment_start_date",
			"is_npa",
			"days_past_due",
		],
		as_dict=True,
	)
	return doc
