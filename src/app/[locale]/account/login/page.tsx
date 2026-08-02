import { MainLayout } from '@/components/layout/MainLayout';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { AccountLoginClient } from './AccountLoginClient';

export const metadata = {
  title: 'Sign in | Sim2Me',
  description: 'Sign in to your Sim2Me account.',
};

export default function AccountLoginPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        {/*
          Ticket 031. Above the card, never inside it: `AccountLoginClient` holds the sign-in form,
          the OTP step and Turnstile, and nothing here is worth reaching into that for. Standing at
          the door rather than reacting to anything, so no crop and no mirror.
        */}
        <div className="mb-6 flex items-end justify-center gap-2">
          <CharacterFigure slot="genericSimi" height={132} heightLg={168} />
          <CharacterFigure slot="genericSima" height={132} heightLg={168} />
        </div>
        <AccountLoginClient />
      </div>
    </MainLayout>
  );
}
