import type { Plan } from '@/types';

const basePlans = (destId: string): Plan[] => [
  {
    id: `${destId}-1gb-7`,
    destinationId: destId,
    name: '1 GB / 7 days',
    dataAmount: 1024,
    dataDisplay: '1 GB',
    days: 7,
    price: 4.99,
    currency: 'USD',
    networkType: '4G',
    speed: 'High speed',
    tethering: true,
    topUps: true,
    operatorName: 'Local Carrier',
    popular: false,
  },
  {
    id: `${destId}-3gb-15`,
    destinationId: destId,
    name: '3 GB / 15 days',
    dataAmount: 3072,
    dataDisplay: '3 GB',
    days: 15,
    price: 9.99,
    currency: 'USD',
    networkType: '4G',
    speed: 'High speed',
    tethering: true,
    topUps: true,
    operatorName: 'Local Carrier',
    popular: true,
  },
  {
    id: `${destId}-5gb-30`,
    destinationId: destId,
    name: '5 GB / 30 days',
    dataAmount: 5120,
    dataDisplay: '5 GB',
    days: 30,
    price: 14.99,
    currency: 'USD',
    networkType: '5G',
    speed: 'High speed',
    tethering: true,
    topUps: true,
    operatorName: 'Local Carrier',
    popular: false,
  },
  {
    id: `${destId}-10gb-30`,
    destinationId: destId,
    name: '10 GB / 30 days',
    dataAmount: 10240,
    dataDisplay: '10 GB',
    days: 30,
    price: 24.99,
    currency: 'USD',
    networkType: '5G',
    speed: 'High speed',
    tethering: true,
    topUps: true,
    operatorName: 'Local Carrier',
    popular: true,
  },
  {
    id: `${destId}-unl-30`,
    destinationId: destId,
    name: 'Unlimited / 30 days',
    dataAmount: -1,
    dataDisplay: 'Unlimited',
    days: 30,
    price: 39.99,
    currency: 'USD',
    networkType: '5G',
    speed: 'High speed',
    tethering: true,
    topUps: false,
    operatorName: 'Local Carrier',
    popular: false,
  },
];

export function getMockPlansByDestination(destinationId: string): Plan[] {
  return basePlans(destinationId);
}

export function getAllMockPlans(): Plan[] {
  const destinations = ['us', 'gb', 'jp', 'il', 'fr', 'de', 'es', 'it', 'th', 'ae', 'eu', 'au'];
  return destinations.flatMap((id) => basePlans(id));
}

export function getMockPlanById(planId: string): Plan | undefined {
  const all = getAllMockPlans();
  return all.find((p) => p.id === planId);
}
