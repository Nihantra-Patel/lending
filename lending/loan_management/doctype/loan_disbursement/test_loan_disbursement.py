# Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase
from frappe.utils import getdate

from lending.tests.test_utils import (
	create_loan,
	create_loan_application,
	create_loan_security_assignment,
	create_loan_with_security,
	init_customers,
	init_loan_products,
	make_loan_disbursement_entry,
	master_init,
)


class TestLoanDisbursement(IntegrationTestCase):
	def setUp(self):
		master_init()
		init_loan_products()
		init_customers()

	def test_loan_disbursement(self):
		pledge = [{"loan_security": "Test Security 1", "qty": 4000.00}]

		loan_application = create_loan_application(
			"_Test Company", self.applicant2, "Stock Loan", pledge, "Repay Over Number of Periods", 12
		)

		create_loan_security_assignment(loan_application)

		loan = create_loan_with_security(
			self.applicant2, "Stock Loan", "Repay Over Number of Periods", 12, loan_application
		)
		self.assertEqual(loan.loan_amount, 1000000)

		loan.submit()

		loan_disbursement_entry1 = make_loan_disbursement_entry(loan.name, 500000)
		loan_disbursement_entry2 = make_loan_disbursement_entry(loan.name, 500000)

		loan = frappe.get_doc("Loan", loan.name)
		gl_entries1 = frappe.db.get_all(
			"GL Entry",
			fields=["name"],
			filters={"voucher_type": "Loan Disbursement", "voucher_no": loan_disbursement_entry1.name},
		)

		gl_entries2 = frappe.db.get_all(
			"GL Entry",
			fields=["name"],
			filters={"voucher_type": "Loan Disbursement", "voucher_no": loan_disbursement_entry2.name},
		)

		self.assertEqual(loan.status, "Disbursed")
		self.assertEqual(loan.disbursed_amount, 1000000)
		self.assertTrue(gl_entries1)
		self.assertTrue(gl_entries2)

	def test_multi_tranche_disbursement_accrual(self):
		loan = create_loan(
			self.applicant1,
			"Term Loan Product 4",
			1000000,
			"Repay Over Number of Periods",
			6,
			repayment_start_date="2024-05-05",
			posting_date="2024-04-18",
			rate_of_interest=23,
		)

		loan.submit()

		make_loan_disbursement_entry(
			loan.name,
			500000,
			disbursement_date=getdate("2024-04-18"),
			repayment_start_date=getdate("2024-05-05"),
		)

		make_loan_disbursement_entry(
			loan.name,
			300000,
			disbursement_date=getdate("2024-05-10"),
			repayment_start_date=getdate("2024-06-05"),
		)

		make_loan_disbursement_entry(
			loan.name,
			200000,
			disbursement_date=getdate("2024-06-10"),
			repayment_start_date=getdate("2024-07-05"),
		)

	def test_broken_period_interest_update(self):
		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			100000,
			"Repay Over Number of Periods",
			22,
			repayment_start_date="2024-04-05",
			posting_date="2024-02-20",
			rate_of_interest=8.5,
			applicant_type="Customer",
		)

		loan.submit()

		# Daily accrual
		disbursement = make_loan_disbursement_entry(
			loan.name, loan.loan_amount, disbursement_date="2024-02-20", repayment_start_date="2024-04-05"
		)

		self.assertTrue(disbursement.broken_period_interest, "BPI not set in disbursement")
		self.assertTrue(disbursement.broken_period_interest_days, "BPI not set in disbursement")

	def test_sales_invoice_created_on_loan_disbursement_with_charges(self):
		loan = create_loan(
			"_Test Customer 1",
			"Term Loan Product 4",
			100000,
			"Repay Over Number of Periods",
			2,
			"Customer",
			"2024-07-15",
			"2024-06-25",
			10,
		)
		loan.submit()

		make_loan_disbursement_entry(
			loan.name,
			loan.loan_amount,
			disbursement_date="2024-06-25",
			repayment_start_date="2024-07-15",
			loan_disbursement_charges=[{"charge": "Processing Fee", "amount": 5000}],
		)

		invoices = frappe.get_all(
			"Sales Invoice",
			filters={
				"docstatus": 1,
				"customer": "_Test Customer 1",
				"loan": loan.name,
			},
		)

		self.assertTrue(
			len(invoices) == 1, "Expected 1 Sales Invoice to be created for Loan Disbursement charge."
		)
