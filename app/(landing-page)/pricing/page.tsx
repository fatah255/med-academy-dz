"use client";

import * as React from "react";
import { CheckIcon } from "@heroicons/react/20/solid";
import { createOfferCheckoutAction, createAICheckoutAction } from "./actions";

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

// 2 months free on yearly
const YEARLY_CHARGE_MONTHS = 10;

// base monthly by plan and year
function baseMonthly(plan: "without-ai" | "with-ai", year: number) {
  if (plan === "without-ai") return year > 1 ? 29.9 : 34.9;
  return year > 1 ? 149 : 199;
}
function priceText(
  plan: "without-ai" | "with-ai",
  billing: Billing,
  year: number
) {
  const base = baseMonthly(plan, year);
  if (billing === "monthly") return `${base} DZD`;
  if (plan === "with-ai") return year > 1 ? 999 : 1499;
  return `${base * YEARLY_CHARGE_MONTHS} DZD`;
}

export default function PricingPage() {
  const [billing, setBilling] = React.useState<Billing>("monthly");
  const [year, setYear] = React.useState<number>(1);
  const [submitting, setSubmitting] = React.useState<
    null | "without-ai" | "with-ai"
  >(null);

  // prices/suffix
  const suffixWithAi = billing === "monthly" ? "/month" : "/year";
  const priceWithAi = priceText("with-ai", billing, year);
  const priceWithoutAi = priceText("without-ai", "yearly", year); // yearly only

  // render list of cards: if monthly → ONLY with-ai. if yearly → both.
  const showWithoutAi = billing === "yearly";
  const gridClass = showWithoutAi
    ? "mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-6 lg:mx-0 lg:max-w-none lg:grid-cols-2"
    : "mx-auto mt-10 grid max-w-xl grid-cols-1 gap-6"; // one card centered

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
            Choose billing for AI plan and your current study year.
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
            <p className="mt-2 text-center text-xs text-muted-foreground">
              When <span className="font-medium">Monthly</span> is selected,
              only the <span className="font-medium">With AI</span> plan is
              available. “Without AI” is{" "}
              <span className="font-medium">yearly only</span>.
            </p>
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
        <div className={gridClass}>
          {/* WITHOUT AI — render ONLY if yearly is selected */}
          {showWithoutAi && (
            <PlanCard
              id="without-ai"
              name="Without AI"
              featured={false}
              price={String(priceWithoutAi)}
              suffix="/year"
              features={[
                "unlimited notes",
                "access for all questions of previous years classed by course",
                "access  for all exams of previous years claessed by year",
                "Saved progress & bookmarking",
                "Community & updates",
                "Email support",
              ]}
            >
              <form
                action={createOfferCheckoutAction}
                onSubmit={() => setSubmitting("without-ai")}
              >
                {/* Hard-code YEARLY to backend */}
                <input type="hidden" name="billing" value="yearly" />
                <input type="hidden" name="year" value={year} />
                <button
                  type="submit"
                  className={cx(
                    "mt-6 block w-full rounded-md bg-muted px-3 py-2 text-center text-sm font-semibold text-foreground hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  disabled={submitting !== null}
                >
                  {submitting === "without-ai" ? "Processing…" : "Choose plan"}
                </button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                Yearly plan only.
              </p>
            </PlanCard>
          )}

          {/* WITH AI — always visible */}
          <PlanCard
            id="with-ai"
            name="With AI"
            featured
            price={String(priceWithAi)}
            suffix={suffixWithAi}
            features={[
              "Access for ALL the quizzes",
              "Access for ALL the exams",
              "Unlimited notes",
              "Saved progress & bookmarking",
              "unlimited PDF and Photo uploads",
              "AI QCM generator",
              "AI PDF chat & mind maps",
              "Image understanding (diagrams, slides)",
              "Priority support",
            ]}
          >
            <form
              action={createAICheckoutAction}
              onSubmit={() => setSubmitting("with-ai")}
            >
              <input type="hidden" name="billing" value={billing} />
              <input type="hidden" name="year" value={year} />
              <button
                type="submit"
                className={cx(
                  "mt-6 block w-full rounded-md bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                disabled={submitting !== null}
              >
                {submitting === "with-ai" ? "Processing…" : "Go with AI"}
              </button>
            </form>
          </PlanCard>
        </div>

        {/* Footnote */}
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted-foreground">
          Yearly price shown as total billed per year (2 months free). Change{" "}
          <span className="font-medium">year</span> to attach the plan to your
          level during checkout.
        </p>
      </div>
    </section>
  );
}

/* ---------------- UI ---------------- */

function PlanCard(props: {
  id: "without-ai" | "with-ai";
  name: string;
  featured?: boolean;
  price: string;
  suffix: string;
  features: string[];
  children: React.ReactNode;
}) {
  const { featured, name, price, suffix, features, children } = props;
  return (
    <div
      className={cx(
        "relative rounded-3xl border p-8 shadow-sm xl:p-10",
        featured ? "border-primary/60 ring-1 ring-primary/30" : "border-border"
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-6 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow">
          Most popular
        </div>
      )}

      <h3 className="text-lg font-semibold text-foreground">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {featured
          ? "Everything in Without AI, plus AI study tools to move faster & deeper."
          : "Core Med Academy access: courses, notes, QCM, updates, and community."}
      </p>

      <div className="mt-6 flex items-end gap-2">
        <div className="text-4xl font-bold text-foreground">{price}</div>
        <div className="pb-1 text-sm font-medium text-muted-foreground">
          {suffix}
        </div>
      </div>

      {children}

      <ul className="mt-8 space-y-3 text-sm text-muted-foreground xl:mt-10">
        {features.map((f) => (
          <li key={f} className="flex gap-3">
            <CheckIcon
              aria-hidden="true"
              className={cx(
                "h-5 w-5 flex-none",
                featured ? "text-primary" : "text-primary/80"
              )}
            />
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
