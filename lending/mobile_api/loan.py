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

from lending.mobile_api.utils import ensure_owns_loan, get_current_applicant


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
def apply(
	loan_product: str,
	loan_amount: float,
	repayment_periods: int,
	repayment_start_date: str | None = None,
) -> dict:
	"""Create a Loan Application for the logged-in borrower.

	The native "Apply" button posts here. We construct and submit the real Loan
	Application so all core underwriting validations run server-side.
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

	application.insert()
	application.submit()

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
	return frappe.get_all(
		"Loan Application",
		filters={"applicant_type": applicant_type, "applicant": applicant},
		fields=[
			"name",
			"loan_product",
			"loan_amount",
			"rate_of_interest",
			"repayment_periods",
			"status",
			"posting_date",
		],
		order_by="posting_date desc",
	)


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
