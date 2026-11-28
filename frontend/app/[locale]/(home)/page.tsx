import { useTranslations } from 'next-intl';

export default function LandingPage() {
  const t = useTranslations('LandingPage');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-raleway mb-4">{t('title')}</h1>
      <p className="text-xl text-gray-600 mb-8">{t('subtitle')}</p>

      <div className="flex gap-4">
        <button className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
          {t('getStarted')}
        </button>
        <button className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          {t('login')}
        </button>
      </div>
    </main>
  );
}