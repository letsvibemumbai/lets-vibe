export type ScreenId = "beach" | "grass" | "forest";

export type Screen = {
  id: ScreenId;
  name: string;
  theme: string;
  description: string;
  operatingStart: number;
  operatingEnd: number;
  basePrices: { "1h": number; "2h": number; "3h": number };
  imageUrl: string;
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
  amountPaid: number;
  originalAmount?: number;
  discount?: number;
  status: BookingStatus;
  source: BookingSource;
  paymentMethod?: BookingPaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayRefundId?: string;
  refundedAt?: number;
  cancelledAt?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

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
  createdAt: number;
};
