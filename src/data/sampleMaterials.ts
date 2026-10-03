import { addDays, todayISO } from '../utils/materials';
import type { IssueDraft, Material, ReceiptDraft } from '../types/materials';

/**
 * Sample store history until the materials API exists.
 *
 * Rather than hard-coding stock levels, the store starts empty and replays
 * these deliveries and issues in order (see hooks/useMaterialStore.ts), so
 * every batch balance comes out of the same FIFO logic the forms use. Dates
 * are relative to today so use-by warnings stay meaningful.
 */
export const sampleMaterials: Material[] = [
  { id: 'cement-opc', name: 'Portland cement', spec: 'OPC 42.5N · 50 kg bag', category: 'cement', unit: 'bag', reorderLevel: 150, defaultLocation: 'Cement shed', shelfLifeDays: 90 },
  { id: 'sand-river', name: 'River sand', spec: 'Washed · for concrete and plaster', category: 'aggregates', unit: 'cube', reorderLevel: 4, defaultLocation: 'Sand yard' },
  { id: 'metal-20', name: 'Metal aggregate', spec: '20 mm crushed', category: 'aggregates', unit: 'cube', reorderLevel: 3, defaultLocation: 'Aggregate yard' },
  { id: 'rebar-t12', name: 'Reinforcement bar T12', spec: '12 mm high-yield · 12 m bars', category: 'steel', unit: 'kg', reorderLevel: 800, defaultLocation: 'Steel yard' },
  { id: 'rebar-t16', name: 'Reinforcement bar T16', spec: '16 mm high-yield · 12 m bars', category: 'steel', unit: 'kg', reorderLevel: 800, defaultLocation: 'Steel yard' },
  { id: 'binding-wire', name: 'Binding wire', spec: '18 gauge · annealed', category: 'steel', unit: 'kg', reorderLevel: 40, defaultLocation: 'Main store' },
  { id: 'block-150', name: 'Cement blocks', spec: '150 mm (6 in) solid', category: 'masonry', unit: 'nos', reorderLevel: 1000, defaultLocation: 'Block yard' },
  { id: 'plywood-18', name: 'Formwork plywood', spec: '18 mm film-faced · 8 × 4 ft', category: 'timber', unit: 'sheet', reorderLevel: 10, defaultLocation: 'Formwork yard' },
  { id: 'pins-50', name: 'Concrete pins', spec: '50 mm (2 in) hardened steel', category: 'hardware', unit: 'nos', reorderLevel: 500, defaultLocation: 'Main store' },
  { id: 'pvc-110', name: 'PVC pipe 110 mm', spec: 'Type 1000 · 6 m length', category: 'plumbing', unit: 'length', reorderLevel: 6, defaultLocation: 'Main store' },
  { id: 'conduit-20', name: 'PVC conduit 20 mm', spec: '2.9 m length', category: 'electrical', unit: 'length', reorderLevel: 30, defaultLocation: 'Main store' },
  { id: 'cable-2-5', name: 'Electrical cable', spec: '2.5 mm² single core · red', category: 'electrical', unit: 'm', reorderLevel: 100, defaultLocation: 'Main store' },
  { id: 'floor-tile', name: 'Porcelain floor tiles', spec: '600 × 600 mm · matt grey', category: 'finishes', unit: 'm2', reorderLevel: 40, defaultLocation: 'Main store' },
  { id: 'tile-adhesive', name: 'Tile adhesive', spec: 'Cement based · 25 kg bag', category: 'finishes', unit: 'bag', reorderLevel: 30, defaultLocation: 'Cement shed', shelfLifeDays: 180 },
  { id: 'paint-emulsion', name: 'Interior emulsion paint', spec: 'White · 18 L pail', category: 'finishes', unit: 'pail', reorderLevel: 4, defaultLocation: 'Main store', shelfLifeDays: 365 },
  { id: 'waterproof-admix', name: 'Waterproofing admixture', spec: 'Integral liquid · for concrete', category: 'chemicals', unit: 'l', reorderLevel: 20, defaultLocation: 'Main store', shelfLifeDays: 365 },
];

export type SampleEvent =
  | { kind: 'receive'; draft: ReceiptDraft }
  | { kind: 'issue'; draft: IssueDraft };

const STORE_KEEPER = 'R. Bandara';

function receive(
  daysAgo: number,
  supplier: string,
  deliveryNote: string,
  lines: ReceiptDraft['lines'],
  extra: Partial<ReceiptDraft> = {},
): SampleEvent {
  return {
    kind: 'receive',
    draft: {
      receivedOn: addDays(todayISO(), -daysAgo),
      supplier,
      deliveryNote,
      receivedBy: STORE_KEEPER,
      lines,
      ...extra,
    },
  };
}

function issue(
  daysAgo: number,
  workArea: string,
  issuedTo: string,
  lines: IssueDraft['lines'],
  extra: Partial<IssueDraft> = {},
): SampleEvent {
  return {
    kind: 'issue',
    draft: {
      issuedOn: addDays(todayISO(), -daysAgo),
      workArea,
      issuedTo,
      issuedBy: STORE_KEEPER,
      lines,
      ...extra,
    },
  };
}

function line(
  materialId: string,
  quantityDelivered: number,
  unitCost: number,
  location: string,
  extra: Partial<ReceiptDraft['lines'][number]> = {},
): ReceiptDraft['lines'][number] {
  return { materialId, quantityDelivered, quantityRejected: 0, unitCost, location, ...extra };
}

const inDays = (days: number) => addDays(todayISO(), days);

/** Store history, oldest first. */
export const sampleEvents: SampleEvent[] = [
  receive(45, 'Weerasinghe Hardware', 'DN 55821', [
    line('cement-opc', 200, 2350, 'Cement shed', { useBy: inDays(45) }),
    line('binding-wire', 100, 540, 'Main store'),
    line('pins-50', 2000, 6, 'Main store'),
  ], { vehicleNo: 'WP LJ-4521', purchaseOrder: 'PO 2026/114' }),
  receive(42, 'Nimal Sand & Metal', 'INV 7730', [
    line('sand-river', 6, 28000, 'Sand yard'),
    line('metal-20', 10, 16500, 'Aggregate yard'),
  ], { vehicleNo: 'WP LC-8862' }),
  receive(40, 'Kelani Steel Traders', 'DN 0391', [
    line('rebar-t12', 2400, 310, 'Steel yard', { remarks: 'Mill certificate received' }),
    line('rebar-t16', 1800, 305, 'Steel yard', { remarks: 'Mill certificate received' }),
  ], { vehicleNo: 'WP PH-1290', purchaseOrder: 'PO 2026/118' }),
  receive(36, 'Galle Road Timber Depot', 'DN 1186', [
    line('plywood-18', 40, 9800, 'Formwork yard'),
  ]),
  receive(34, 'Coastal Pipes & Fittings', 'INV 22014', [
    line('pvc-110', 24, 6200, 'Main store'),
    line('conduit-20', 120, 380, 'Main store'),
    line('cable-2-5', 500, 145, 'Main store'),
  ], { purchaseOrder: 'PO 2026/121' }),
  issue(33, 'Block A · Level 2 slab', 'K. Perera', [
    { materialId: 'cement-opc', quantity: 100 },
    { materialId: 'sand-river', quantity: 3 },
    { materialId: 'metal-20', quantity: 5 },
    { materialId: 'rebar-t12', quantity: 1600 },
    { materialId: 'binding-wire', quantity: 50 },
  ], { purpose: 'Slab concreting', requestRef: 'MR 318' }),
  receive(30, 'Hettiarachchi Block Works', 'DN 4410', [
    line('block-150', 3000, 95, 'Block yard'),
  ], { vehicleNo: 'SP LA-3317' }),
  receive(28, 'BuildMart Distributors', 'INV 90127', [
    line('tile-adhesive', 40, 2900, 'Cement shed', { useBy: inDays(150) }),
    line('waterproof-admix', 100, 1450, 'Main store', { useBy: inDays(9) }),
    line('paint-emulsion', 12, 21500, 'Main store', { useBy: inDays(330) }),
  ]),
  issue(26, 'Block A · Level 2 columns', 'S. Fernando', [
    { materialId: 'rebar-t16', quantity: 900 },
    { materialId: 'binding-wire', quantity: 20 },
    { materialId: 'plywood-18', quantity: 16 },
    { materialId: 'pins-50', quantity: 900 },
  ], { purpose: 'Column cages and formwork', requestRef: 'MR 322' }),
  issue(24, 'Block B · Ground floor walls', 'M. Jayasinghe', [
    { materialId: 'block-150', quantity: 1800 },
    { materialId: 'cement-opc', quantity: 40 },
    { materialId: 'sand-river', quantity: 2.5 },
  ], { purpose: 'Blockwork' }),
  receive(21, 'Weerasinghe Hardware', 'DN 56107', [
    line('cement-opc', 300, 2420, 'Cement shed', {
      quantityRejected: 6,
      useBy: inDays(69),
      remarks: '6 bags torn - returned with vehicle',
    }),
  ], { vehicleNo: 'WP LJ-4521', purchaseOrder: 'PO 2026/131' }),
  receive(21, 'Nimal Sand & Metal', 'INV 7794', [
    line('sand-river', 8, 28500, 'Sand yard'),
  ], { vehicleNo: 'WP LC-8862' }),
  issue(18, 'Block A · Level 3 slab', 'K. Perera', [
    { materialId: 'cement-opc', quantity: 70 },
    { materialId: 'sand-river', quantity: 2 },
    { materialId: 'metal-20', quantity: 3.75 },
    { materialId: 'rebar-t12', quantity: 600 },
    { materialId: 'waterproof-admix', quantity: 60 },
  ], { purpose: 'Roof slab concreting', requestRef: 'MR 331' }),
  receive(15, 'Kelani Steel Traders', 'DN 0457', [
    line('rebar-t12', 1200, 320, 'Steel yard', { remarks: 'Mill certificate received' }),
  ], { vehicleNo: 'WP PH-1290' }),
  issue(12, 'Block B · Ground floor services', 'A. Silva', [
    { materialId: 'pvc-110', quantity: 14 },
    { materialId: 'conduit-20', quantity: 80 },
    { materialId: 'cable-2-5', quantity: 320 },
  ], { purpose: 'Plumbing and electrical first fix' }),
  issue(10, 'Block A · Level 1 finishes', 'N. Rathnayake', [
    { materialId: 'tile-adhesive', quantity: 40 },
    { materialId: 'paint-emulsion', quantity: 5 },
  ], { requestRef: 'MR 336' }),
  receive(9, 'BuildMart Distributors', 'INV 90311', [
    line('floor-tile', 220, 4850, 'Main store', { remarks: '3 boxes chipped, replaced by supplier' }),
  ]),
  receive(7, 'Hettiarachchi Block Works', 'DN 4475', [
    line('block-150', 2500, 98, 'Block yard'),
  ], { vehicleNo: 'SP LA-3317' }),
  issue(5, 'Block B · Level 1 walls', 'M. Jayasinghe', [
    { materialId: 'block-150', quantity: 1400 },
    { materialId: 'cement-opc', quantity: 30 },
    { materialId: 'sand-river', quantity: 2.5 },
    { materialId: 'binding-wire', quantity: 22 },
  ], { purpose: 'Blockwork', requestRef: 'MR 340' }),
  issue(4, 'Block A · Level 1 flooring', 'N. Rathnayake', [
    { materialId: 'floor-tile', quantity: 86.5 },
  ]),
  receive(3, 'Nimal Sand & Metal', 'INV 7851', [
    line('metal-20', 6, 17000, 'Aggregate yard'),
  ], { vehicleNo: 'WP LC-8862' }),
  receive(3, 'Weerasinghe Hardware', 'DN 56392', [
    line('pins-50', 1000, 6.5, 'Main store'),
  ]),
  receive(2, 'Weerasinghe Hardware', 'DN 56415', [
    line('cement-opc', 200, 2450, 'Cement shed', { useBy: inDays(88) }),
  ], { vehicleNo: 'WP LJ-4521', purchaseOrder: 'PO 2026/140' }),
  issue(1, 'Block A · Level 3 beams', 'S. Fernando', [
    { materialId: 'rebar-t12', quantity: 1000 },
    { materialId: 'plywood-18', quantity: 10 },
  ], { purpose: 'Beam reinforcement and shuttering', requestRef: 'MR 344' }),
];
