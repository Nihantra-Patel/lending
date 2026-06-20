# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

"""Serve the native borrower app (Expo web build) at /borrow-portal.

The Expo app is exported with base path ``/borrow-portal`` so its client router
and asset URLs all resolve under that one prefix (mirroring how Raven mounts its
React SPA). The build is copied into ``lending/public/borrow_portal`` which
Frappe serves at ``/assets/lending/borrow_portal``.

Every ``/borrow-portal/<path>`` request lands on this page. An asset request
(``_expo/...``, ``assets/...``, ``favicon`` ...) is redirected to the real
``/assets/lending/borrow_portal/...`` URL Frappe already serves; anything else
renders the SPA shell so the client-side router handles deep links.
"""

import os
import re

import frappe

no_cache = 1

ASSET_BASE = "/assets/lending/borrow_portal"


def get_context(context):
	app_path = (frappe.form_dict.get("app_path") or "").strip("/")

	if app_path and _is_build_file(app_path):
		frappe.local.flags.redirect_location = f"{ASSET_BASE}/{app_path}"
		raise frappe.Redirect

	context.borrow_portal_bundle = _resolve_bundle_path()
	context.no_header = True
	context.no_breadcrumbs = True
	return context


def _is_build_file(app_path: str) -> bool:
	build_dir = frappe.get_app_path("lending", "public", "borrow_portal")
	candidate = os.path.normpath(os.path.join(build_dir, app_path))
	return candidate.startswith(build_dir + os.sep) and os.path.isfile(candidate)


def _resolve_bundle_path() -> str:
	index_path = frappe.get_app_path("lending", "public", "borrow_portal", "index.html")
	if not os.path.exists(index_path):
		frappe.throw(
			frappe._(
				"Borrow Portal build not found. Run `npx expo export --platform web` "
				"in apps/mobile and copy dist into lending/public/borrow_portal."
			)
		)

	with open(index_path, encoding="utf-8") as f:
		match = re.search(r'src="(/borrow-portal/_expo/[^"]+\.js)"', f.read())

	if not match:
		frappe.throw(frappe._("Could not locate the Borrow Portal JS bundle in the build."))

	# Redirect the bundle through the asset host so the browser fetches the real file.
	return match.group(1).replace("/borrow-portal/", f"{ASSET_BASE}/", 1)
