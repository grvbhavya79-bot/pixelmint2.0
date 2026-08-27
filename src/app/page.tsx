import { Hero } from "@/components/pixelmint/hero";
import { SiteNav } from "@/components/pixelmint/nav";
import { Marquee } from "@/components/pixelmint/marquee";
import { Work } from "@/components/pixelmint/work";
import { Services } from "@/components/pixelmint/services";
import { About } from "@/components/pixelmint/about";
import { Testimonials } from "@/components/pixelmint/testimonials";
import { FinalCta } from "@/components/pixelmint/final-cta";
import { Footer } from "@/components/pixelmint/footer";

export default function HomePage() {
  return (
    <div className="pm-root">
      {/* Film grain over everything — subtle, pointer-transparent */}
      <div className="pm-grain" aria-hidden="true" />

      <SiteNav />

      <Hero />
      <Marquee />
      <Work />
      <Services />
      <About />
      <Testimonials />
      <FinalCta />

      <Footer />
    </div>
  );
}
