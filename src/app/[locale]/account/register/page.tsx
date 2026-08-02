import { MainLayout } from '@/components/layout/MainLayout';
import { CharacterFigure } from '@/components/brand/CharacterFigure';
import { AccountRegisterClient } from './AccountRegisterClient';

export const metadata = {
  title: 'Create account | Sim2Me',
  description: 'Create your Sim2Me account.',
};

export default function AccountRegisterPage() {
  return (
    <MainLayout>
      <div className="container mx-auto max-w-md px-4 py-12">
        {/*
          Ticket 031. Matches the sign-in page exactly. These two are one screen with a toggle as far
          as a visitor is concerned, so characters on one and not the other reads as a broken page.
        */}
        <div className="mb-6 flex items-end justify-center gap-2">
          <CharacterFigure slot="genericSimi" height={132} heightLg={168} />
          <CharacterFigure slot="genericSima" height={132} heightLg={168} />
        </div>
        <AccountRegisterClient />
      </div>
    </MainLayout>
  );
}
