import { Boxes, Clapperboard, Fingerprint, MonitorSmartphone } from "lucide-react";
import { Reveal } from "./reveal";

const SERVICES = [
  {
    index: "01",
    icon: Fingerprint,
    title: "Brand identities",
    text: "Naming, logo systems, and a voice engineered to stick in people’s heads — built to flex across every touchpoint.",
  },
  {
    index: "02",
    icon: MonitorSmartphone,
    title: "High-converting websites",
    text: "Expressive marketing sites that load in a blink, rank well, and turn curious scrollers into customers.",
  },
  {
    index: "03",
    icon: Boxes,
    title: "Digital products",
    text: "Apps, dashboards, and platforms designed like products, not projects — from first wireframe to shipped build.",
  },
  {
    index: "04",
    icon: Clapperboard,
    title: "Motion & launch campaigns",
    text: "Launch films, product explainers, and loops worth rewatching. Made to stop the scroll.",
  },
];

export function Services() {
  return (
    <section
      id="services"
      aria-labelledby="pm-services-heading"
      className="relative scroll-mt-24 overflow-x-clip border-t border-white/[0.07] py-24 md:py-36"
    >
      <div
        className="pointer-events-none absolute right-0 top-24 h-[20rem] w-[24rem] rounded-full bg-[#D6FF4B]/[0.04] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-10">
        <Reveal className="max-w-3xl">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-pm-mint">
            <span className="h-1.5 w-1.5 bg-pm-mint" aria-hidden="true" />
            What we mint
          </p>
          <h2
            id="pm-services-heading"
            className="mt-5 font-display text-[clamp(2.4rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-pm-paper"
          >
            From first pixel
            <br />
            to full launch.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-pm-mute md:text-lg">
            Pixel-perfect, never personality-free. Four disciplines, one
            obsessive standard — whatever we ship has to earn its place on the
            internet.
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 md:mt-20 lg:grid-cols-4">
          {SERVICES.map((service, i) => (
            <Reveal
              key={service.index}
              as="li"
              delay={0.07 * i}
              className="pm-service-card group rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-pm-mint/35 hover:bg-white/[0.035]"
            >
              <div className="relative flex h-full flex-col">
                <div className="flex items-start justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0D1211] text-pm-mint transition-all duration-500 group-hover:border-pm-mint/40 group-hover:shadow-[0_0_24px_rgb(103_245_180/0.2)]">
                    <service.icon size={21} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span
                    className="pm-outline select-none font-display text-3xl font-bold"
                    aria-hidden="true"
                  >
                    {service.index}
                  </span>
                </div>
                <h3 className="mt-7 font-display text-xl font-bold tracking-tight text-pm-paper">
                  {service.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-pm-mute">
                  {service.text}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
