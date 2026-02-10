import type { FAQ } from '@/types';

export const mockFaqs: FAQ[] = [
  // Getting started
  { id: '1', questionKey: 'whatIsEsim', answerKey: 'answerWhatIsEsim', category: 'general' },
  { id: '2', questionKey: 'howToInstall', answerKey: 'answerHowToInstall', category: 'general' },
  { id: '3', questionKey: 'whenToActivate', answerKey: 'answerWhenToActivate', category: 'general' },
  { id: '4', questionKey: 'compatibleDevices', answerKey: 'answerCompatibleDevices', category: 'devices' },
  // Usage
  { id: '5', questionKey: 'canUseDualSim', answerKey: 'answerCanUseDualSim', category: 'general' },
  { id: '6', questionKey: 'dataRoaming', answerKey: 'answerDataRoaming', category: 'general' },
  { id: '7', questionKey: 'hotspot', answerKey: 'answerHotspot', category: 'general' },
  { id: '8', questionKey: 'multipleEsim', answerKey: 'answerMultipleEsim', category: 'general' },
  // Data & Coverage
  { id: '9', questionKey: 'topUp', answerKey: 'answerTopUp', category: 'coverage' },
  { id: '10', questionKey: 'coverage', answerKey: 'answerCoverage', category: 'coverage' },
  { id: '11', questionKey: 'reinstall', answerKey: 'answerReinstall', category: 'general' },
  // Troubleshooting
  { id: '12', questionKey: 'noSignal', answerKey: 'answerNoSignal', category: 'general' },
  { id: '13', questionKey: 'vpn', answerKey: 'answerVpn', category: 'general' },
  // Purchase
  { id: '14', questionKey: 'refundPolicy', answerKey: 'answerRefundPolicy', category: 'purchase' },
];
