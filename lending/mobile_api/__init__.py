# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Mobile API layer for the native borrower app.

This package exposes a small, stable, mobile-friendly REST surface on top of the
core lending backend. The native app (see ``apps/mobile``) talks to these
endpoints over HTTPS using token authentication. All heavy lifting (interest
math, accounting, NPA, compliance) stays in the core lending DocTypes; this
layer only shapes data for the phone and enforces that a borrower only ever
sees their own records.
"""
