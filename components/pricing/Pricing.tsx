// File: app/(marketing)/pricing/page.tsx
"use client";

import React from "react";
import { CheckIcon } from "@heroicons/react/20/solid";

type Billing = "monthly" | "yearly";

const YEARS = [
  { value: 1, label: "1st year" },
  { value: 2, label: "2nd year" },
  { value: 3, label: "3rd year" },
  { value: 4, label: "4th year" },
  { value: 5, label: "5th year" },
  { value: 6, label: "6th year" },
];

const BILLING: { value: Billing; label: string; suffix: string }[] = [
  { value: "monthly", label: "Monthly", suffix: "/month" },
  { value: "yearly", label: "Yearly", suffix: "/year" },
];

// If you want "2 months free" yearly billing, charge for 10 months:
const YEARLY_CHARGE_MONTHS = 10;

const PLANS = [
  {
    id: "without-ai",
    name: "Without AI",
    featured: false,
    cta: "Choose plan",
    features: [
      "All non-AI courses & notes",
      "QCM practice sets",
      "Saved progress & bookmarking",
      "Community & updates",
      "Email support",
    ],
  },
  {
    id: "with-ai",
    name: "With AI",
    featured: true,
    cta: "Go with AI",
    features: [
      "Everything in Without AI",
      "AI QCM generator",
      "AI PDF chat & mind maps",
      "Image understanding (diagrams, slides)",
      "Priority support",
    ],
  },
] as const;

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Price rules you gave (DZD), depending on selected year:
function baseMonthlyFor(planId: (typeof PLANS)[number]["id"], year: number) {
  if (planId === "without-ai") return year > 1 ? 99 : 149; // DZD
  // with-ai
  return year > 1 ? 149 : 199; // DZD
}

function priceText(baseMonthly: number, billing: Billing) {
  if (billing === "monthly") return `${baseMonthly} DZD`;
  const yearly = baseMonthly * YEARLY_CHARGE_MONTHS; // 2 months free
  return `${yearly} DZD`;
}

// Map selected year → your Level enum used by createOfferCheckout
function levelFromYear(v: number) {
  switch (v) {
    case 1:
      return "FIRST_YEAR";
    case 2:
      return "SECOND_YEAR";
    case 3:
      return "THIRD_YEAR";
    case 4:
      return "FOURTH_YEAR";
    case 5:
      return "FIFTH_YEAR";
    case 6:
      return "SIXTH_YEAR";
    default:
      return "FIRST_YEAR";
  }
}

export default function PricingPage() {
  const [billing, setBilling] = React.useState<Billing>("monthly");
  const [year, setYear] = React.useState<number>(1);
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);

  const suffix = billing === "monthly" ? BILLING[0].suffix : BILLING[1].suffix;

  async function handleCheckout(planId: (typeof PLANS)[number]["id"]) {
    try {
      setLoadingPlan(planId);

      if (planId === "with-ai") {
        // Create AI checkout (expects a JSON { checkoutUrl })
        const res = await fetch("/api/checkout/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billing }), // "monthly" | "yearly"
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `Failed to create AI checkout (${res.status}). ${txt || ""}`
          );
        }
        const data = (await res.json()) as { checkoutUrl?: string };
        if (!data.checkoutUrl) throw new Error("No checkoutUrl returned.");
        window.location.href = data.checkoutUrl;
        return;
      }

      // Without AI → Offer checkout by level (expects { checkoutUrl })
      const level = levelFromYear(year);
      const res = await fetch("/api/checkout/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(
          `Failed to create offer checkout (${res.status}). ${txt || ""}`
        );
      }
      const data = (await res.json()) as { checkoutUrl?: string };
      if (!data.checkoutUrl) throw new Error("No checkoutUrl returned.");
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      alert(e?.message || "Could not start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-primary/70">Pricing</p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple plans for every year
          </h1>
          <p className="mt-4 text-pretty text-muted-foreground">
            Pick monthly or yearly billing, and choose your current study year.
          </p>
        </div>

        {/* Controls */}
        <div className="mt-10 flex flex-col items-center gap-4">
          {/* Billing toggle */}
          <fieldset aria-label="Billing frequency" className="w-full max-w-md">
            <div className="grid grid-cols-2 gap-1 rounded-full border border-border p-1 text-center text-xs font-semibold">
              {BILLING.map((opt) => {
                const active = billing === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setBilling(opt.value)}
                    className={cx(
                      "rounded-full px-3 py-1 transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Year selector */}
          <fieldset aria-label="Study year" className="w-full max-w-2xl">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {YEARS.map((y) => {
                const active = year === y.value;
                return (
                  <button
                    type="button"
                    key={y.value}
                    onClick={() => setYear(y.value)}
                    className={cx(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {y.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Cards */}
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {PLANS.map((plan) => {
            const baseMonthly = baseMonthlyFor(plan.id, year);
            const price = priceText(baseMonthly, billing);
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={cx(
                  "relative rounded-3xl border p-8 shadow-sm xl:p-10",
                  plan.featured
                    ? "border-primary/60 ring-1 ring-primary/30"
                    : "border-border"
                )}
              >
                {/* Badge for featured */}
                {plan.featured && (
                  <div className="absolute -top-3 left-6 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow">
                    Most popular
                  </div>
                )}

                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.featured
                    ? "Everything in Without AI, plus AI study tools to move faster & deeper."
                    : "Core Med Academy access: courses, notes, QCM, updates, and community."}
                </p>

                <div className="mt-6 flex items-end gap-2">
                  <div className="text-4xl font-bold text-foreground">
                    {price}
                  </div>
                  <div className="pb-1 text-sm font-medium text-muted-foreground">
                    {suffix}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleCheckout(plan.id)}
                  className={cx(
                    "mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
                      : "bg-muted text-foreground hover:bg-muted/80 disabled:opacity-70"
                  )}
                >
                  {isLoading ? "Starting checkout…" : plan.cta}
                </button>

                <ul className="mt-8 space-y-3 text-sm text-muted-foreground xl:mt-10">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <CheckIcon
                        aria-hidden="true"
                        className={cx(
                          "h-5 w-5 flex-none",
                          plan.featured ? "text-primary" : "text-primary/80"
                        )}
                      />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Tiny footnote for yearly math */}
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted-foreground">
          Yearly price shown as total billed per year (2 months free). Change{" "}
          <span className="font-medium">year</span> to attach the plan to your
          current study year during checkout.
        </p>
      </div>
    </section>
  );
}
