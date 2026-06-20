# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Authentication and profile endpoints for the native borrower app.

Login itself is handled by Frappe's standard token / ``/api/method/login``
flow. These endpoints let the app fetch the signed-in borrower's profile so it
can render the home screen without leaking any other user's data.
"""

import frappe

from lending.mobile_api.utils import get_current_applicant


@frappe.whitelist()
def get_profile() -> dict:
	"""Return the logged-in borrower's basic profile for the app home screen."""

	applicant_type, applicant = get_current_applicant()

	customer = frappe.db.get_value(
		"Customer",
		applicant,
		["customer_name", "email_id", "mobile_no", "image"],
		as_dict=True,
	) or frappe._dict()

	return {
		"user": frappe.session.user,
		"applicant_type": applicant_type,
		"applicant": applicant,
		"full_name": customer.get("customer_name") or frappe.utils.get_fullname(),
		"email": customer.get("email_id"),
		"mobile_no": customer.get("mobile_no"),
		"image": customer.get("image"),
	}
