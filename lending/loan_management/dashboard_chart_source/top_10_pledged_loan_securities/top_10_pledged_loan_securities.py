# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from datetime import date, datetime
from typing import Any

import frappe
from frappe.query_builder.functions import Sum
from frappe.utils.dashboard import cache_source

from lending.loan_management.report.applicant_wise_loan_security_exposure.applicant_wise_loan_security_exposure import (
	get_loan_security_details,
)


@frappe.whitelist()
@cache_source
def get_data(
	chart_name: str | None = None,
	chart: str | dict[str, Any] | None = None,
	no_cache: bool | int | None = None,
	filters: str | list | dict[str, Any] | None = None,
	from_date: str | date | datetime | None = None,
	to_date: str | date | datetime | None = None,
	timespan: str | None = None,
	time_interval: str | None = None,
	heatmap_year: str | None = None,
):
	if chart_name:
		chart = frappe.get_doc("Dashboard Chart", chart_name)
	else:
		chart = frappe._dict(frappe.parse_json(chart))

	filters = {}
	current_pledges = {}

	if filters:
		filters = frappe.parse_json(filters)[0]

	labels = []
	values = []

	loan_security_details = get_loan_security_details()

	loan_security_release = frappe.qb.DocType("Loan Security Release")
	unpledge = frappe.qb.DocType("Unpledge")

	unpledge_query = (
		frappe.qb.from_(unpledge)
		.inner_join(loan_security_release)
		.on(unpledge.parent == loan_security_release.name)
		.select(
			unpledge.loan_security,
			Sum(unpledge.qty).as_("qty")
		)
		.where(loan_security_release.status == "Approved")
		.groupby(unpledge.loan_security)
	)

	if filters.get("company"):
		unpledge_query = unpledge_query.where(loan_security_release.company == filters.get("company"))

	unpledge_results = unpledge_query.run(as_dict=True)
	unpledges = frappe._dict()
	for row in unpledge_results:
		unpledges[row.loan_security] = row.qty

	loan_security_assignment = frappe.qb.DocType("Loan Security Assignment")
	pledge = frappe.qb.DocType("Pledge")

	pledge_query = (
		frappe.qb.from_(pledge)
		.inner_join(loan_security_assignment)
		.on(pledge.parent == loan_security_assignment.name)
		.select(
			pledge.loan_security,
			Sum(pledge.qty).as_("qty")
		)
		.where(loan_security_assignment.status == "Pledged")
		.groupby(pledge.loan_security)
	)

	if filters.get("company"):
		pledge_query = pledge_query.where(loan_security_assignment.company == filters.get("company"))

	pledge_results = pledge_query.run(as_dict=True)
	pledges = frappe._dict()
	for row in pledge_results:
		pledges[row.loan_security] = row.qty

	for security, qty in pledges.items():
		current_pledges.setdefault(security, qty)
		current_pledges[security] -= unpledges.get(security, 0.0)

	sorted_pledges = dict(sorted(current_pledges.items(), key=lambda item: item[1], reverse=True))

	count = 0
	for security, qty in sorted_pledges.items():
		values.append(qty * loan_security_details.get(security, {}).get("latest_price", 0))
		labels.append(security)
		count += 1

		# Just need top 10 securities
		if count == 10:
			break

	return {
		"labels": labels,
		"datasets": [{"name": "Top 10 Securities", "chartType": "bar", "values": values}],
	}
