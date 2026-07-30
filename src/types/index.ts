/**
 * Shared domain types for eSIM platform.
 * Used by UI, repositories, and services.
 */

export type NetworkType = '4G' | '5G' | '3G';
export type RegionSlug = string;

export interface Destination {
  id: string;
  name: string;
  nameKey?: string; // i18n key for name
  slug: string;
  region: RegionSlug;
  isoCode: string;
  flagUrl: string;
  popular: boolean;
  operatorCount: number;
  planCount: number;
  /** Lowest plan price for "from X" display */
  fromPrice?: number;
  fromCurrency?: string;
}

export interface Plan {
  id: string;
  destinationId: string;
  name: string;
  dataAmount: number; // MB
  dataDisplay: string; // e.g. "1 GB", "Unlimited"
  days: number;
  price: number;
  currency: string;
  networkType: NetworkType;
  speed?: string; // e.g. "High speed"
  tethering: boolean;
  topUps: boolean;
  operatorName: string;
  popular?: boolean;
  /** Admin-set promo badge (e.g. "20% OFF", "HOT") — from PackageOverride */
  saleBadge?: string | null;
}

export interface FAQ {
  id: string;
  questionKey: string;
  answerKey: string;
  category?: string;
  /** Optional CTA under the answer (e.g. link to personal account). */
  ctaHref?: string;
  ctaLabelKey?: string;
}

export interface CartItem {
  planId: string;
  destinationId: string;
  destinationName: string;
  destinationSlug: string;
  plan: Plan;
  quantity: number;
}

export interface TravelerInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: 'pending' | 'paid' | 'activated' | 'expired';
  items: CartItem[];
  traveler: TravelerInfo;
  total: number;
  currency: string;
}

export interface ESIMActivation {
  orderId: string;
  planId: string;
  qrCodeUrl: string; // placeholder
  activationCode: string;
  status: 'pending' | 'installed' | 'activated';
  installInstructionsKey: string;
}
