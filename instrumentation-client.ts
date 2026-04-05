import { initBotId } from 'botid/client/core';

// BotID invisible bot protection on high-value POST endpoints.
// Works alongside Cloudflare Turnstile for defence-in-depth.
initBotId({
  protect: [
    { path: '/api/account/register', method: 'POST' },
    { path: '/api/contact', method: 'POST' },
    { path: '/api/checkout/create-transaction', method: 'POST' },
  ],
});
