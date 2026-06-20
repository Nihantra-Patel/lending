# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class LoanOnboardingJourney(Document):
	def as_schema(self) -> dict:
		"""Return this journey as a section/field schema for the mobile app."""
		sections: dict[str, list] = {}
		order: list[str] = []
		for f in self.fields:
			section = f.section or "Details"
			if section not in sections:
				sections[section] = []
				order.append(section)
			sections[section].append(
				{
					"label": f.label,
					"fieldname": f.fieldname,
					"fieldtype": f.fieldtype,
					"reqd": bool(f.reqd),
					"options": [o.strip() for o in (f.options or "").splitlines() if o.strip()],
					"placeholder": f.placeholder,
					"help_text": f.help_text,
				}
			)

		return {
			"journey_type": self.journey_type,
			"title": self.title or self.journey_type,
			"description": self.description,
			"sections": [{"title": s, "fields": sections[s]} for s in order],
		}
