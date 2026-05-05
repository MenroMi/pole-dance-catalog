import Footer from '@/shared/components/Footer';
import Header from '@/shared/components/Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <div className="mx-auto flex w-full max-w-[2560px] flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}
