import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';

const pricingTiers = [
  {
    name: "Growth Pilot",
    price: "$490",
    period: "per month",
    description: "Ideal for fast-growing engineering teams hiring for specific key technical roles.",
    features: [
      "Up to 50 completed interviews / mo",
      "Standard software engineering rubrics",
      "1-Minute Executive Summaries & PDF exports",
      "Zero Biometric Retention guarantee",
      "Web speech & browser audio inputs",
    ],
    ctaText: "Start Pilot Assessment",
    ctaLink: "/gateway",
    highlighted: false,
  },
  {
    name: "Enterprise Copilot",
    price: "$1,850",
    period: "per month",
    description: "High-volume technical hiring pipeline with full ATS integration and custom rubrics.",
    features: [
      "Up to 250 completed interviews / mo",
      "Custom company rubrics & role calibration",
      "Native Greenhouse, Lever & Workday sync",
      "EEOC & NYC Local Law 144 audit dossiers",
      "Dedicated candidate prep & support",
    ],
    ctaText: "Book an Enterprise Demo",
    ctaLink: "/gateway",
    highlighted: true,
  },
  {
    name: "Global Scale",
    price: "Custom",
    period: "annual commitment",
    description: "Multi-department enterprise organizations requiring dedicated infrastructure.",
    features: [
      "Unlimited candidate evaluations",
      "Private cloud / VPC deployment option",
      "Custom SAML SSO & RBAC admin access",
      "Automated 30/60/90-day GDPR purge policies",
      "24/7 SLA & dedicated solutions partner",
    ],
    ctaText: "Contact Enterprise Sales",
    ctaLink: "/contact",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-24 md:px-10 z-10 relative bg-[var(--color-bg-0)] scroll-mt-24">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Transparent Investment</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl text-white">
            Predictable plans for every hiring scale.
          </h2>
          <p className="mt-4 text-sm md:text-base text-white/65 leading-relaxed">
            No seat license taxes for hiring managers. Scale candidate assessment throughput with deterministic rubric evaluations and native ATS synchronization.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 items-stretch">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-[32px] p-8 flex flex-col justify-between backdrop-blur-xl transition-all duration-300 ${
                tier.highlighted
                  ? "border-2 border-[var(--color-secondary)]/50 bg-slate-900/80 shadow-[0_0_50px_rgba(124,147,255,0.15)] ring-1 ring-[var(--color-secondary)]/30"
                  : "border border-white/10 bg-slate-900/50 hover:border-white/20"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-[var(--color-secondary)] px-4 py-1 text-xs font-semibold text-black uppercase tracking-wider shadow-md">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white tracking-tight">{tier.name}</h3>
                  <p className="mt-2 text-xs text-white/60 leading-relaxed min-h-[36px]">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-8 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-white">{tier.price}</span>
                  <span className="text-xs text-white/50">{tier.period}</span>
                </div>

                <ul className="space-y-3.5 text-sm text-white/75">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-emerald-400" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10">
                <Link
                  to={tier.ctaLink}
                  className={`w-full inline-flex items-center justify-center rounded-full py-3 px-6 text-sm font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-white text-zinc-950 hover:bg-white/90 shadow-lg hover:shadow-xl"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {tier.ctaText}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
