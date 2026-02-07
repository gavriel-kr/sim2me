import type { FAQ } from '@/types';

export const mockFaqs: FAQ[] = [
  { id: '1', questionKey: 'whatIsEsim', answerKey: 'answerWhatIsEsim', category: 'general' },
  { id: '2', questionKey: 'howToInstall', answerKey: 'answerHowToInstall', category: 'general' },
  { id: '3', questionKey: 'whenToActivate', answerKey: 'answerWhenToActivate', category: 'general' },
  { id: '4', questionKey: 'refundPolicy', answerKey: 'answerRefundPolicy', category: 'purchase' },
  { id: '5', questionKey: 'coverage', answerKey: 'answerCoverage', category: 'coverage' },
  { id: '6', questionKey: 'compatibleDevices', answerKey: 'answerCompatibleDevices', category: 'devices' },
];
