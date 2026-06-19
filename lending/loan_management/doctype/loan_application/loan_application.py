# Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt


import json
import math

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.model.mapper import get_mapped_doc
from frappe.query_builder import Criterion
from frappe.utils import add_days, add_to_date, cint, flt, getdate, rounded

from lending.loan_management.doctype.loan.loan import (
	get_sanctioned_amount_limit,
	get_total_loan_amount,
)
from lending.loan_management.doctype.loan_repayment_schedule.loan_repayment_schedule import (
	get_monthly_repayment_amount,
)
from lending.loan_management.doctype.loan_security_price.loan_security_price import (
	get_loan_security_price,
)


class LoanApplication(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		from lending.loan_management.doctype.proposed_pledge.proposed_pledge import ProposedPledge
		from lending.loan_origination.doctype.loan_application_charge.loan_application_charge import (
			LoanApplicationCharge,
		)
		from lending.loan_origination.doctype.loan_application_document.loan_application_document import (
			LoanApplicationDocument,
		)
		from lending.loan_origination.doctype.loan_application_kfs_schedule.loan_application_kfs_schedule import (
			LoanApplicationKFSSchedule,
		)
		from lending.loan_origination.doctype.loan_co_applicants.loan_co_applicants import (
			LoanCoApplicants,
		)

		address_line_1: DF.Data | None
		address_line_2: DF.Data | None
		amended_from: DF.Link | None
		annual_percentage_rate: DF.Percent
		applicant: DF.DynamicLink | None
		applicant_email_address: DF.Data | None
		applicant_name: DF.Data | None
		applicant_phone_number: DF.Phone | None
		applicant_type: DF.Literal["Employee", "Customer"]
		borrower_acknowledged: DF.Check
		city: DF.Data | None
		co_applicants: DF.Table[LoanCoApplicants]
		company: DF.Link
		country: DF.Link | None
		documents: DF.Table[LoanApplicationDocument]
		grievance_redressal_clause: DF.SmallText | None
		interest_rate_benchmark: DF.Data | None
		interest_rate_type: DF.Literal["Fixed", "Floating", "Hybrid"]
		is_secured_loan: DF.Check
		is_term_loan: DF.Check
		kfs_charges: DF.Table[LoanApplicationCharge]
		kfs_generated: DF.Check
		kfs_schedule: DF.Table[LoanApplicationKFSSchedule]
		kfs_valid_till: DF.Date | None
		loan_amount: DF.Currency
		loan_product: DF.Link
		loan_purpose: DF.Link | None
		loan_type: DF.Data | None
		maximum_loan_amount: DF.Currency
		net_disbursed_amount: DF.Currency
		nodal_officer_email: DF.Data | None
		nodal_officer_phone: DF.Data | None
		posting_date: DF.Date
		proposed_pledges: DF.Table[ProposedPledge]
		rate_of_interest: DF.Percent
		recovery_agent_clause: DF.SmallText | None
		repayment_amount: DF.Currency
		repayment_method: DF.Literal["", "Repay Fixed Amount per Period", "Repay Over Number of Periods"]
		repayment_periods: DF.Int
		reset_periodicity: DF.Data | None
		spread_over_benchmark: DF.Percent
		state: DF.Data | None
		status: DF.Literal["Open", "Approved", "Rejected"]
		total_payable_amount: DF.Currency
		total_payable_interest: DF.Currency
		unique_proposal_number: DF.Data | None
		zip_code: DF.Int
	# end: auto-generated types

	def validate(self):
		self.set_pledge_amount()
		self.set_loan_amount()
		self.validate_loan_amount()

		if self.is_term_loan:
			self.validate_repayment_method()

		self.validate_loan_product()
		self.validate_employee()

		self.get_repayment_details()
		self.check_sanctioned_amount_limit()

	def before_save(self):
		# Keep an already generated KFS in sync with the latest loan terms.
		if self.kfs_generated:
			self.build_kfs()

		if self.applicant_type == "Customer":
			if not self.applicant:
				customer = frappe.new_doc("Customer")
				customer.customer_name = self.applicant_name
				customer.type = "Company"
				customer.mobile_number = self.applicant_phone_number
				customer.email_address = self.applicant_email_address
				# need to save customer first to link back from contact and address
				customer.save()

				# copying over contact details into the contact doctype
				contact = frappe.new_doc("Contact")
				contact.first_name = self.applicant_name
				contact.append("email_ids", {"email_id": self.applicant_email_address, "is_primary": True})
				contact.append(
					"phone_nos", {"phone": self.applicant_phone_number, "is_primary_mobile_no": True}
				)

				# link back to customer
				contact.append("links", {"link_doctype": "Customer", "link_name": customer.name})
				contact.save()

				address = frappe.new_doc("Address")
				address.address_type = "Billing"

				# two different naming conventions = chaos
				if any(
					[self.address_line_1, self.address_line_2, self.city, self.state, self.zip_code]
				):  # address should be optional
					address.address_line1 = self.address_line_1
					address.address_line2 = self.address_line_2
					address.city = self.city
					address.state = self.state
					address.country = self.country
					address.pincode = self.zip_code
					address.append("links", {"link_doctype": "Customer", "link_name": customer.name})

					address.save()

					customer.customer_primary_address = address.name

				customer.customer_primary_contact = contact.name

				customer.save()

				self.applicant = customer.name

	def validate_repayment_method(self):
		if self.repayment_method == "Repay Over Number of Periods" and not self.repayment_periods:
			frappe.throw(_("Please enter Repayment Periods"))

		if self.repayment_method == "Repay Fixed Amount per Period":
			if not self.repayment_amount:
				frappe.throw(_("Please enter repayment Amount"))
			if self.repayment_amount > self.loan_amount:
				frappe.throw(_("Monthly Repayment Amount cannot be greater than Loan Amount"))

	def validate_loan_product(self):
		company = frappe.get_value("Loan Product", self.loan_product, "company")
		if company != self.company:
			frappe.throw(_("Please select Loan Product for company {0}").format(frappe.bold(self.company)))

	def validate_employee(self):
		if self.applicant_type == "Employee":
			employee_company = frappe.get_value("Employee", self.applicant, "company")
			if employee_company != self.company:
				frappe.throw(
					_("Selected employee belongs to {0}. Please select an employee from company {1}.").format(
						frappe.bold(employee_company), frappe.bold(self.company)
					)
				)

	def validate_loan_amount(self):
		if not self.loan_amount:
			frappe.throw(_("Loan Amount is mandatory"))

		maximum_loan_limit = frappe.db.get_value(
			"Loan Product", self.loan_product, "maximum_loan_amount"
		)
		if maximum_loan_limit and self.loan_amount > maximum_loan_limit:
			frappe.throw(
				_("Loan Amount cannot exceed Maximum Loan Amount of {0}").format(maximum_loan_limit)
			)

		if self.maximum_loan_amount and self.loan_amount > self.maximum_loan_amount:
			frappe.throw(
				_("Loan Amount exceeds maximum loan amount of {0} as per proposed securities").format(
					self.maximum_loan_amount
				)
			)

	def check_sanctioned_amount_limit(self):
		sanctioned_amount_limit = get_sanctioned_amount_limit(
			self.applicant_type, self.applicant, self.company
		)

		if sanctioned_amount_limit:
			total_loan_amount = get_total_loan_amount(self.applicant_type, self.applicant, self.company)

		if sanctioned_amount_limit and flt(self.loan_amount) + flt(total_loan_amount) > flt(
			sanctioned_amount_limit
		):
			frappe.throw(
				_("Sanctioned Amount limit crossed for {0} {1}").format(
					self.applicant_type, frappe.bold(self.applicant)
				)
			)

	def set_pledge_amount(self):
		for proposed_pledge in self.proposed_pledges:

			if not proposed_pledge.qty:
				frappe.throw(_("Qty is mandatory for loan security!"))

			if not proposed_pledge.loan_security_price:
				loan_security_price = get_loan_security_price(proposed_pledge.loan_security)

				if loan_security_price:
					proposed_pledge.loan_security_price = loan_security_price
				else:
					frappe.throw(
						_("No valid Loan Security Price found for {0}").format(
							frappe.bold(proposed_pledge.loan_security)
						)
					)

			proposed_pledge.amount = proposed_pledge.qty * proposed_pledge.loan_security_price
			proposed_pledge.post_haircut_amount = cint(
				proposed_pledge.amount - (proposed_pledge.amount * proposed_pledge.haircut / 100)
			)

	def get_repayment_details(self):
		if self.is_term_loan:
			if self.repayment_method == "Repay Over Number of Periods":
				self.repayment_amount = get_monthly_repayment_amount(
					self.loan_amount, self.rate_of_interest, self.repayment_periods, "Monthly"
				)

			if self.repayment_method == "Repay Fixed Amount per Period":
				monthly_interest_rate = flt(self.rate_of_interest) / (12 * 100)
				if monthly_interest_rate:
					min_repayment_amount = self.loan_amount * monthly_interest_rate
					if self.repayment_amount - min_repayment_amount <= 0:
						frappe.throw(_("Repayment Amount must be greater than " + str(flt(min_repayment_amount, 2))))
					self.repayment_periods = math.ceil(
						(math.log(self.repayment_amount) - math.log(self.repayment_amount - min_repayment_amount))
						/ (math.log(1 + monthly_interest_rate))
					)
				else:
					self.repayment_periods = self.loan_amount / self.repayment_amount

			self.calculate_payable_amount()
		else:
			self.total_payable_amount = self.loan_amount

	def calculate_payable_amount(self):
		balance_amount = self.loan_amount
		self.total_payable_amount = 0
		self.total_payable_interest = 0

		while balance_amount > 0:
			interest_amount = rounded(balance_amount * flt(self.rate_of_interest) / (12 * 100))
			balance_amount = rounded(balance_amount + interest_amount - self.repayment_amount)

			self.total_payable_interest += interest_amount

		self.total_payable_amount = self.loan_amount + self.total_payable_interest

	def set_loan_amount(self):
		if self.is_secured_loan and not self.proposed_pledges:
			frappe.throw(_("Proposed Pledges are mandatory for secured Loans"))

		if self.is_secured_loan and self.proposed_pledges:
			self.maximum_loan_amount = 0
			for security in self.proposed_pledges:
				self.maximum_loan_amount += flt(security.post_haircut_amount)

		if not self.loan_amount and self.is_secured_loan and self.proposed_pledges:
			self.loan_amount = self.maximum_loan_amount

	# ---------------------------------------------------------------------------
	# Key Facts Statement (KFS) - RBI circular RBI/2024-25/18 dated 15 Apr 2024
	# ---------------------------------------------------------------------------

	def build_kfs(self):
		"""Populate all Key Facts Statement values from the current loan terms.

		Additive only: this reads the existing loan application fields and fills
		the KFS fields/child tables. It does not change any existing loan,
		disbursement, schedule or repayment logic.
		"""
		if not self.is_term_loan:
			frappe.throw(_("Key Facts Statement can be generated only for term loans."))

		if not (self.loan_amount and self.rate_of_interest and self.repayment_periods):
			frappe.throw(
				_("Loan Amount, Rate of Interest and Repayment Periods are required to generate the KFS.")
			)

		self.get_repayment_details()

		if not self.unique_proposal_number:
			self.unique_proposal_number = self.name or frappe.generate_hash(length=10).upper()

		if not self.loan_type:
			self.loan_type = frappe.db.get_value("Loan Product", self.loan_product, "product_name")

		self.set_kfs_validity()
		self.set_kfs_charges()
		self.build_kfs_schedule()
		self.calculate_apr()
		self.kfs_generated = 1

	def set_kfs_validity(self):
		"""RBI: at least 3 working days (1 working day if tenor < 7 days)."""
		tenor_days = flt(self.repayment_periods) * 30
		working_days = 3 if tenor_days >= 7 else 1
		self.kfs_valid_till = add_working_days(getdate(self.posting_date), working_days)

	def set_kfs_charges(self):
		"""Pull charges from the loan product if the KFS charge table is empty."""
		if self.kfs_charges:
			return

		product_charges = frappe.get_all(
			"Loan Charges",
			filters={"parent": self.loan_product},
			fields=["charge_type", "amount"],
		)
		for charge in product_charges:
			self.append(
				"kfs_charges",
				{
					"charge_name": charge.charge_type,
					"payable_to": "Regulated Entity",
					"amount": flt(charge.amount),
					"included_in_apr": 1,
				},
			)

	def get_total_kfs_charges(self, only_apr=False):
		total = 0
		for charge in self.kfs_charges:
			if only_apr and not charge.included_in_apr:
				continue
			total += flt(charge.amount)
		return total

	def build_kfs_schedule(self):
		"""Build the amortisation schedule (Annex C) using a flat reducing-balance EPI."""
		self.set("kfs_schedule", [])

		balance = flt(self.loan_amount)
		epi = flt(self.repayment_amount)
		monthly_rate = flt(self.rate_of_interest) / (12 * 100)
		payment_date = getdate(self.posting_date)

		for instalment_no in range(1, cint(self.repayment_periods) + 1):
			interest_amount = rounded(balance * monthly_rate)
			principal_amount = rounded(epi - interest_amount)

			# Adjust the final instalment so the balance closes exactly.
			if instalment_no == cint(self.repayment_periods) or principal_amount > balance:
				principal_amount = balance
				epi_amount = rounded(principal_amount + interest_amount)
			else:
				epi_amount = epi

			opening_balance = balance
			balance = rounded(balance - principal_amount)

			payment_date = add_to_date(payment_date, months=1)

			self.append(
				"kfs_schedule",
				{
					"instalment_no": instalment_no,
					"payment_date": payment_date,
					"outstanding_principal": opening_balance,
					"principal_amount": principal_amount,
					"interest_amount": interest_amount,
					"instalment_amount": epi_amount,
				},
			)

			if balance <= 0:
				break

	def calculate_apr(self):
		"""Compute the all-inclusive APR (Annex B) via XIRR over the loan cash flows.

		Cash flows: net disbursed amount (outflow for the lender / inflow for the
		borrower) at disbursement, followed by each EPI. APR-eligible charges are
		deducted from the disbursed amount, increasing the effective cost of credit.
		"""
		apr_charges = self.get_total_kfs_charges(only_apr=True)
		self.net_disbursed_amount = flt(self.loan_amount) - apr_charges

		if not self.net_disbursed_amount or not self.kfs_schedule:
			self.annual_percentage_rate = self.rate_of_interest
			return

		cash_flows = [(getdate(self.posting_date), -flt(self.net_disbursed_amount))]
		for row in self.kfs_schedule:
			cash_flows.append((getdate(row.payment_date), flt(row.instalment_amount)))

		apr = xirr(cash_flows)
		self.annual_percentage_rate = rounded(apr * 100, 2) if apr is not None else self.rate_of_interest


def add_working_days(start_date, working_days):
	"""Add the given number of working days (Mon-Fri) to a date."""
	current = getdate(start_date)
	added = 0
	while added < working_days:
		current = add_days(current, 1)
		if current.weekday() < 5:  # 0-4 => Mon-Fri
			added += 1
	return current


def xirr(cash_flows, guess=0.1):
	"""Compute the annualised internal rate of return for dated cash flows.

	Uses Newton-Raphson with a bisection fallback. Returns a decimal rate
	(e.g. 0.12 for 12%) or None if it does not converge.
	"""
	if not cash_flows:
		return None

	base_date = cash_flows[0][0]

	def npv(rate):
		total = 0.0
		for date, amount in cash_flows:
			years = (getdate(date) - base_date).days / 365.0
			total += amount / ((1 + rate) ** years)
		return total

	rate = guess
	for _i in range(100):
		value = npv(rate)
		# Numerical derivative.
		delta = 1e-6
		derivative = (npv(rate + delta) - value) / delta
		if not derivative:
			break
		new_rate = rate - value / derivative
		if abs(new_rate - rate) < 1e-8:
			return new_rate
		rate = new_rate

	# Bisection fallback over a sensible rate range.
	low, high = -0.9999, 10.0
	f_low = npv(low)
	for _i in range(200):
		mid = (low + high) / 2
		f_mid = npv(mid)
		if abs(f_mid) < 1e-6:
			return mid
		if (f_low < 0) != (f_mid < 0):
			high = mid
		else:
			low, f_low = mid, f_mid
	return None


@frappe.whitelist()
def generate_kfs(loan_application: str):
	"""Generate and save the KFS for a Loan Application (callable from the form button)."""
	doc = frappe.get_doc("Loan Application", loan_application)
	doc.check_permission("write")
	doc.build_kfs()
	doc.save()
	return doc.name


@frappe.whitelist()
def create_loan(source_name: str, target_doc: str | None = None, submit: int = 0):
	frappe.has_permission("Loan", "create", throw=True)

	def update_accounts(source_doc, target_doc, source_parent):
		account_details = frappe.get_all(
			"Loan Product",
			fields=[
				"payment_account",
				"loan_account",
				"interest_income_account",
				"penalty_income_account",
			],
			filters={"name": source_doc.loan_product},
		)[0]

		if source_doc.is_secured_loan:
			target_doc.maximum_loan_amount = 0

		target_doc.payment_account = account_details.payment_account
		target_doc.loan_account = account_details.loan_account
		target_doc.interest_income_account = account_details.interest_income_account
		target_doc.penalty_income_account = account_details.penalty_income_account
		target_doc.loan_application = source_name

	doclist = get_mapped_doc(
		"Loan Application",
		source_name,
		{
			"Loan Application": {
				"doctype": "Loan",
				"validation": {"docstatus": ["=", 1]},
				"postprocess": update_accounts,
			}
		},
		target_doc,
	)

	if submit:
		doclist.submit()

	return doclist


@frappe.whitelist()
def create_loan_security_assignment(loan_application: str | None = None, loan: str | None = None, securities: list | None = None, applicant_type: str | None = None, applicant: str | None = None, company: str | None = None):
	frappe.has_permission("Loan Security Assignment", "create", throw=True)

	if loan_application:
		loan_application_doc = frappe.get_doc("Loan Application", loan_application)
		applicant_type, applicant, company = frappe.db.get_value("Loan Application", loan_application,
			["applicant_type", "applicant", "company"])
		securities = loan_application_doc.get("proposed_pledges")
	elif loan:
		applicant_type, applicant, company = frappe.db.get_value("Loan", loan,
			["applicant_type", "applicant", "company"])
	elif not applicant:
		frappe.throw(_("Either Loan Application, Loan or Applicant details are required to create Loan Security Assignment"))


	lsa = frappe.new_doc("Loan Security Assignment")
	lsa.applicant_type = applicant_type
	lsa.applicant = applicant
	lsa.company = company
	lsa.loan_application = loan_application
	lsa.loan = loan

	for pledge in securities:
		lsa.append(
			"securities",
			{
				"loan_security": pledge.get("loan_security"),
				"qty": pledge.get("qty"),
				"loan_security_price": pledge.get("loan_security_price"),
				"haircut": pledge.get("haircut"),
			},
		)

	lsa.save()
	lsa.submit()

	message = _("Loan Security Assignment Created : {0}").format(lsa.name)
	frappe.msgprint(message)

	return lsa.name


# This is a sandbox method to get the proposed pledges
@frappe.whitelist()
def get_proposed_pledge(securities: str | list):
	if isinstance(securities, str):
		securities = json.loads(securities)

	proposed_pledges = {"securities": []}
	maximum_loan_amount = 0

	for security in securities:
		security = frappe._dict(security)
		if not security.qty and not security.amount:
			frappe.throw(_("Qty or Amount is mandatroy for loan security"))

		security.loan_security_price = get_loan_security_price(security.loan_security)

		if not security.qty:
			security.qty = cint(security.amount / security.loan_security_price)

		security.amount = security.qty * security.loan_security_price
		security.post_haircut_amount = cint(security.amount - (security.amount * security.haircut / 100))

		maximum_loan_amount += security.post_haircut_amount

		proposed_pledges["securities"].append(security)

	proposed_pledges["maximum_loan_amount"] = maximum_loan_amount

	return proposed_pledges


@frappe.whitelist()
def check_duplicate_customers(
	applicant_phone_number: str | None = None, applicant_email_address: str | None = None
):
	# check if there are customer entries with the same email and/or phone
	customer_doc = frappe.qb.DocType("Customer")

	# matching any one condition will suffice
	conditions = []

	if applicant_phone_number:
		conditions.append((applicant_phone_number == customer_doc.mobile_no))

	if applicant_email_address:
		conditions.append(applicant_email_address == customer_doc.email_id)

	if conditions:
		query = frappe.qb.from_(customer_doc).where(Criterion.any(conditions)).select(customer_doc.name)
		duplicates = [i[0] for i in query.run(as_list=True)]
		return duplicates
	return []
