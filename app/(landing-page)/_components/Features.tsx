import { CheckIcon } from "@heroicons/react/20/solid";

const features = [
  {
    name: "Board-style question bank",
    description:
      "Practice case-based, single-best-answer and multi-select questions that mirror real exams.",
  },
  {
    name: "Structured video & notes",
    description:
      "High-yield lessons with diagrams, mnemonics, and quick summaries you can revisit anytime.",
  },
  {
    name: "Adaptive quizzes",
    description:
      "Questions adjust to your performance so you spend time where it matters most.",
  },
  {
    name: "Clinically integrated",
    description:
      "Connect basic science to investigations, management, and guidelines to build decision-making.",
  },
  {
    name: "Progress analytics",
    description:
      "Track strengths, gaps, time on task, and improvement by system and topic.",
  },
  {
    name: "Learn anywhere",
    description:
      "Mobile-friendly experience with offline-friendly notes and spaced-repetition reminders.",
  },
];

export default function Features() {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-5">
          <div className="col-span-2">
            <h2 className="text-sm font-semibold text-primary">
              Everything you need
            </h2>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-pretty sm:text-5xl">
              All-in-one medical learning platform
            </p>
            <p className="mt-6 text-muted-foreground">
              Courses and quizzes designed by clinicians—so you can master the
              basics, build clinical reasoning, and ace the exams.
            </p>
          </div>

          <dl className="col-span-3 grid grid-cols-1 gap-x-8 gap-y-10 text-muted-foreground sm:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-9">
                <dt className="font-semibold text-foreground">
                  <CheckIcon
                    aria-hidden="true"
                    className="absolute left-0 top-1 size-5 text-primary"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-2">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
