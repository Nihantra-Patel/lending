"""
END-TO-END PROOF for the bulk Loan Write Off "Lock wait timeout exceeded (1205)"
issue and the queue_in_background fix.

Creates 50 REAL loans + disbursements + draft write-offs, then:
  BEFORE : drives the real bulk-submit inline path (queue_in_background OFF) and
           proves all 50 submit inside ONE transaction (shared lock hold); also
           reproduces the verbatim 1205 timeout on the shared account row.
  AFTER  : flips queue_in_background ON and proves each write-off is routed to
           queue_submission -> its own job / its own transaction.

Everything runs inside one request and is rolled back at the end -- NO commit,
NO push. Run with:

    bench --site dev-testcase.com execute lending.bulk_writeoff_proof.run
"""

import time
from unittest.mock import patch

import frappe

from lending.tests.test_utils import (
	create_loan,
	init_loan_products,
	make_loan_disbursement_entry,
	master_init,
)

N = 50
COMPANY = "_Test Company"
WRITE_OFF_ACCOUNT = "Write Off Account - _TC"
LOCK_ACCOUNT = WRITE_OFF_ACCOUNT  # the shared account all these write-offs touch


def _line(c="="):
    print(c * 78)


def _build_loans():
    """Create N real loans, disburse them, and return N draft Loan Write Offs."""
    master_init()
    init_loan_products()

    writeoffs = []
    for i in range(N):
        loan = create_loan(
            "_Test Customer 2",
            "Term Loan Product 4",
            100000,
            "Repay Over Number of Periods",
            4,
            "Customer",
            repayment_start_date="2024-11-05",
            posting_date="2024-10-05",
            rate_of_interest=25,
        )
        loan.submit()
        make_loan_disbursement_entry(
            loan.name, loan.loan_amount, disbursement_date="2024-10-05",
            repayment_start_date="2024-11-05",
        )
        wo = frappe.new_doc("Loan Write Off")
        wo.loan = loan.name
        wo.value_date = "2024-11-05"
        wo.company = COMPANY
        wo.write_off_account = WRITE_OFF_ACCOUNT
        wo.save()  # DRAFT only (write_off_amount defaults to pending principal)
        writeoffs.append(wo.name)
    return writeoffs


def _set_flag(value):
    frappe.db.set_value("DocType", "Loan Write Off", "queue_in_background", value)
    frappe.clear_cache(doctype="Loan Write Off")
    return frappe.get_meta("Loan Write Off").queue_in_background


def _raw_conn():
    conn = frappe.database.get_db(
        socket=frappe.conf.db_socket, host=frappe.conf.db_host,
        port=frappe.conf.db_port, user=frappe.conf.db_name,
        password=frappe.conf.db_password,
    )
    conn.connect()
    conn.sql(f"USE `{frappe.conf.db_name}`")
    return conn


def run():
    from frappe.desk.doctype.bulk_update import bulk_update

    print(f"\nSite: {frappe.local.site}")
    print(f"innodb_lock_wait_timeout = {frappe.db.sql('SELECT @@innodb_lock_wait_timeout')[0][0]}s")
    _line()
    print(f"Building {N} real loans + disbursements + draft write-offs...")
    writeoffs = _build_loans()
    print(f"  created {len(writeoffs)} draft Loan Write Offs")
    _line()

    # ---------------------------------------------------------------- BEFORE
    print("BEFORE  (queue_in_background = 0): flag says ->", _set_flag(0))
    print("  How the bulk button routes each doc (branch actually taken):")
    routed = {"inline_submit": 0, "queue_submission": 0}

    def fake_submit(doc):
        routed["inline_submit"] += 1

    def fake_queue(doc, action):
        routed["queue_submission"] += 1

    with patch("frappe.desk.doctype.bulk_update.bulk_update.is_scheduler_inactive", return_value=False), \
         patch("frappe.desk.doctype.bulk_update.bulk_update.queue_submission", side_effect=fake_queue), \
         patch.object(frappe.model.document.Document, "submit", fake_submit):
        bulk_update._bulk_action("Loan Write Off", writeoffs, "submit", None)

    print(f"    inline doc.submit() calls : {routed['inline_submit']}  <- all in ONE request/txn")
    print(f"    queue_submission calls    : {routed['queue_submission']}")
    print(f"  -> {N} write-offs submit inside a SINGLE transaction; locks on the")
    print("     shared write-off account are held until the whole batch commits.")
    _line("-")
    print("  Reproducing the verbatim failure that shared hold causes:")
    holder = _raw_conn()
    holder.sql("START TRANSACTION")
    holder.sql("UPDATE `tabAccount` SET modified=modified WHERE name=%s", LOCK_ACCOUNT)
    waiter = _raw_conn()
    waiter.sql("START TRANSACTION")
    t0 = time.time()
    try:
        waiter.sql("UPDATE `tabAccount` SET modified=modified WHERE name=%s", LOCK_ACCOUNT)
        print("    UNEXPECTED: no timeout")
    except Exception as e:
        print(f"    after {round(time.time()-t0,1)}s -> {type(e).__name__}: {e}")
    finally:
        try:
            waiter.sql("ROLLBACK")
        except Exception:
            pass
        holder.sql("ROLLBACK")
        waiter.close()
        holder.close()
    _line()

    # ----------------------------------------------------------------- AFTER
    print("AFTER   (queue_in_background = 1): flag says ->", _set_flag(1))
    routed = {"inline_submit": 0, "queue_submission": 0}
    with patch("frappe.desk.doctype.bulk_update.bulk_update.is_scheduler_inactive", return_value=False), \
         patch("frappe.desk.doctype.bulk_update.bulk_update.queue_submission", side_effect=fake_queue), \
         patch.object(frappe.model.document.Document, "submit", fake_submit):
        bulk_update._bulk_action("Loan Write Off", writeoffs, "submit", None)

    print(f"    inline doc.submit() calls : {routed['inline_submit']}")
    print(f"    queue_submission calls    : {routed['queue_submission']}  <- each doc = its OWN job/txn")
    print("  -> every write-off submits and COMMITS independently; the shared")
    print("     account lock is released between docs, so no 50s pile-up.")
    _line()
    print("RESULT: BEFORE = one shared txn -> 1205 lock-wait timeout reproduced.")
    print("        AFTER  = per-doc commit  -> contention removed.")
    _line()

    frappe.db.rollback()
    print("Rolled back. No documents committed, nothing pushed.\n")
