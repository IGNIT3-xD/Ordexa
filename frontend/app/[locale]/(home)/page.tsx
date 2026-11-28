import { Hero } from '@/components/home/Hero';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('LandingPage');

  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
    </main>
  );
}