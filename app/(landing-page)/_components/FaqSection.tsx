import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { MinusSmallIcon, PlusSmallIcon } from "@heroicons/react/24/outline";

const faqs = [
  {
    question: "What is Med Academy?",
    answer:
      "Med Academy is an online learning platform designed for medical students. We provide high-quality courses, lectures, and study resources to help you succeed in your medical studies and exams.",
  },
  {
    question: "Who can use the platform?",
    answer:
      "Our platform is mainly for medical students and teachers, but anyone interested in medical sciences are welcome to join.",
  },
  {
    question: "How do I register?",
    answer:
      "Simply click on the Sign In button and create an account. Once registered, you can browse free and paid courses.",
  },
  {
    question: "Are the courses free?",
    answer:
      "We offer a mix of free and paid courses. Free courses are accessible to everyone after registration. Paid courses require a one-time payment.",
  },
  {
    question: "How do I pay for a course?",
    answer:
      "You can pay online using Dahabia or CIB. After payment, you get instant access to the course materials.",
  },
  {
    question: "What do I get after enrolling in a course?",
    answer:
      "You get full access to: Video lectures, Downloadable resources (PDFs, notes, presentations), Practice quizzes and exam simulations.",
  },
  {
    question: "Can I access my courses anytime?",
    answer:
      "Yes! Once enrolled, you can access your courses 24/7 from any device (computer, tablet, or smartphone).",
  },
  {
    question: "Can I cancel or get a refund?",
    answer:
      "Refunds depend on the course type and our refund policy. If you face a technical issue or purchased by mistake, please contact our support within 2 days for assistance.",
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
