# Copyright (c) 2013, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt


import frappe
from frappe import _


def execute(filters=None):
	columns = get_columns(filters)
	data = get_data(filters)
	return columns, data


def get_columns(filters):
	columns = [
		{
			"label": _("Loan Security Assignment"),
			"fieldtype": "Link",
			"fieldname": "loan_security_assignment",
			"options": "Loan Security Assignment",
			"width": 200,
		},
		{"label": _("Loan"), "fieldtype": "Link", "fieldname": "loan", "options": "Loan", "width": 200},
		{"label": _("Applicant"), "fieldtype": "Data", "fieldname": "applicant", "width": 200},
		{"label": _("Status"), "fieldtype": "Data", "fieldname": "status", "width": 100},
		{"label": _("Pledge Time"), "fieldtype": "Data", "fieldname": "pledge_time", "width": 150},
		{
			"label": _("Loan Security"),
			"fieldtype": "Link",
			"fieldname": "loan_security",
			"options": "Loan Security",
			"width": 150,
		},
		{"label": _("Quantity"), "fieldtype": "Float", "fieldname": "qty", "width": 100},
		{
			"label": _("Loan Security Price"),
			"fieldtype": "Currency",
			"fieldname": "loan_security_price",
			"options": "currency",
			"width": 200,
		},
		{
			"label": _("Loan Security Value"),
			"fieldtype": "Currency",
			"fieldname": "loan_security_value",
			"options": "currency",
			"width": 200,
		},
		{
			"label": _("Currency"),
			"fieldtype": "Link",
			"fieldname": "currency",
			"options": "Currency",
			"width": 50,
			"hidden": 1,
		},
	]

	return columns


def get_data(filters):
	data = []

	loan_security_assignment = frappe.qb.DocType("Loan Security Assignment")
	pledge = frappe.qb.DocType("Pledge")

	query = (
		frappe.qb.from_(pledge)
		.inner_join(loan_security_assignment)
		.on(pledge.parent == loan_security_assignment.name)
		.select(
			loan_security_assignment.name,
			loan_security_assignment.applicant,
			loan_security_assignment.loan,
			loan_security_assignment.status,
			loan_security_assignment.pledge_time,
			pledge.loan_security,
			pledge.qty,
			pledge.loan_security_price,
			pledge.amount
		)
		.where(loan_security_assignment.docstatus == 1)
		.where(loan_security_assignment.company == filters.get("company"))
	)

	if filters.get("applicant"):
		query = query.where(loan_security_assignment.applicant == filters.get("applicant"))

	if filters.get("pledge_status"):
		query = query.where(loan_security_assignment.status == filters.get("pledge_status"))

	loan_security_assignments = query.run(as_dict=True)

	default_currency = frappe.get_cached_value("Company", filters.get("company"), "default_currency")

	for pledge in loan_security_assignments:
		row = {}
		row["loan_security_assignment"] = pledge.name
		row["loan"] = pledge.loan
		row["applicant"] = pledge.applicant
		row["status"] = pledge.status
		row["pledge_time"] = pledge.pledge_time
		row["loan_security"] = pledge.loan_security
		row["qty"] = pledge.qty
		row["loan_security_price"] = pledge.loan_security_price
		row["loan_security_value"] = pledge.amount
		row["currency"] = default_currency

		data.append(row)

	return data
