# Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and Contributors
# See license.txt

import datetime
import unittest

import frappe

from erpnext.setup.doctype.employee.test_employee import make_employee

from lending.loan_management.doctype.loan_application.loan_application import (
	add_working_days,
	xirr,
)
from lending.tests.test_utils import (
	create_loan_accounts,
	create_loan_product,
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

	# --- Key Facts Statement (KFS) tests ---

	def test_kfs_generation(self):
		loan_application = frappe.get_doc("Loan Application", {"applicant": self.applicant})
		loan_application.build_kfs()

		# KFS marked generated with a proposal number and validity.
		self.assertTrue(loan_application.kfs_generated)
		self.assertTrue(loan_application.unique_proposal_number)
		self.assertTrue(loan_application.kfs_valid_till)

		# Amortisation schedule (Annex C) has one row per instalment.
		self.assertEqual(len(loan_application.kfs_schedule), loan_application.repayment_periods)

	def test_kfs_schedule_closes_principal(self):
		loan_application = frappe.get_doc("Loan Application", {"applicant": self.applicant})
		loan_application.build_kfs()

		# First row opens at the full sanctioned amount.
		self.assertEqual(loan_application.kfs_schedule[0].outstanding_principal, loan_application.loan_amount)

		# Sum of principal across instalments equals the loan amount, and the
		# final outstanding balance fully closes.
		total_principal = sum(row.principal_amount for row in loan_application.kfs_schedule)
		self.assertAlmostEqual(total_principal, loan_application.loan_amount, delta=1)

		last_row = loan_application.kfs_schedule[-1]
		closing_balance = last_row.outstanding_principal - last_row.principal_amount
		self.assertAlmostEqual(closing_balance, 0, delta=1)

	def test_kfs_apr_includes_charges(self):
		loan_application = frappe.get_doc("Loan Application", {"applicant": self.applicant})

		# A charge that is part of the APR raises the APR above the nominal rate.
		loan_application.append(
			"kfs_charges",
			{
				"charge_name": "Processing Fee",
				"payable_to": "Regulated Entity",
				"amount": 5000,
				"included_in_apr": 1,
			},
		)
		loan_application.build_kfs()

		self.assertEqual(
			loan_application.net_disbursed_amount,
			loan_application.loan_amount - 5000,
		)
		self.assertGreater(loan_application.annual_percentage_rate, loan_application.rate_of_interest)

	def test_kfs_requires_term_loan(self):
		loan_application = frappe.get_doc("Loan Application", {"applicant": self.applicant})
		loan_application.is_term_loan = 0
		self.assertRaises(frappe.ValidationError, loan_application.build_kfs)


class TestKFSCalculations(unittest.TestCase):
	"""Pure-function tests for the KFS helpers (no database needed)."""

	def test_add_working_days_skips_weekend(self):
		# Friday 2026-06-19 + 3 working days -> Wednesday 2026-06-24.
		friday = datetime.date(2026, 6, 19)
		self.assertEqual(add_working_days(friday, 3), datetime.date(2026, 6, 24))

	def test_add_one_working_day(self):
		# Friday + 1 working day -> Monday.
		friday = datetime.date(2026, 6, 19)
		self.assertEqual(add_working_days(friday, 1), datetime.date(2026, 6, 22))

	def test_xirr_matches_nominal_rate_without_charges(self):
		# 100000 loan at 12% p.a. over 12 monthly EPIs, no charges.
		loan, rate, n = 100000.0, 12.0, 12
		monthly = rate / 1200
		epi = loan * monthly * (1 + monthly) ** n / ((1 + monthly) ** n - 1)

		start = datetime.date(2026, 1, 1)
		cash_flows = [(start, -loan)]
		due = start
		for _i in range(n):
			month = due.month % 12 + 1
			year = due.year + (1 if due.month == 12 else 0)
			due = datetime.date(year, month, 1)
			cash_flows.append((due, epi))

		apr = xirr(cash_flows) * 100
		# Effective APR for a 12% flat reducing-balance loan is ~12.6%.
		self.assertGreater(apr, 12.0)
		self.assertLess(apr, 13.0)

	def test_xirr_returns_none_for_empty(self):
		self.assertIsNone(xirr([]))
