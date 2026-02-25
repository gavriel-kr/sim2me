/**
 * Shared types for bulk edit (client + server).
 * Used by admin packages bulk update API and PackagesClient.
 */

export type NumericEditMode =
  | 'set_exact'
  | 'increase_percent'
  | 'decrease_percent'
  | 'increase_fixed'
  | 'decrease_fixed';

export interface NumericEdit {
  mode: NumericEditMode;
  value: number;
}

export interface BulkEditEdits {
  retailPrice?: NumericEdit;
  simCost?: NumericEdit;
  saleBadge?: { mode: 'set_exact'; value: string | null };
  notes?: { mode: 'set_exact'; value: string | null };
  paddlePriceId?: { mode: 'set_exact'; value: string | null };
}

export interface BulkEditConditions {
  marginLessThan?: number;
  marginGreaterThan?: number;
  netProfitLessThan?: number;
  netProfitGreaterThan?: number;
  retailPriceMin?: number;
  retailPriceMax?: number;
  countryEquals?: string;
  dataAmountEquals?: number;
  durationEquals?: number;
}

export interface BulkUpdatePayload {
  packageCodes: string[];
  edits: BulkEditEdits;
  conditions?: BulkEditConditions;
}

export interface RollbackSnapshotItem {
  packageCode: string;
  override: {
    visible: boolean;
    customTitle: string | null;
    customPrice: number | null;
    simCost: number | null;
    paddlePriceId: string | null;
    saleBadge: string | null;
    featured: boolean;
    sortOrder: number;
    notes: string | null;
  } | null;
}

export const BULK_UPDATE_CHUNK_SIZE = 500;
