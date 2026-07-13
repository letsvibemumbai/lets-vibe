export type ScreenId = "beach" | "grass" | "forest";

/**
 * A single admin-uploaded photo or video for a screen/theme, stored in Firebase
 * Storage. `order` sorts the gallery (lowest first); the first image is the
 * "cover" used on cards across the site. `path` is the Storage object path,
 * kept so the blob can be deleted when the item is removed.
 */
export type ScreenMedia = {
  id: string;
  type: "image" | "video";
  url: string;
  path: string;
  order: number;
  caption?: string;
};

export type Screen = {
  id: ScreenId;
  name: string;
  theme: string;
  description: string;
  operatingStart: number;
  operatingEnd: number;
  basePrices: { "1h": number; "2h": number; "3h": number };
  /** Legacy single cover URL. Superseded by `media` (kept as a fallback). */
  imageUrl: string;
  /** Admin-uploaded images + videos for this theme (Firebase Storage). */
  media?: ScreenMedia[];
  blockedDates?: string[]; // YYYY-MM-DD when the screen is unavailable
};

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type BookingSource = "online" | "offline";
export type Duration = 1 | 2 | 3;
export type BookingPaymentMethod =
  | "razorpay"
  | "cash"
  | "upi"
  | "card"
  | "bank";

/** Whether the customer chose to pay the whole bill or just the 50% deposit. */
export type PaymentPlan = "full" | "deposit";

/** Where a payment was collected: through the online gateway or in person. */
export type PaymentChannel = "online" | "venue";

/** Which part of the bill a payment covers. */
export type PaymentKind = "deposit" | "balance" | "full";

/**
 * One entry in a booking's payment ledger. Every rupee received — the online
 * deposit/full capture and every cash/UPI collection at the door — is recorded
 * as its own `BookingPayment`. `Booking.amountPaid` is the cached sum of these,
 * and UPI vs cash balances are derived by summing entries per `method`.
 */
export type BookingPayment = {
  /** Unique id within the booking. */
  id: string;
  /** Rupees received (> 0). */
  amount: number;
  method: BookingPaymentMethod;
  channel: PaymentChannel;
  kind: PaymentKind;
  /** When the payment was received (epoch ms). */
  at: number;
  note?: string;
  /** Razorpay payment id when collected through the gateway. */
  razorpayPaymentId?: string;
};

/**
 * Selected add-on on a booking. `kind` distinguishes whether the user picked
 * an à la carte item or a package. `quantity` is 1 for packages and for
 * items without a per-item max.
 */
export type BookingAddonSelection = {
  kind: "item" | "package";
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  /** Snapshot: this selection is an experience package (e.g. "Celebration").
   * Absent ⇒ a plain Movie booking / à la carte selection. Snapshotted so old
   * bookings stay self-describing even if the catalog changes. */
  experience?: boolean;
};

export type Booking = {
  id: string;
  screenId: ScreenId;
  date: string;
  startTime: string;
  endTime: string;
  duration: Duration;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  /** Firebase Auth uid of the signed-in guest who made the booking, if any.
   * Links the booking to a user account (the /account dashboard). */
  customerUid?: string;
  /** Links the booking to a phone-keyed Customer record (CRM). Equals the
   * customer's phone number (the Customer doc id). */
  customerId?: string;
  guestCount: number;
  /**
   * Add-ons on a booking. `selections` is the canonical list of items and
   * packages picked from the dynamic catalogue. `decorations` is a free-form
   * note from the customer / admin.
   */
  addOns: {
    decorations?: string;
    selections?: BookingAddonSelection[];
  };
  amount: number;
  /** The food portion of `amount` (a reporting breakout — `amount` remains the
   * full billed total, so balance/payment math is unaffected). Room revenue =
   * `amount - foodBill - add-on selections`. Absent ⇒ 0. */
  foodBill?: number;
  /** Cached sum of `payments` (rupees received so far). `amount - amountPaid`
   * is the balance still due at the venue. */
  amountPaid: number;
  originalAmount?: number;
  discount?: number;
  /** Plan chosen at booking: pay in full or 50% deposit. Absent on legacy
   * bookings (treat as "full"). */
  paymentPlan?: PaymentPlan;
  /** Legacy: public URL of uploaded UPI payment screenshot. Newer bookings
   * store the storage path in `paymentScreenshotPath` and resolve a signed URL
   * server-side; this field is kept for back-compat with bookings created
   * before the upload became private. */
  paymentScreenshotUrl?: string;
  /** Firebase Storage path (e.g. `payment-proofs/abc.jpg`) of the uploaded
   * UPI payment screenshot. The blob is private — admins resolve a short-lived
   * signed URL via `signedReadUrl(path)` in admin server pages. */
  paymentScreenshotPath?: string;
  /** Status of payment verification (pending until admin approves) */
  paymentStatus?: "PENDING" | "CONFIRMED";
  /** The payment ledger — every payment received against this booking. Absent
   * on legacy bookings; `effectivePayments()` bridges those from `amountPaid`. */
  payments?: BookingPayment[];
  status: BookingStatus;
  source: BookingSource;
  /** The most recent tender used. Kept for back-compat / quick display; the
   * `payments` ledger is authoritative for per-method totals. */
  paymentMethod?: BookingPaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  refundedAt?: number;
  cancelledAt?: number;
  notes?: string;
  /** When the booking-confirmation email was sent (epoch ms). Set once on the
   * first successful send; guards against double-sending on edits/retries. */
  confirmationEmailSentAt?: number;
  /**
   * Venue entry / check-in state, set by an admin via the QR check-in flow.
   * Independent of `status` (which tracks the booking lifecycle). Undefined ⇒
   * "awaiting" (the guest hasn't been processed at the door yet).
   */
  checkInStatus?: CheckInStatus;
  /** When the guest was admitted (epoch ms). */
  checkedInAt?: number;
  /** When entry was rejected (epoch ms). */
  checkInRejectedAt?: number;
  /** Optional admin note recorded at admit/reject time. */
  checkInNote?: string;
  createdAt: number;
  updatedAt: number;
};

/** Venue entry decision for a booking's QR pass. */
export type CheckInStatus = "awaiting" | "admitted" | "rejected";

/**
 * À la carte add-on offered at booking time. Anything an admin can list as
 * an individual checkable line item — a cake, a balloon arch, a snack box.
 */
export type AddonItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  /** Image rendered on the customer-facing add-on tile. Optional. */
  imageUrl?: string;
  /** Max units per booking. 1 → checkbox; >1 → +/- stepper. */
  maxQuantity: number;
  /** Screens this item is offered on. Empty/absent ⇒ all screens.
   * (e.g. Rose petals → ["forest"] — jungle room only.) */
  screenIds?: ScreenId[];
  /** Inactive items don't show on the booking form but stay in Firestore. */
  active: boolean;
  /** Sort order on the customer form (lower = first). */
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
};

/**
 * Either a curated bundle of items (referenced via `itemIds`) sold at an
 * override price, or a standalone labeled bundle with no item refs.
 *
 * `kind: "bundle"`     → itemIds is the canonical list; price overrides the
 *                        sum of the items.
 * `kind: "standalone"` → itemIds is ignored; package stands on its own.
 */
export type AddonPackage = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  kind: "bundle" | "standalone";
  itemIds: string[];
  /** Experience package (e.g. "Celebration"): shown in the booking form's
   * "Choose your experience" selector as an alternative to the plain Movie
   * experience. Selecting it blocks à la carte items — they're included. */
  includesAddons?: boolean;
  /** Per-screen price override. Effective price for a booking is
   * `priceByScreen[screenId] ?? price` (e.g. Celebration costs more on forest). */
  priceByScreen?: Partial<Record<ScreenId, number>>;
  active: boolean;
  sortOrder: number;
  /** Highlight this package on the customer form. */
  featured?: boolean;
  createdAt: number;
  updatedAt: number;
};

/**
 * Membership programme configuration. Stored as a single Firestore doc at
 * `settings/membership` and fully editable from the admin panel — price,
 * discount percentage, and how many bookings the discount applies to are all
 * dynamic. Read publicly so the booking + account UI can show current terms.
 */
export type MembershipConfig = {
  /** One-time price to join, in rupees. */
  price: number;
  /** Flat percent off each discounted booking (e.g. 10 → 10%). */
  discountPercent: number;
  /** How many of a member's subsequent bookings get the discount. */
  discountedBookings: number;
  /** When false, the programme is hidden and no new members can join. */
  active: boolean;
  updatedAt: number;
};

export type MembershipStatus = "none" | "pending" | "active" | "expired";

/**
 * A user's membership record, keyed by Firebase Auth uid (`memberships/{uid}`).
 * Created as `pending` when the user opts in; an admin confirms it to `active`
 * (after collecting the fee), which seeds `remainingDiscountedBookings` from
 * the current MembershipConfig.discountedBookings. Each discounted booking
 * decrements the counter; at 0 the member pays full price again.
 */
export type Membership = {
  /** Firebase Auth uid (also the doc id). */
  uid: string;
  email: string;
  name?: string;
  status: MembershipStatus;
  /** Discounted bookings still available. 0 unless status === "active". */
  remainingDiscountedBookings: number;
  /** The discount % snapshotted when the membership was confirmed. */
  discountPercent: number;
  /** Price paid / to be collected, snapshotted at request time. */
  price: number;
  requestedAt: number;
  confirmedAt?: number;
  createdAt: number;
  updatedAt: number;
};

/**
 * A customer profile, keyed by phone number (the doc id). Created the first
 * time a phone number is seen on any booking, then linked + updated on every
 * subsequent booking — so repeat customers are tracked automatically.
 */
export type Customer = {
  /** Doc id — equals the normalized 10-digit phone. */
  id: string;
  phone: string;
  name: string;
  email?: string;
  /** Total bookings ever made under this phone. */
  totalBookings: number;
  firstBookingDate?: string;
  lastBookingDate?: string;
  lastSource?: BookingSource;
  createdAt: number;
  updatedAt: number;
};

/**
 * Manual UPI payment configuration. Stored as a single Firestore doc at
 * `settings/payment` and edited from the admin Payments page. Read publicly
 * (server-side) so the checkout page can render the "scan & pay" QR. We collect
 * UPI payments out-of-band (the customer scans the QR, pays in their UPI app,
 * and uploads a confirmation screenshot) — nothing here is ever computed; the
 * admin verifies the screenshot and confirms the booking by hand.
 */
export type PaymentSettings = {
  /** Public URL of the uploaded "scan & pay" QR image shown at checkout. */
  upiQrUrl?: string;
  /** UPI ID / VPA shown as copyable text and used to build a tap-to-pay link
   * (e.g. "letsvibe@okhdfcbank"). Optional — the QR image alone is enough. */
  upiId?: string;
  /** Payee name shown in the customer's UPI app via the tap-to-pay link. */
  payeeName?: string;
  /** Optional free-text instruction shown under the QR at checkout. */
  instructions?: string;
  updatedAt: number;
};

export type ExpenseCategory =
  | "utilities"
  | "staff"
  | "supplies"
  | "maintenance"
  | "marketing"
  | "other";

export type ExpensePaymentMethod = "cash" | "upi" | "card" | "bank";

export type Expense = {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  receiptUrl?: string;
  /** Set when this expense is auto-created from an Influencers-tab entry
   * (id `inf-exp-{influencerId}`), so it can be synced/removed with it. */
  influencerId?: string;
  createdAt: number;
};

/** How a shot influencer reel performed (owner-updated). */
export type InfluencerPerformance = "excellent" | "good" | "bad" | "pending";

/**
 * An influencer collaboration tracked in the admin panel. The `amount` paid is
 * also mirrored into a linked marketing `Expense` (`inf-exp-{id}`) so it flows
 * into accounting exactly once.
 */
export type Influencer = {
  id: string;
  name: string;
  /** Rupees paid to the influencer. */
  amount: number;
  /** Date of the shoot / collaboration (YYYY-MM-DD). */
  dateOfShoot: string;
  /** Instagram handle (with or without the leading @). */
  igHandle: string;
  reelLink?: string;
  paymentMethod: ExpensePaymentMethod;
  performance: InfluencerPerformance;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};
