import type { RoleId } from '../types/auth';
import type {
  MaterialCategoryId,
  MaterialUnit,
  MeasureKind,
  UnitId,
} from '../types/materials';

/**
 * Units, categories and permissions for the materials store.
 *
 * A material picks one unit when it's added and its stock is always counted
 * in that unit — bags of cement, cubes of sand, kg of steel, nos of pins. To
 * support a new unit, add it to UnitId in types/materials.ts and list it here.
 */
export const measureKinds: { id: MeasureKind; label: string }[] = [
  { id: 'count', label: 'Count' },
  { id: 'weight', label: 'Weight' },
  { id: 'volume', label: 'Volume' },
  { id: 'length', label: 'Length' },
  { id: 'area', label: 'Area' },
];

export const materialUnits: MaterialUnit[] = [
  // Count
  { id: 'nos', label: 'nos', plural: 'nos', measure: 'count', decimals: 0, hint: 'Individual pieces' },
  { id: 'bag', label: 'bag', plural: 'bags', measure: 'count', decimals: 0 },
  { id: 'box', label: 'box', plural: 'boxes', measure: 'count', decimals: 0 },
  { id: 'roll', label: 'roll', plural: 'rolls', measure: 'count', decimals: 0 },
  { id: 'sheet', label: 'sheet', plural: 'sheets', measure: 'count', decimals: 0 },
  { id: 'length', label: 'length', plural: 'lengths', measure: 'count', decimals: 0, hint: 'Full pipe or bar lengths' },
  { id: 'bundle', label: 'bundle', plural: 'bundles', measure: 'count', decimals: 0 },
  { id: 'pail', label: 'pail', plural: 'pails', measure: 'count', decimals: 0 },
  // Weight
  { id: 'kg', label: 'kg', plural: 'kg', measure: 'weight', decimals: 2 },
  { id: 't', label: 't', plural: 't', measure: 'weight', decimals: 3, hint: 'Metric tonnes' },
  // Volume
  { id: 'cube', label: 'cube', plural: 'cubes', measure: 'volume', decimals: 2, hint: '100 cubic feet' },
  { id: 'm3', label: 'm³', plural: 'm³', measure: 'volume', decimals: 2 },
  { id: 'l', label: 'L', plural: 'L', measure: 'volume', decimals: 1, hint: 'Litres' },
  // Length
  { id: 'm', label: 'm', plural: 'm', measure: 'length', decimals: 2 },
  { id: 'ft', label: 'ft', plural: 'ft', measure: 'length', decimals: 1 },
  // Area
  { id: 'm2', label: 'm²', plural: 'm²', measure: 'area', decimals: 2 },
  { id: 'sqft', label: 'sq ft', plural: 'sq ft', measure: 'area', decimals: 1 },
];

export function getUnit(id: UnitId): MaterialUnit {
  return materialUnits.find((unit) => unit.id === id) ?? materialUnits[0];
}

export const materialCategories: { id: MaterialCategoryId; label: string }[] = [
  { id: 'cement', label: 'Cement & binders' },
  { id: 'aggregates', label: 'Sand & aggregates' },
  { id: 'steel', label: 'Steel & reinforcement' },
  { id: 'masonry', label: 'Blocks & bricks' },
  { id: 'timber', label: 'Timber & formwork' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'finishes', label: 'Tiles & finishes' },
  { id: 'chemicals', label: 'Chemicals & admixtures' },
  { id: 'hardware', label: 'Hardware & fixings' },
];

export function getCategoryLabel(id: MaterialCategoryId): string {
  return materialCategories.find((category) => category.id === id)?.label ?? id;
}

/** Storage spots offered as suggestions when receiving. */
export const storeLocations = [
  'Main store',
  'Cement shed',
  'Sand yard',
  'Aggregate yard',
  'Steel yard',
  'Block yard',
  'Formwork yard',
];

/** Warn about a batch this many days before its use-by date. */
export const USE_BY_WARNING_DAYS = 14;

/**
 * Roles that record deliveries and issue stock. Everyone else who can open
 * the Materials tab sees the store read-only.
 */
export const materialStoreRoles: RoleId[] = ['store-keeper', 'project-manager'];
