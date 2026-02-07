import type { FAQ } from '@/types';

export const mockFaqs: FAQ[] = [
  { id: '1', questionKey: 'faq.whatIsEsim', answerKey: 'faq.answerWhatIsEsim', category: 'general' },
  { id: '2', questionKey: 'faq.howToInstall', answerKey: 'faq.answerHowToInstall', category: 'general' },
  { id: '3', questionKey: 'faq.whenToActivate', answerKey: 'faq.answerWhenToActivate', category: 'general' },
  { id: '4', questionKey: 'faq.refundPolicy', answerKey: 'faq.answerRefundPolicy', category: 'purchase' },
  { id: '5', questionKey: 'faq.coverage', answerKey: 'faq.answerCoverage', category: 'coverage' },
  { id: '6', questionKey: 'faq.compatibleDevices', answerKey: 'faq.answerCompatibleDevices', category: 'devices' },
];
