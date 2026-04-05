// BotID disabled — Turnstile already protects all high-value endpoints.
// To re-enable: uncomment below + restore checkBotId() in API routes + restore withBotId in next.config.mjs
//
// import { initBotId } from 'botid/client/core';
// initBotId({
//   protect: [
//     { path: '/api/account/register', method: 'POST' },
//     { path: '/api/contact', method: 'POST' },
//     { path: '/api/checkout/create-transaction', method: 'POST' },
//   ],
// });
