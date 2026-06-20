# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Workflow-driven loan-application actions for the native borrower app.

The onboarding / eKYC flow is **not** hardcoded in the app. A lender configures a
Frappe Workflow on the Loan Application (for example the "Loan Application EKYC"
workflow, whose transitions can call ``ekyc_india``'s ``make_ekyc_request`` via a
workflow action). The app simply reads the current workflow state and the
transitions available to the borrower, and applies whichever action they choose.

If no workflow is active for Loan Application, these endpoints report that and the
app falls back to showing plain status — so the flow is fully dynamic and driven
by the lender's configuration.
"""

import frappe
from frappe import _
from frappe.model.workflow import apply_workflow, get_workflow_name

from lending.mobile_api.utils import elevated, get_current_applicant


def _own_application(loan_application: str):
	applicant_type, applicant = get_current_applicant()
	owner = frappe.db.get_value(
		"Loan Application", loan_application, ["applicant_type", "applicant"], as_dict=True
	)
	if not owner or owner.applicant_type != applicant_type or owner.applicant != applicant:
		frappe.throw(_("Loan application not found."), frappe.PermissionError)
	with elevated():
		return frappe.get_doc("Loan Application", loan_application)


@frappe.whitelist()
def get_application_flow(loan_application: str) -> dict:
	"""Return the workflow state and borrower-available actions for an application."""

	doc = _own_application(loan_application)
	workflow_name = get_workflow_name("Loan Application")

	if not workflow_name:
		return {
			"has_workflow": False,
			"state": doc.get("status"),
			"actions": [],
		}

	workflow = frappe.get_doc("Workflow", workflow_name)
	state_field = workflow.workflow_state_field
	current_state = doc.get(state_field) or doc.get("status")

	# Compute the actions available to *this* borrower from the workflow definition
	# directly. We avoid frappe's get_transitions() because it hard-checks the
	# Loan Application read permission, which a Customer-role borrower lacks even
	# for their own application. Borrowers usually have no transitions (lender
	# staff drive the flow) — they just watch the state advance.
	roles = set(frappe.get_roles())
	actions = [
		t.action
		for t in workflow.transitions
		if t.state == current_state and t.allowed in roles
	]

	return {
		"has_workflow": True,
		"workflow": workflow_name,
		"state": current_state,
		"actions": actions,
	}


@frappe.whitelist()
def apply_application_action(loan_application: str, action: str) -> dict:
	"""Apply a workflow action to the borrower's application.

	Running the transition fires whatever the lender wired to it — e.g. an eKYC
	request through ``ekyc_india``. We never call Digio directly; the workflow
	owns the side effects.
	"""

	doc = _own_application(loan_application)
	with elevated():
		updated = apply_workflow(doc, action)

	state_field = frappe.db.get_value(
		"Workflow", get_workflow_name("Loan Application"), "workflow_state_field"
	)
	return {
		"ok": True,
		"state": updated.get(state_field) if state_field else updated.get("status"),
		"message": _("Action '{0}' applied.").format(action),
	}
