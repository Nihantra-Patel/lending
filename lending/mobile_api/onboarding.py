# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Borrower onboarding journeys for the native app.

Each loan product type has a different onboarding journey (the fields a borrower
must provide). Journeys are stored as ``Loan Onboarding Journey`` config records
so a lender can customise them (add/remove/reorder fields) without any app
change — the app renders whatever schema the backend returns.

Sensible defaults for the standard product types are seeded on first use via
:func:`ensure_default_journeys`, but they are just starting points the lender
owns thereafter.
"""

import frappe
from frappe import _

from lending.mobile_api.utils import elevated, get_current_applicant

# Default journeys — starting points a lender can edit. Field types map to the
# Loan Onboarding Field select: Data / Number / Float / Select / Date / Check /
# Text / File / Phone / Email.
DEFAULT_JOURNEYS = {
	"Personal Loan": [
		("Employment", "Employment type", "employment_type", "Select", 1, "Salaried\nSelf-employed\nBusiness", ""),
		("Employment", "Monthly income (₹)", "monthly_income", "Number", 1, "", ""),
		("Employment", "Employer / business name", "employer_name", "Data", 0, "", ""),
		("Identity", "PAN", "pan", "Data", 1, "", "10-character PAN"),
		("Identity", "PAN card", "pan_card", "File", 0, "", ""),
	],
	"Business Loan/SME Loan": [
		("Business", "Business name", "business_name", "Data", 1, "", ""),
		("Business", "Business type", "business_type", "Select", 1, "Proprietorship\nPartnership\nPvt Ltd\nLLP", ""),
		("Business", "Annual turnover (₹)", "annual_turnover", "Number", 1, "", ""),
		("Business", "Years in operation", "years_in_operation", "Number", 0, "", ""),
		("Identity", "GSTIN", "gstin", "Data", 1, "", ""),
		("Documents", "Bank statement (6 months)", "bank_statement", "File", 0, "", ""),
	],
	"Vehicle/EV Loan": [
		("Vehicle", "Vehicle type", "vehicle_type", "Select", 1, "Two-wheeler\nCar\nEV\nCommercial", ""),
		("Vehicle", "Make & model", "vehicle_model", "Data", 1, "", ""),
		("Vehicle", "On-road price (₹)", "on_road_price", "Number", 1, "", ""),
		("Vehicle", "Down payment (₹)", "down_payment", "Number", 0, "", ""),
		("Vehicle", "Dealer / quotation", "dealer_quote", "File", 0, "", ""),
	],
	"Gold Loan": [
		("Gold", "Gold weight (grams)", "gold_weight", "Float", 1, "", ""),
		("Gold", "Purity", "gold_purity", "Select", 1, "18K\n20K\n22K\n24K", ""),
		("Gold", "Item description", "gold_description", "Text", 0, "", ""),
		("Gold", "Photo of gold items", "gold_photo", "File", 0, "", ""),
	],
	"Buy Now Pay Later": [
		("Purchase", "Merchant", "merchant", "Data", 1, "", ""),
		("Purchase", "Purchase amount (₹)", "purchase_amount", "Number", 1, "", ""),
		("Purchase", "Number of instalments", "instalments", "Select", 1, "3\n6\n9\n12", ""),
	],
	"Line of Credit": [
		("Credit", "Requested credit limit (₹)", "credit_limit", "Number", 1, "", ""),
		("Credit", "Purpose", "purpose", "Text", 0, "", ""),
		("Income", "Monthly income (₹)", "monthly_income", "Number", 1, "", ""),
	],
	"Loan Against Securities": [
		("Securities", "Security type", "security_type", "Select", 1, "Shares\nMutual Funds\nBonds\nFixed Deposit", ""),
		("Securities", "Demat / folio number", "demat_number", "Data", 1, "", ""),
		("Securities", "Pledged value (₹)", "pledged_value", "Number", 1, "", ""),
		("Securities", "Holding statement", "holding_statement", "File", 0, "", ""),
	],
}


def ensure_default_journeys():
	"""Create the default journey config records if they don't exist yet."""
	for journey_type, fields in DEFAULT_JOURNEYS.items():
		if frappe.db.exists("Loan Onboarding Journey", journey_type):
			continue
		doc = frappe.new_doc("Loan Onboarding Journey")
		doc.journey_type = journey_type
		doc.title = journey_type
		doc.enabled = 1
		for section, label, fieldname, fieldtype, reqd, options, help_text in fields:
			doc.append(
				"fields",
				{
					"section": section,
					"label": label,
					"fieldname": fieldname,
					"fieldtype": fieldtype,
					"reqd": reqd,
					"options": options,
					"help_text": help_text,
				},
			)
		doc.insert(ignore_permissions=True)
	frappe.db.commit()


@frappe.whitelist()
def list_journeys() -> list[dict]:
	"""Return the enabled onboarding journey types for the apply screen."""
	with elevated():
		ensure_default_journeys()
		journeys = frappe.get_all(
			"Loan Onboarding Journey",
			filters={"enabled": 1},
			fields=["journey_type", "title", "description"],
			order_by="journey_type",
		)
	return journeys


@frappe.whitelist()
def get_onboarding_journey(journey_type: str) -> dict:
	"""Return the field schema for a journey so the app can render its form."""
	with elevated():
		ensure_default_journeys()
		if not frappe.db.exists("Loan Onboarding Journey", journey_type):
			frappe.throw(_("Unknown onboarding journey."))
		doc = frappe.get_doc("Loan Onboarding Journey", journey_type)
	return doc.as_schema()


def save_submission(loan_application: str, journey_type: str | None, data: dict | None):
	"""Persist captured onboarding values against an application (internal)."""
	if not data:
		return
	applicant_type, applicant = get_current_applicant()
	with elevated():
		sub = frappe.new_doc("Borrower Onboarding Submission")
		sub.loan_application = loan_application
		sub.journey_type = journey_type
		sub.applicant = applicant
		sub.data_json = frappe.as_json(data)
		sub.insert(ignore_permissions=True)
