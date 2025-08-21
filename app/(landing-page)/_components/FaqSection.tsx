import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusSmallIcon, PlusSmallIcon } from "@heroicons/react/24/outline";

const faqs = [
  {
    question: "What makes Med Academy different?",
    answer:
      "Our courses and board-style quizzes are written and reviewed by clinicians. Content is concise, clinically integrated, and focused on what shows up in exams and on the wards.",
  },
  {
    question: "What quiz formats do you support?",
    answer:
      "Single-best-answer (SBA), multi-select (select all that apply), and timed/untimed practice. Every question includes a clear explanation to reinforce the concept.",
  },
  {
    question: "How is my progress tracked?",
    answer:
      "You’ll see accuracy and time on task by system and topic, plus trends over time. This helps you identify strengths and gaps so you can study smarter.",
  },
  {
    question: "Is there free content?",
    answer:
      "Yes. You can try sample quizzes and preview lessons before enrolling in full courses.",
  },
  {
    question: "Will my quiz results be saved?",
    answer:
      "Yes—your attempts and statistics are saved on your device so you can review them on the Statistics page even after you leave the quiz.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Absolutely. Med Academy is mobile-friendly and works on all modern browsers.",
  },
  {
    question: "Can I request new topics?",
    answer:
      "We’d love to hear from you. Send requests from the feedback link—high-demand topics are prioritized.",
  },
];

export default function FaqSection() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Frequently asked questions
          </h2>

          <dl className="mt-16 divide-y divide-border">
            {faqs.map((faq) => (
              <Disclosure
                key={faq.question}
                as="div"
                className="py-6 first:pt-0 last:pb-0"
              >
                <dt>
                  <DisclosureButton className="group flex w-full items-start justify-between text-left">
                    <span className="text-base font-semibold">
                      {faq.question}
                    </span>
                    <span className="ml-6 flex h-7 items-center">
                      {/* show + when closed, − when open */}
                      <PlusSmallIcon
                        aria-hidden="true"
                        className="size-6 group-data-[open]:hidden"
                      />
                      <MinusSmallIcon
                        aria-hidden="true"
                        className="size-6 hidden group-data-[open]:block"
                      />
                    </span>
                  </DisclosureButton>
                </dt>
                <DisclosurePanel as="dd" className="mt-2 pr-12">
                  <p className="text-base text-muted-foreground">
                    {faq.answer}
                  </p>
                </DisclosurePanel>
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
