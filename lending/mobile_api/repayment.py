# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Repayment, EMI schedule and dues endpoints for the native borrower app."""

import frappe
from frappe.utils import flt, getdate

from lending.mobile_api.utils import elevated, ensure_owns_loan


@frappe.whitelist()
def estimate(loan_product: str, loan_amount: float, tenure: int) -> dict:
	"""Return an accurate EMI estimate for the apply screen.

	Uses the core Loan Repayment Schedule engine so the figure shown to the
	borrower matches what the loan will actually be, instead of a flat-interest
	approximation.
	"""
	rate = frappe.db.get_value("Loan Product", loan_product, "rate_of_interest") or 0
	schedule_type = frappe.db.get_value("Loan Product", loan_product, "repayment_schedule_type")

	rs = frappe.new_doc("Loan Repayment Schedule")
	rs.loan_product = loan_product
	rs.repayment_frequency = "Monthly"
	rs.repayment_method = "Repay Over Number of Periods"
	rs.repayment_periods = int(tenure)
	rs.rate_of_interest = rate
	rs.posting_date = getdate()
	rs.repayment_start_date = getdate()
	rs.loan_amount = flt(loan_amount)
	rs.current_principal_amount = flt(loan_amount)
	rs.moratorium_tenure = 0
	rs.moratorium_type = ""
	rs.repayment_schedule_type = schedule_type

	with elevated():
		rs.validate()

	rows = rs.get("repayment_schedule") or []
	total = sum(flt(r.total_payment) for r in rows)
	first_emi = flt(rows[0].total_payment) if rows else 0
	interest = sum(flt(r.interest_amount) for r in rows)

	return {
		"loan_amount": flt(loan_amount, 2),
		"rate_of_interest": rate,
		"tenure": int(tenure),
		"emi": flt(first_emi, 2),
		"total_payable": flt(total, 2),
		"total_interest": flt(interest, 2),
	}


@frappe.whitelist()
def get_dues(loan: str, as_on_date: str | None = None) -> dict:
	"""Return current dues for the borrower's loan, shaped for the EMI screen."""

	ensure_owns_loan(loan)

	from lending.loan_management.doctype.loan_repayment.loan_repayment import calculate_amounts

	as_on_date = getdate(as_on_date)
	with elevated():
		amounts = calculate_amounts(loan, as_on_date)

	return {
		"as_on_date": as_on_date,
		"oldest_due_date": amounts.get("due_date"),
		"overdue_principal": flt(amounts.get("payable_principal_amount"), 2),
		"overdue_interest": flt(amounts.get("interest_amount"), 2),
		"penalty_amount": flt(amounts.get("penalty_amount"), 2),
		"charges": flt(amounts.get("total_charges_payable"), 2),
		"total_due": flt(amounts.get("payable_amount"), 2),
		"principal_outstanding": flt(amounts.get("pending_principal_amount"), 2),
	}


@frappe.whitelist()
def get_schedule(loan: str) -> list[dict]:
	"""Return the EMI amortization schedule for a borrower's loan."""

	ensure_owns_loan(loan)

	schedule_name = frappe.db.get_value(
		"Loan Repayment Schedule",
		{"loan": loan, "docstatus": 1, "status": "Active"},
		"name",
	)
	if not schedule_name:
		schedule_name = frappe.db.get_value(
			"Loan Repayment Schedule", {"loan": loan, "docstatus": 1}, "name"
		)
	if not schedule_name:
		return []

	with elevated():
		rows = frappe.get_all(
			"Repayment Schedule",
			filters={"parent": schedule_name},
			fields=[
				"payment_date",
				"principal_amount",
				"interest_amount",
				"total_payment",
				"balance_loan_amount",
			],
			order_by="payment_date asc",
		)
	for row in rows:
		row["principal_amount"] = flt(row["principal_amount"], 2)
		row["interest_amount"] = flt(row["interest_amount"], 2)
		row["total_payment"] = flt(row["total_payment"], 2)
		row["balance_loan_amount"] = flt(row["balance_loan_amount"], 2)
	return rows
