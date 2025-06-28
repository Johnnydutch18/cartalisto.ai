'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData: FormData, team: { id: string; name: string }) => {
  const priceId = formData.get('priceId') as string;
  await createCheckoutSession(team.id, priceId, '/dashboard', '/pricing');
});

export const customerPortalAction = withTeam(async (_, team) => {
  const portalSession = await createCustomerPortalSession(team);
  redirect(portalSession.url);
});
