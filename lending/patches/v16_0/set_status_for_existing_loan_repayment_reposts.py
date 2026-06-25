import frappe


def execute():
	repost = frappe.qb.DocType("Loan Repayment Repost")

	(frappe.qb.update(repost).set(repost.status, "Draft").where(repost.docstatus == 0)).run()

	(
		frappe.qb.update(repost)
		.set(repost.status, "Completed")
		.where((repost.docstatus == 1) & (repost.status.notin(["In Progress", "Failed"])))
	).run()

	(frappe.qb.update(repost).set(repost.status, "Cancelled").where(repost.docstatus == 2)).run()
