import frappe
from frappe import _
from frappe.query_builder.functions import Sum


def execute(filters=None):
	filters = filters or {}
	columns = get_columns()
	data = get_data(filters)
	return columns, data


def get_columns():
	return [
		{"label": _("Loan"), "fieldname": "loan", "fieldtype": "Link", "options": "Loan", "width": 200},
		{"label": _("Applicant Name"), "fieldname": "applicant", "fieldtype": "Data", "width": 150},
		{
			"label": _("Loan Product"),
			"fieldname": "loan_product",
			"fieldtype": "Link",
			"options": "Loan Product",
			"width": 150,
		},
		{
			"label": _("Principal Amount"),
			"fieldname": "principal_amount",
			"fieldtype": "Currency",
			"width": 150,
		},
		{
			"label": _("Interest Amount"),
			"fieldname": "interest_amount",
			"fieldtype": "Currency",
			"width": 150,
		},
		{
			"label": _("Additional Interest"),
			"fieldname": "additional_interest",
			"fieldtype": "Currency",
			"width": 150,
		},
		{
			"label": _("Total Charges Paid"),
			"fieldname": "total_charges_paid",
			"fieldtype": "Currency",
			"width": 150,
		},
		{
			"label": _("Total Penalty Paid"),
			"fieldname": "total_penalty_paid",
			"fieldtype": "Currency",
			"width": 150,
		},
		{
			"label": _("Excess Amount"),
			"fieldname": "excess_amount",
			"fieldtype": "Currency",
			"width": 150,
		},
	]


def get_data(filters):
	data = []

	if not filters.get("as_on_date"):
		frappe.throw(_("Please select a date."))

	loan_repayment = frappe.qb.DocType("Loan Repayment")

	query = (
		frappe.qb.from_(loan_repayment)
		.select(
			loan_repayment.against_loan.as_("loan"),
			loan_repayment.applicant,
			loan_repayment.loan_product,
			Sum(loan_repayment.principal_amount_paid).as_("principal_amount"),
			Sum(loan_repayment.total_interest_paid).as_("interest_amount"),
			Sum(loan_repayment.unbooked_interest_paid).as_("additional_interest"),
			Sum(loan_repayment.total_charges_paid).as_("total_charges_paid"),
			Sum(loan_repayment.total_penalty_paid).as_("total_penalty_paid"),
			Sum(loan_repayment.excess_amount).as_("excess_amount")
		)
		.where(loan_repayment.docstatus == 1)
		.where(loan_repayment.posting_date <= filters["as_on_date"])
		.where(loan_repayment.repayment_type.notin(['Interest Waiver', 'Penalty Waiver', 'Charges Waiver']))
		.groupby(loan_repayment.against_loan)
		.orderby(loan_repayment.against_loan)
	)

	if filters.get("company"):
		query = query.where(loan_repayment.company == filters.get("company"))

	if filters.get("loan_product"):
		query = query.where(loan_repayment.loan_product == filters.get("loan_product"))

	if filters.get("applicant"):
		query = query.where(loan_repayment.applicant == filters.get("applicant"))

	if filters.get("loan"):
		query = query.where(loan_repayment.against_loan == filters.get("loan"))

	records = query.run(as_dict=True)

	for row in records:
		data.append(
			{
				"loan": row.loan,
				"applicant": row.applicant,
				"loan_product": row.loan_product,
				"principal_amount": row.principal_amount or 0,
				"interest_amount": row.interest_amount or 0,
				"additional_interest": row.additional_interest or 0,
				"total_charges_paid": row.total_charges_paid or 0,
				"total_penalty_paid": row.total_penalty_paid or 0,
				"excess_amount": row.excess_amount or 0,
			}
		)

	return data
