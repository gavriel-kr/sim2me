import type { FAQ, FaqGroup } from '@/types';

/**
 * The order of the help-centre sections.
 *
 * Installation and troubleshooting come first because that is what a customer with a problem is looking
 * for; the commercial questions follow. Ticket 036.
 */
export const FAQ_GROUPS: readonly FaqGroup[] = [
  'gettingStartedTitle',
  'troubleshootingTitle',
  'dataPlansTitle',
  'accountTitle',
];

/**
 * The single source for the FAQ, used by the help centre, its JSON-LD and the homepage section.
 *
 * `FAQSection` renders the first five entries, so **new questions are appended, never inserted** — an
 * insertion silently changes what the homepage shows.
 */
export const mockFaqs: FAQ[] = [
  // Product
  {
    id: '0',
    questionKey: 'doYouHaveApp',
    answerKey: 'answerDoYouHaveApp',
    category: 'general',
    group: 'accountTitle',
    ctaHref: '/account',
    ctaLabelKey: 'goToAccount',
  },
  // Getting started
  { id: '1', questionKey: 'whatIsEsim', answerKey: 'answerWhatIsEsim', category: 'general', group: 'gettingStartedTitle' },
  { id: '2', questionKey: 'howToInstall', answerKey: 'answerHowToInstall', category: 'general', group: 'gettingStartedTitle' },
  { id: '3', questionKey: 'whenToActivate', answerKey: 'answerWhenToActivate', category: 'general', group: 'gettingStartedTitle' },
  {
    id: '4',
    questionKey: 'compatibleDevices',
    answerKey: 'answerCompatibleDevices',
    category: 'devices',
    group: 'gettingStartedTitle',
    ctaHref: '/compatible-devices',
    ctaLabelKey: 'goToDevices',
  },
  // Usage
  { id: '5', questionKey: 'canUseDualSim', answerKey: 'answerCanUseDualSim', category: 'general', group: 'gettingStartedTitle' },
  { id: '6', questionKey: 'dataRoaming', answerKey: 'answerDataRoaming', category: 'general', group: 'gettingStartedTitle' },
  { id: '7', questionKey: 'hotspot', answerKey: 'answerHotspot', category: 'general', group: 'dataPlansTitle' },
  { id: '8', questionKey: 'multipleEsim', answerKey: 'answerMultipleEsim', category: 'general', group: 'gettingStartedTitle' },
  // Data & Coverage
  { id: '9', questionKey: 'topUp', answerKey: 'answerTopUp', category: 'coverage', group: 'dataPlansTitle' },
  { id: '10', questionKey: 'coverage', answerKey: 'answerCoverage', category: 'coverage', group: 'dataPlansTitle' },
  { id: '11', questionKey: 'reinstall', answerKey: 'answerReinstall', category: 'general', group: 'troubleshootingTitle' },
  // Troubleshooting
  { id: '12', questionKey: 'noSignal', answerKey: 'answerNoSignal', category: 'general', group: 'troubleshootingTitle' },
  { id: '13', questionKey: 'vpn', answerKey: 'answerVpn', category: 'general', group: 'troubleshootingTitle' },
  // Purchase
  { id: '14', questionKey: 'refundPolicy', answerKey: 'answerRefundPolicy', category: 'purchase', group: 'accountTitle' },

  /* Ticket 036 — the questions a first-time eSIM buyer actually asks, and that the list did not answer.
     Appended so the homepage's first five are untouched. */
  { id: '15', questionKey: 'dataOnly', answerKey: 'answerDataOnly', category: 'general', group: 'gettingStartedTitle' },
  { id: '16', questionKey: 'keepMyNumber', answerKey: 'answerKeepMyNumber', category: 'general', group: 'gettingStartedTitle' },
  {
    id: '17',
    questionKey: 'carrierLocked',
    answerKey: 'answerCarrierLocked',
    category: 'devices',
    group: 'gettingStartedTitle',
    ctaHref: '/compatible-devices',
    ctaLabelKey: 'goToDevices',
  },
  { id: '18', questionKey: 'noServiceBeforeFlight', answerKey: 'answerNoServiceBeforeFlight', category: 'general', group: 'troubleshootingTitle' },
  { id: '19', questionKey: 'dataRunsOut', answerKey: 'answerDataRunsOut', category: 'coverage', group: 'dataPlansTitle' },
];
