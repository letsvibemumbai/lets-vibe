import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { customerDocRef, getCustomerByPhone } from "@/lib/db/customers.server";
import {
  parseWorkbook,
  type ImportedBooking,
} from "@/lib/import/parseWorkbook";

export const runtime = "nodejs";

// Firestore getAll caps ~ documents per call; batched writes cap at 500.
const GETALL_CHUNK = 300;
const BATCH_LIMIT = 450;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Drop any repeat doc ids, keeping the first. Firestore rejects a WriteBatch
 * that writes the same document twice, so a duplicated Sr No (bookings) or two
 * truly-identical ledger rows would otherwise abort the entire import. We keep
 * the first occurrence and surface the rest as warnings rather than crashing.
 */
function dedupeById<T extends { id: string }>(
  items: T[],
  kind: string,
  warnings: string[],
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    if (seen.has(it.id)) {
      warnings.push(
        `${kind} "${it.id}": duplicate id in this upload — only the first row was imported.`,
      );
      continue;
    }
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

/** Doc ids (from the given refs) that already exist in Firestore. */
async function existingIds(
  refs: FirebaseFirestore.DocumentReference[],
): Promise<Set<string>> {
  const present = new Set<string>();
  for (const group of chunk(refs, GETALL_CHUNK)) {
    if (group.length === 0) continue;
    const snaps = await adminDb.getAll(...group);
    for (const snap of snaps) if (snap.exists) present.add(snap.id);
  }
  return present;
}

export async function POST(req: NextRequest) {
  // Keep requireAdmin() OUTSIDE the try so its redirect() control-flow throw
  // propagates to Next (a real redirect) instead of being mapped to a 500 body.
  await requireAdmin();
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const parsed = await parseWorkbook(buf);
    const warnings = [...parsed.warnings];

    const bookingsCol = adminDb.collection("bookings");
    const expensesCol = adminDb.collection("expenses");

    // --- Bookings: add-new-only ---
    const bookingRefs = parsed.bookings.map((b) => bookingsCol.doc(b.id));
    const existingBookingIds = await existingIds(bookingRefs);
    const newBookings = parsed.bookings.filter(
      (b) => !existingBookingIds.has(b.id),
    );

    // --- Expenses: add-new-only ---
    const expenseRefs = parsed.expenses.map((e) => expensesCol.doc(e.id));
    const existingExpenseIds = await existingIds(expenseRefs);
    const newExpenses = parsed.expenses.filter(
      (e) => !existingExpenseIds.has(e.id),
    );

    // Never write the same doc id twice in one batch (Firestore aborts the
    // whole commit otherwise). Keep the first, warn on any repeat.
    const addBookings = dedupeById(newBookings, "Booking", warnings);
    const addExpenses = dedupeById(newExpenses, "Expense", warnings);

    // --- Commit in batches (preserve historical numeric createdAt/updatedAt) ---
    let batch = adminDb.batch();
    let writes = 0;
    const flush = async () => {
      if (writes > 0) {
        await batch.commit();
        batch = adminDb.batch();
        writes = 0;
      }
    };

    for (const b of addBookings) {
      batch.set(bookingsCol.doc(b.id), b);
      if (++writes >= BATCH_LIMIT) await flush();
    }
    for (const e of addExpenses) {
      batch.set(expensesCol.doc(e.id), e);
      if (++writes >= BATCH_LIMIT) await flush();
    }
    await flush();

    // --- Upsert customers for newly-added bookings (non-transactional) ---
    await upsertCustomers(addBookings, warnings);

    return NextResponse.json({
      bookingsAdded: addBookings.length,
      bookingsSkipped: parsed.bookings.length - addBookings.length,
      expensesAdded: addExpenses.length,
      expensesSkipped: parsed.expenses.length - addExpenses.length,
      warnings,
      totals: parsed.totals,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PhoneGroup = {
  phone: string;
  name: string;
  count: number;
  minDate: string;
  maxDate: string;
};

/** Group newly-added bookings by phone and create-or-increment their Customer. */
async function upsertCustomers(
  newBookings: ImportedBooking[],
  warnings: string[],
): Promise<void> {
  const groups = new Map<string, PhoneGroup>();
  for (const b of newBookings) {
    const phone = b.customerPhone;
    if (!phone || phone.length !== 10) continue; // only index valid phone keys
    const g = groups.get(phone);
    if (!g) {
      groups.set(phone, {
        phone,
        name: b.customerName,
        count: 1,
        minDate: b.date,
        maxDate: b.date,
      });
    } else {
      g.count += 1;
      if (b.date < g.minDate) g.minDate = b.date;
      if (b.date > g.maxDate) g.maxDate = b.date;
      if (!g.name && b.customerName) g.name = b.customerName;
    }
  }

  for (const g of groups.values()) {
    try {
      const existing = await getCustomerByPhone(g.phone);
      const ref = customerDocRef(g.phone);
      if (!existing) {
        await ref.set({
          phone: g.phone,
          name: g.name,
          email: null,
          totalBookings: g.count,
          firstBookingDate: g.minDate,
          lastBookingDate: g.maxDate,
          lastSource: "offline",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await ref.set(
          {
            totalBookings: FieldValue.increment(g.count),
            lastBookingDate: g.maxDate,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      warnings.push(`Customer ${g.phone}: upsert failed (${message}).`);
    }
  }
}
