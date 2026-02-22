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
  locationName: string;
  isRegional: boolean;
}

export interface PackagesResponse {
  destinations: Destination[];
  packages: Plan[];
  total: number;
}

/** User's eSIM (from account); status and install info */
export interface ESim {
  id: string;
  orderId: string;
  destinationName: string;
  planName: string;
  status: 'pending' | 'activated';
  activationCode: string;
  /** If true, show QR placeholder until real QR is available */
  qrPlaceholder?: boolean;
}

export type RootStackParamList = {
  Tabs: undefined;
  DestinationDetail: { locationCode: string; name: string; flagCode: string };
  PlanDetail: { plan: Plan };
  ESimDetail: { esim: ESim };
};

export type TabParamList = {
  Home: undefined;
  Destinations: undefined;
  MyeSIMs: undefined;
  Profile: undefined;
};
