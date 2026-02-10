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

export type RootStackParamList = {
  Tabs: undefined;
  DestinationDetail: { locationCode: string; name: string; flagCode: string };
  PlanDetail: { plan: Plan };
};

export type TabParamList = {
  Home: undefined;
  Destinations: undefined;
  MyeSIMs: undefined;
  Profile: undefined;
};
