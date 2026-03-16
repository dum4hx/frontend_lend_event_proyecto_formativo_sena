import type { ReactNode } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

interface FooterPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function FooterPageLayout({
  title,
  subtitle,
  children,
}: FooterPageLayoutProps) {
  return (
    <div className="bg-black text-white min-h-screen flex flex-col selection:bg-yellow-400 selection:text-black">
      <Header />

      <main className="flex-grow px-6 py-16 md:py-20">
        <section className="max-w-6xl mx-auto space-y-10">
          <header className="space-y-4 text-center lg:text-left">
            <span className="inline-block py-1.5 px-4 text-[10px] md:text-xs font-bold tracking-widest text-yellow-400 uppercase border border-yellow-400/20 rounded-full bg-yellow-400/5">
              LendEvent
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-gray-400 text-base md:text-lg max-w-3xl">{subtitle}</p>
          </header>

          {children}
        </section>
      </main>

      <Footer />
    </div>
  );
}
