/**
 * Materials store - domain types.
 *
 * Every delivery that reaches site is recorded as a goods received note
 * (GRN). Each accepted line of a GRN becomes a batch of that material. Issues
 * to the work face draw from batches oldest first (FIFO), so two cement
 * deliveries on different days stay two batches until each is used up.
 */

/** What a unit measures. Units are grouped by this in pickers. */
export type MeasureKind = 'count' | 'weight' | 'volume' | 'length' | 'area';

export type UnitId =
  // Count
  | 'nos'
  | 'bag'
  | 'box'
  | 'roll'
  | 'sheet'
  | 'length'
  | 'bundle'
  | 'pail'
  // Weight
  | 'kg'
  | 't'
  // Volume
  | 'cube'
  | 'm3'
  | 'l'
  // Length
  | 'm'
  | 'ft'
  // Area
  | 'm2'
  | 'sqft';

export type MaterialUnit = {
  id: UnitId;
  /** Shown after a quantity of exactly one, e.g. "1 bag". */
  label: string;
  /** Shown after any other quantity, e.g. "40 bags". */
  plural: string;
  measure: MeasureKind;
  /** Decimal places a quantity may have; 0 means whole numbers only. */
  decimals: number;
  /** Extra context in pickers, e.g. "100 cubic feet". */
  hint?: string;
};

export type MaterialCategoryId =
  | 'cement'
  | 'aggregates'
  | 'steel'
  | 'masonry'
  | 'timber'
  | 'plumbing'
  | 'electrical'
  | 'finishes'
  | 'chemicals'
  | 'hardware';

/** A material the site stocks, independent of any delivery. */
export type Material = {
  id: string;
  name: string;
  /** Grade, size or pack, e.g. "OPC 42.5N · 50 kg bag". */
  spec: string;
  category: MaterialCategoryId;
  /** Stock of this material is always counted in this unit. */
  unit: UnitId;
  /** Reorder once stock on hand falls to this level. */
  reorderLevel: number;
  /** Where it's normally kept on site. */
  defaultLocation: string;
  /** Typical days a delivery stays usable, used to suggest a use-by date. */
  shelfLifeDays?: number;
};

/** Stock from one delivery line, issued oldest first. */
export type Batch = {
  id: string;
  materialId: string;
  receiptId: string;
  grnNo: number;
  /** ISO date (yyyy-mm-dd). */
  receivedOn: string;
  supplier: string;
  /** Accepted quantity - delivered minus rejected. */
  quantityReceived: number;
  quantityRemaining: number;
  /** Price per unit in rupees; 0 when not known yet. */
  unitCost: number;
  location: string;
  /** ISO date after which the batch shouldn't be used. */
  useBy?: string;
  /** Recording order, breaks FIFO ties between same-day deliveries. */
  sequence: number;
};

export type ReceiptLine = {
  materialId: string;
  batchId: string;
  quantityDelivered: number;
  /** Damaged or out-of-spec quantity sent back with the vehicle. */
  quantityRejected: number;
  unitCost: number;
  location: string;
  useBy?: string;
  remarks?: string;
};

/** A goods received note - one delivery, one or more materials. */
export type GoodsReceipt = {
  id: string;
  grnNo: number;
  receivedOn: string;
  supplier: string;
  /** Supplier's delivery note or invoice number. */
  deliveryNote: string;
  vehicleNo?: string;
  purchaseOrder?: string;
  receivedBy: string;
  lines: ReceiptLine[];
};

/** How much of an issue line came out of one batch. */
export type BatchDraw = {
  batchId: string;
  quantity: number;
};

export type IssueLine = {
  materialId: string;
  quantity: number;
  draws: BatchDraw[];
};

/** A material issue note - stock handed over from the store to the work face. */
export type MaterialIssue = {
  id: string;
  issueNo: number;
  issuedOn: string;
  /** Person who collected the materials. */
  issuedTo: string;
  /** Where on site the materials will be used. */
  workArea: string;
  purpose?: string;
  /** Material request number the issue answers, if any. */
  requestRef?: string;
  issuedBy: string;
  lines: IssueLine[];
};

/** A receipt as entered on the form, before numbers and batches exist. */
export type ReceiptDraft = Omit<GoodsReceipt, 'id' | 'grnNo' | 'lines'> & {
  lines: Omit<ReceiptLine, 'batchId'>[];
};

/** An issue as entered on the form, before FIFO picks the batches. */
export type IssueDraft = Omit<MaterialIssue, 'id' | 'issueNo' | 'lines'> & {
  lines: { materialId: string; quantity: number }[];
};

export type MaterialStoreState = {
  materials: Material[];
  batches: Batch[];
  receipts: GoodsReceipt[];
  issues: MaterialIssue[];
};

export type StockStatus = 'in-stock' | 'low' | 'out';

/** A material with its current stock worked out from its batches. */
export type MaterialStock = {
  material: Material;
  onHand: number;
  /** Rupee value of stock on hand at received prices. */
  value: number;
  /** Batches with stock left, in the order they'll be issued. */
  openBatches: Batch[];
  status: StockStatus;
  /** An open batch is within its use-by warning window. */
  useBySoon: boolean;
  /** An open batch is past its use-by date. */
  expired: boolean;
  /** ISO date of the latest delivery or issue. */
  lastMovement?: string;
};
