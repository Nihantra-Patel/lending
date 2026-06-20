# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""eKYC / e-Sign status passthrough for the native borrower app.

The actual KYC and e-sign flow is owned by the ``ekyc_india`` app (Digio
integration). This module is a read-only passthrough: given one of the
borrower's loans / applications, it surfaces the latest Digio request status so
the app can show "Verified" / "Pending" without coupling the app to Digio
internals. It never modifies anything in ``ekyc_india``.
"""

import frappe

from lending.mobile_api.utils import ensure_owns_loan, get_current_applicant


def _ekyc_available() -> bool:
	return "ekyc_india" in frappe.get_installed_apps() and frappe.db.exists(
		"DocType", "Digio Request Log"
	)


def _latest_status(linked_doctype: str, linked_docname: str) -> dict | None:
	logs = frappe.get_all(
		"Digio Request Log",
		filters={"linked_doctype": linked_doctype, "linked_docname": linked_docname},
		fields=["request_type", "status", "webhook_received_at", "modified"],
		order_by="modified desc",
		limit=1,
	)
	return logs[0] if logs else None


@frappe.whitelist()
def get_kyc_status(loan: str | None = None, loan_application: str | None = None) -> dict:
	"""Return the latest KYC / e-Sign status for a borrower's loan or application.

	Pass either ``loan`` or ``loan_application``. Ownership is enforced.
	"""

	if not _ekyc_available():
		return {"available": False, "status": None, "verified": False}

	if loan:
		ensure_owns_loan(loan)
		linked_doctype, linked_docname = "Loan", loan
	elif loan_application:
		applicant_type, applicant = get_current_applicant()
		owner = frappe.db.get_value(
			"Loan Application",
			loan_application,
			["applicant_type", "applicant"],
			as_dict=True,
		)
		if not owner or owner.applicant_type != applicant_type or owner.applicant != applicant:
			frappe.throw(frappe._("Loan application not found."), frappe.PermissionError)
		linked_doctype, linked_docname = "Loan Application", loan_application
	else:
		frappe.throw(frappe._("Provide a loan or loan application."))

	latest = _latest_status(linked_doctype, linked_docname)
	if not latest:
		return {"available": True, "status": "Not Started", "verified": False}

	verified = latest.get("status") in ("KYC Approved", "KYC Completed", "Signed")
	return {
		"available": True,
		"request_type": latest.get("request_type"),
		"status": latest.get("status"),
		"verified": verified,
		"updated_at": latest.get("webhook_received_at") or latest.get("modified"),
	}
