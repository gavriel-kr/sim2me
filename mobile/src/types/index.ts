export interface Destination {
  locationCode: string;
  name: string;
  flagCode: string;
  isRegional: boolean;
  planCount: number;
  minPrice: number;
  maxDataMB: number;
  speeds: string[];
  continent: string;
  featured: boolean;
}

export interface Plan {
  packageCode: string;
  name: string;
  slug: string;
  price: number;
  currencyCode: string;
  dataAmount: string;
  duration: string;
  speed: string;
  locationCode: string;
  flagCode: string;
  /** Destination/region name (API may return as `location` or `locationName`) */
  locationName: string;
  location?: string;
  isRegional: boolean;
  featured?: boolean;
  saleBadge?: string | null;
  topUp?: boolean;
}

export interface PackagesResponse {
  destinations: Destination[];
  packages: Plan[];
  total: number;
}

/** User's eSIM (from account); status and install info. Maps from OrderFromApi + optional usage */
export interface ESim {
  id: string;
  orderId: string;
  destinationName: string;
  planName: string;
  status: 'active' | 'expired' | 'pending';
  activationCode: string;
  iccid: string | null;
  qrCodeUrl: string | null;
  smdpAddress: string | null;
  dataAmount: string;
  validity: string;
  /** If true, show QR placeholder until real QR is available */
  qrPlaceholder?: boolean;
  /** Usage from API (bytes). Used for data ring */
  usedVolume?: number | null;
  orderVolume?: number | null;
  remainingVolume?: number | null;
  expiredTime?: number | null;
}

export type RootStackParamList = {
  Tabs: undefined;
  DestinationDetail: { locationCode: string; name: string; flagCode: string };
  PlanDetail: { plan: Plan };
  ESimDetail: { esim: ESim };
  InstallationGuide: undefined;
};

export type TabParamList = {
  Home: undefined;
  Destinations: undefined;
  MyeSIMs: undefined;
  Profile: undefined;
};
