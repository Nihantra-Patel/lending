# Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and Contributors
# See license.txt

import unittest

import frappe

from erpnext.setup.doctype.employee.test_employee import make_employee

from lending.tests.test_utils import (
	create_demand_loan,
	create_loan_accounts,
	create_loan_application,
	create_loan_product,
	create_loan_security_assignment,
	set_loan_settings_in_company,
)


class TestLoanApplication(unittest.TestCase):
	def setUp(self):
		set_loan_settings_in_company()
		create_loan_accounts()
		create_loan_product(
			"Home Loan",
			"Home Loan",
			500000,
			9.2,
			0,
			1,
			0,
			repayment_schedule_type="Monthly as per repayment start date",
		)
		self.applicant = make_employee("kate_loan@loan.com", "_Test Company")
		self.create_loan_application()

	def create_loan_application(self):
		loan_application = frappe.new_doc("Loan Application")
		loan_application.update(
			{
				"applicant": self.applicant,
				"loan_product": "Home Loan",
				"rate_of_interest": 9.2,
				"loan_amount": 250000,
				"repayment_method": "Repay Over Number of Periods",
				"repayment_periods": 18,
				"company": "_Test Company",
				"applicant_type": "Employee",
				"applicant_email_address": "lending@example.com",
				"applicant_phone_number": "+91-9102837465",
			}
		)
		loan_application.insert()

	def test_loan_totals(self):
		loan_application = frappe.get_doc("Loan Application", {"applicant": self.applicant})

		self.assertEqual(loan_application.total_payable_interest, 18599)
		self.assertEqual(loan_application.total_payable_amount, 268599)
		self.assertEqual(loan_application.repayment_amount, 14923)

		loan_application.repayment_periods = 24
		loan_application.save()
		loan_application.reload()

		self.assertEqual(loan_application.total_payable_interest, 24657)
		self.assertEqual(loan_application.total_payable_amount, 274657)
		self.assertEqual(loan_application.repayment_amount, 11445)

	def test_sanctioned_amount_limit(self):
		# Clear loan docs before checking
		frappe.db.sql("DELETE FROM `tabLoan` where applicant = '_Test Loan Customer 1'")
		frappe.db.sql("DELETE FROM `tabLoan Application` where applicant = '_Test Loan Customer 1'")
		frappe.db.sql(
			"DELETE FROM `tabLoan Security Assignment` where applicant = '_Test Loan Customer 1'"
		)

		if not frappe.db.get_value(
			"Sanctioned Loan Amount",
			filters={
				"applicant_type": "Customer",
				"applicant": "_Test Loan Customer 1",
				"company": "_Test Company",
			},
		):
			frappe.get_doc(
				{
					"doctype": "Sanctioned Loan Amount",
					"applicant_type": "Customer",
					"applicant": "_Test Loan Customer 1",
					"sanctioned_amount_limit": 1500000,
					"company": "_Test Company",
				}
			).insert(ignore_permissions=True)

		# Make First Loan
		pledge = [{"loan_security": "Test Security 1", "qty": 4000.00}]

		loan_application = create_loan_application(
			"_Test Company", self.applicant3, "Demand Loan", pledge
		)
		create_loan_security_assignment(loan_application)
		loan = create_demand_loan(
			self.applicant3, "Demand Loan", loan_application, posting_date="2019-10-01"
		)
		loan.submit()

		# Make second loan greater than the sanctioned amount
		loan_application = create_loan_application(
			"_Test Company", self.applicant3, "Demand Loan", pledge, do_not_save=True
		)
		self.assertRaises(frappe.ValidationError, loan_application.save)