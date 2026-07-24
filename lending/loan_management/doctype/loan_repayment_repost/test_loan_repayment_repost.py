# Copyright (c) 2024, Frappe Technologies Pvt. Ltd. and Contributors
# See license.txt

import frappe
from frappe.utils import flt, get_datetime, getdate

from lending.loan_management.doctype.loan_repayment.loan_repayment import calculate_amounts
from lending.loan_management.doctype.process_loan_demand.process_loan_demand import (
	process_daily_loan_demands,
)
from lending.loan_management.doctype.process_loan_interest_accrual.process_loan_interest_accrual import (
	process_loan_interest_accrual_for_loans,
)
from lending.tests.test_utils import (
	create_loan,
	create_loan_write_off,
	create_repayment_entry,
	init_customers,
	init_loan_products,
	make_loan_disbursement_entry,
	master_init,
	set_loan_accrual_frequency,
)
from lending.tests.utils import LendingTestSuite


class TestLoanRepaymentRepost(LendingTestSuite):
	"""
	Integration tests for LoanRepaymentRepost.
	Use this class for testing interactions between multiple components.
	"""

	def setUp(self):
		master_init()
		init_loan_products()
		init_customers()
		self.applicant2 = frappe.db.get_value("Customer", {"name": "_Test Loan Customer"}, "name")

	def test_backdated_repayment_allocation_resets_on_repost(self):
		set_loan_accrual_frequency(loan_accrual_frequency="Daily")
		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			10000,
			"Repay Over Number of Periods",
			2,
			"Customer",
			"2025-02-15",
			"2025-01-25",
			rate_of_interest=10,
		)
		loan.submit()

		make_loan_disbursement_entry(
			loan.name, loan.loan_amount, disbursement_date="2025-01-25", repayment_start_date="2025-02-15"
		)
		process_daily_loan_demands(posting_date="2025-02-15", loan=loan.name)

		payable_amount = calculate_amounts(against_loan=loan.name, posting_date="2025-02-15")[
			"payable_amount"
		]

		create_repayment_entry(
			loan.name, get_datetime("2025-02-15 00:06:10"), payable_amount
		).submit()

		process_daily_loan_demands(posting_date="2025-03-15", loan=loan.name)

		payable_amount = calculate_amounts(against_loan=loan.name, posting_date="2025-03-20")[
			"payable_amount"
		]

		create_repayment_entry(
			loan.name, get_datetime("2025-03-20 00:06:10"), flt(payable_amount / 2, 2)
		).submit()

		create_repayment_entry(
			loan.name, get_datetime("2025-03-16 00:06:10"), flt(payable_amount / 2, 2)
		).submit()

		demands = frappe.db.get_all(
			"Loan Demand",
			{"loan": loan.name, "docstatus": 1},
			["outstanding_amount"],
		)
		for demand in demands:
			self.assertEqual(demand.outstanding_amount, 0)

	def test_repost_on_same_day_payments(self):
		set_loan_accrual_frequency(loan_accrual_frequency="Daily")
		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			10000,
			"Repay Over Number of Periods",
			2,
			"Customer",
			"2025-02-15",
			"2025-01-25",
			rate_of_interest=10,
		)
		loan.submit()

		make_loan_disbursement_entry(
			loan.name, loan.loan_amount, disbursement_date="2025-01-25", repayment_start_date="2025-02-15"
		)
		process_daily_loan_demands(posting_date="2025-02-15", loan=loan.name)

		payable_amount = calculate_amounts(against_loan=loan.name, posting_date="2025-02-15")[
			"payable_amount"
		]

		create_repayment_entry(loan.name, "2025-02-15", payable_amount).submit()

		process_daily_loan_demands(posting_date="2025-03-15", loan=loan.name)

		payable_amount = calculate_amounts(against_loan=loan.name, posting_date="2025-03-20")[
			"payable_amount"
		]

		create_repayment_entry(loan.name, "2025-03-16", flt(payable_amount / 2, 2)).submit()

		create_repayment_entry(loan.name, "2025-03-16", flt(payable_amount / 2, 2)).submit()

		demands = frappe.db.get_all(
			"Loan Demand",
			{"loan": loan.name, "docstatus": 1},
			["outstanding_amount"],
		)
		for demand in demands:
			self.assertEqual(demand.outstanding_amount, 0)

	def test_penal_interest_regenerated_after_reposting_repayment(self):
		set_loan_accrual_frequency("Daily")

		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			500000,
			"Repay Over Number of Periods",
			12,
			"Customer",
			repayment_start_date="2024-05-05",
			posting_date="2024-04-01",
			penalty_charges_rate=25,

		)

		loan.submit()

		make_loan_disbursement_entry(
			loan.name, loan.loan_amount, disbursement_date="2024-04-01", repayment_start_date="2024-05-05"
		)

		process_daily_loan_demands(posting_date="2024-05-05", loan=loan.name)

		process_loan_interest_accrual_for_loans(
			posting_date="2024-05-10", loan=loan.name, company="_Test Company"
		)

		create_repayment_entry(loan.name, "2024-05-11", 47523.00).submit()

		frappe.get_doc(
			{
				"doctype": "Loan Repayment Repost",
				"loan": loan.name,
				"repost_date": "2024-05-05",
				"cancel_future_emi_demands": 1,
				"cancel_future_accruals_and_demands": 1,
			}
		).submit()

		penal_interest = frappe.db.exists(
			"Loan Interest Accrual",
			{
				"loan": loan.name,
				"posting_date": "2024-05-10",
				"interest_type": "Penal Interest",
				"docstatus": 1,
			},
		)

		self.assertTrue(penal_interest, "Penal interest should exist after repost")

	def test_gl_entries_after_loan_repayment_repost(self):
		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			500000,
			"Repay Over Number of Periods",
			2,
			repayment_start_date="2024-04-05",
			posting_date="2024-03-06",
			rate_of_interest=25,
			applicant_type="Customer",
		)

		loan.submit()
		make_loan_disbursement_entry(
			loan.name, loan.loan_amount, disbursement_date="2024-03-06", repayment_start_date="2024-04-05"
		)
		process_daily_loan_demands(posting_date="2024-05-05", loan=loan.name)

		repayment_entry = create_repayment_entry(loan.name, "2024-04-05", 257840)
		repayment_entry.submit()

		frappe.db.set_value("Loan Repayment", repayment_entry.name, "posting_date", "2024-04-05", update_modified=False)

		repayments_1 = frappe.db.get_all(
			"GL Entry",
			{"voucher_type": "Loan Repayment", "voucher_no": repayment_entry.name, "is_cancelled": 0},
			["name"]
		)

		for repayment_1 in repayments_1:
			frappe.db.set_value("GL Entry", repayment_1.name, "posting_date", "2024-04-05", update_modified=False)

		frappe.get_doc(
			{
				"doctype": "Loan Repayment Repost",
				"loan": loan.name,
				"repost_date": "2024-04-04",
				"cancel_future_emi_demands": 1,
				"cancel_future_accruals_and_demands": 1,
			}
		).submit()

		repayment_entry.load_from_db()

		# After a repost, only the entries the repost generates (reversals + regenerated
		# bookings) should carry the current posting date.
		#
		# This must hold regardless of the Immutable Ledger setting:
		#   - Immutable Ledger OFF: the original entries are cancelled, so only repost
		#     entries remain non-cancelled.
		#   - Immutable Ledger ON:  the original entries are kept non-cancelled at their
		#     original date by design, so they must be excluded from this check.
		#
		# We therefore exclude the original GL entries (captured before the repost) by name.
		original_gl_entries = [d.name for d in repayments_1]

		repayments_2 = frappe.db.get_all(
			"GL Entry",
			{
				"voucher_type": "Loan Repayment",
				"voucher_no": repayment_entry.name,
				"is_cancelled": 0,
				"name": ("not in", original_gl_entries),
			},
			["posting_date"],
		)

		self.assertTrue(repayments_2, "Repost should have generated new GL entries")

		for repayment_2 in repayments_2:
			self.assertEqual(
				repayment_2.posting_date,
				getdate(),
				"Posting date of GL entries should be current date after the loan repayment repost",
			)

	def test_security_deposit_adjustment_gl_entries_after_repost(self):
		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			5000,
			"Repay Over Number of Periods",
			12,
			"Customer",
			posting_date="2024-03-25",
			rate_of_interest=12,
		)
		loan.submit()

		make_loan_disbursement_entry(
			loan.name,
			loan.loan_amount,
			disbursement_date="2024-03-25",
			repayment_start_date="2024-04-01",
			withhold_security_deposit=1,
		)

		deposit_amount = frappe.db.get_value(
			"Loan Security Deposit", {"loan": loan.name, "docstatus": 1}, "deposit_amount"
		)

		amounts = calculate_amounts(against_loan=loan.name, posting_date="2024-04-05")
		shortfall = flt(
			amounts.get("pending_principal_amount", 0)
			+ amounts.get("interest_amount", 0)
			+ amounts.get("penalty_amount", 0)
			+ amounts.get("unaccrued_interest", 0)
			+ amounts.get("unbooked_interest", 0)
			+ amounts.get("unbooked_penalty", 0)
			+ amounts.get("total_charges_payable", 0)
			- flt(deposit_amount),
			2,
		)

		frappe.get_doc(
			{
				"doctype": "Loan Adjustment",
				"loan": loan.name,
				"posting_date": "2024-04-05",
				"foreclosure_type": "Manual Foreclosure",
				"adjustments": [
					{
						"loan_repayment_type": "Security Deposit Adjustment",
						"amount": deposit_amount,
					},
					{
						"loan_repayment_type": "Normal Repayment",
						"amount": shortfall,
					},
				],
			}
		).submit()

		loan_repayment = frappe.db.get_value(
			"Loan Repayment",
			{"repayment_type": "Security Deposit Adjustment", "against_loan": loan.name, "docstatus": 1},
			"name",
		)

		security_deposit_account = frappe.get_value(
			"Loan Product", loan.loan_product, "security_deposit_account"
		)
		payment_account = frappe.get_value("Loan Product", loan.loan_product, "payment_account")

		# Simulate a `before_validate` hook (as some client apps register) that reclassifies
		# a Security Deposit Adjustment repayment during repost. This is the exact condition
		# that causes repayment_type to drift mid-repost in production.
		from lending.loan_management.doctype.loan_repayment.loan_repayment import LoanRepayment

		original_before_validate = LoanRepayment.before_validate

		def before_validate_with_simulated_drift(self):
			original_before_validate(self)
			if self.flags.from_repost and self.repayment_type == "Security Deposit Adjustment":
				self.repayment_type = "Pre Payment"

		LoanRepayment.before_validate = before_validate_with_simulated_drift
		try:
			frappe.get_doc(
				{
					"doctype": "Loan Repayment Repost",
					"loan": loan.name,
					"repost_date": "2024-04-05",
				}
			).submit()
		finally:
			LoanRepayment.before_validate = original_before_validate

		repayment_type = frappe.db.get_value("Loan Repayment", loan_repayment, "repayment_type")
		self.assertEqual(
			repayment_type,
			"Security Deposit Adjustment",
			"repayment_type must remain Security Deposit Adjustment after repost",
		)

		live_gl_entries = frappe.db.get_all(
			"GL Entry",
			{"voucher_type": "Loan Repayment", "voucher_no": loan_repayment, "is_cancelled": 0},
			["account", "debit", "voucher_subtype"],
		)

		self.assertTrue(live_gl_entries, "Repost should leave live GL entries for the repayment")

		for entry in live_gl_entries:
			self.assertEqual(
				entry.voucher_subtype,
				"Security Deposit Adjustment",
				"voucher_subtype must not drift to another repayment type after repost",
			)
			if entry.debit:
				self.assertEqual(
					entry.account,
					security_deposit_account,
					"Debit after repost must hit the security deposit account, not the payment account",
				)
				self.assertNotEqual(
					entry.account,
					payment_account,
					"Debit after repost must not fall back to the loan's payment account",
				)

	def test_loan_write_off_settlement_status_after_repost(self):
		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			2500000,
			"Repay Over Number of Periods",
			24,
			"Customer",
			repayment_start_date="2024-11-05",
			posting_date="2024-10-05",
			rate_of_interest=25,
		)
		loan.submit()

		make_loan_disbursement_entry(
			loan.name, loan.loan_amount, disbursement_date="2024-10-05", repayment_start_date="2024-11-05"
		)

		process_daily_loan_demands(posting_date="2024-11-05", loan=loan.name)

		create_loan_write_off(loan.name, "2024-11-05", write_off_amount=250000)

		repayment_1 = create_repayment_entry(
			loan.name, "2025-01-05", 750000, repayment_type="Write Off Recovery"
		)
		repayment_1.submit()

		repayment_2 = create_repayment_entry(
			loan.name, "2025-01-06", 750000, repayment_type="Write Off Recovery"
		)
		repayment_2.submit()

		repayment_1.cancel()

		repayment_3 = create_repayment_entry(
			loan.name, "2025-01-05", 750000, repayment_type="Write Off Settlement"
		)
		repayment_3.submit()

		loan.load_from_db()
		self.assertEqual(loan.status, "Settled")
