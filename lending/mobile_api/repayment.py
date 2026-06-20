# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Repayment, EMI schedule and dues endpoints for the native borrower app."""

import frappe
from frappe.utils import flt, getdate

from lending.mobile_api.utils import elevated, ensure_owns_loan


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
