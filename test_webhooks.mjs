import { Webhook } from 'svix';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

const clerkSecret = process.env.CLERK_WEBHOOK_SECRET;
const stripeSecret = process.env.STRIPE_WEBHOOK_SECRET;
const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const supabase = createClient(baseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, realtime: { transport: ws } });

const clerkUserId = 'webhook_test_user_123';
const email = 'webhook_test@example.com';

try {
  // 1. Clerk user.created test
  const clerkPayload = JSON.stringify({ type: 'user.created', data: { id: clerkUserId, email_addresses: [{ email_address: email }] } });
  const clerkWh = new Webhook(clerkSecret);
  const msgId = 'test-id';
  const now = new Date();
  const clerkSignature = clerkWh.sign(msgId, now, clerkPayload);
  const clerkRes = await fetch('http://127.0.0.1:3001/api/webhook/clerk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'svix-id': msgId, 'svix-timestamp': String(Math.floor(now.getTime() / 1000)), 'svix-signature': clerkSignature },
    body: clerkPayload,
  });
  const clerkText = await clerkRes.text();
  console.log('Clerk webhook status:', clerkRes.status, clerkText);

  // 2. Stripe checkout.session.completed (credit pack) test
  const stripePayload = JSON.stringify({
    id: 'evt_test_123',
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_123', mode: 'payment', metadata: { clerk_user_id: clerkUserId } } },
  });
  const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  const stripeSig = stripeClient.webhooks.generateTestHeaderString({ payload: stripePayload, secret: stripeSecret });
  const stripeRes = await fetch('http://127.0.0.1:3001/api/webhook/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'stripe-signature': stripeSig },
    body: stripePayload,
  });
  const stripeText = await stripeRes.text();
  console.log('Stripe webhook status:', stripeRes.status, stripeText);

  // 3. Verify user in Supabase
  const { data: user, error: userError } = await supabase.from('users').select('clerk_user_id, email, plan, credits').eq('clerk_user_id', clerkUserId).single();
  if (userError) console.error('Supabase lookup error:', userError);
  else console.log('User in Supabase:', JSON.stringify(user, null, 2));
} finally {
  const { error } = await supabase.from('users').delete().eq('clerk_user_id', clerkUserId);
  if (error) console.error('cleanup error:', error);
  else console.log('test user cleaned up');
}
