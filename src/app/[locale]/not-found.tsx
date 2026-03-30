import { getLocale } from 'next-intl/server';
import { MainLayout } from '@/components/layout/MainLayout';
import { BrandGlobeWaves } from '@/components/icons/BrandGlobeWaves';
import { RedirectCountdownButton } from '@/components/RedirectCountdownButton';
import { NOT_FOUND_COPY, toUiLang } from '@/lib/destination-unavailable-copy';

/** Server Component: useLocale() can break when this view is triggered via notFound(); getLocale() is reliable. */
export default async function NotFoundPage() {
  const locale = await getLocale();
  const lang = toUiLang(locale);
  const copy = NOT_FOUND_COPY[lang];

  return (
    <MainLayout>
      <div className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-5 flex w-full justify-center" aria-hidden>
          <div className="h-[53px] w-[110px] shrink-0 sm:h-[70px] sm:w-[145px]">
            <BrandGlobeWaves />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground leading-relaxed">{copy.body}</p>
        <div className="mt-8">
          <RedirectCountdownButton
            href={`/${locale}`}
            seconds={15}
            variant="notFound"
            lang={lang}
          />
        </div>
      </div>
    </MainLayout>
  );
}
