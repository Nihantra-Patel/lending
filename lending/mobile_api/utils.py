# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Shared helpers for the mobile API.

The native app authenticates as a real Frappe user (a borrower). Every borrower
is linked to a Customer via that Customer's ``email_id``. These helpers resolve
the current borrower and guarantee that a request can only ever read or write
records that belong to that borrower.
"""

import frappe
from frappe import _


def get_current_applicant() -> tuple[str, str]:
	"""Return the ``(applicant_type, applicant)`` for the logged-in borrower.

	The mobile app always acts on behalf of a single Customer, resolved from the
	logged-in user's email. Guests are rejected outright.
	"""

	user = frappe.session.user
	if not user or user == "Guest":
		frappe.throw(_("Authentication required."), frappe.AuthenticationError)

	customer = frappe.db.get_value("Customer", {"email_id": user}, "name")
	if not customer:
		frappe.throw(
			_("No borrower profile is linked to this account."),
			frappe.PermissionError,
		)

	return "Customer", customer


def ensure_owns_loan(loan: str) -> str:
	"""Confirm the current borrower owns ``loan`` and return its name.

	Prevents a borrower from reading another borrower's loan by passing an
	arbitrary loan id.
	"""

	applicant_type, applicant = get_current_applicant()
	owner = frappe.db.get_value(
		"Loan", loan, ["applicant_type", "applicant"], as_dict=True
	)
	if not owner or owner.applicant_type != applicant_type or owner.applicant != applicant:
		frappe.throw(_("Loan not found."), frappe.PermissionError)

	return loan
