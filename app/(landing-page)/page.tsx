import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import Features from "./_components/Features"; // adjust path if needed
import FaqSection from "./_components/FaqSection";
import Footer from "./_components/Footer";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      <main>
        <div className="relative isolate">
          {/* Background grid / shapes */}
          <svg
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-border/50 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
          >
            <defs>
              <pattern
                id="grid"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
                x="50%"
                y={-1}
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-muted">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect
              fill="url(#grid)"
              width="100%"
              height="100%"
              strokeWidth={0}
            />
          </svg>

          <div
            aria-hidden="true"
            className="absolute top-0 right-0 left-1/2 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
          >
            <div
              className="aspect-[801/1036] w-[50.0625rem] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
              }}
            />
          </div>

          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pt-28 pb-32 sm:pt-36 lg:px-8 lg:pt-28">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-pretty text-5xl font-semibold tracking-tight sm:text-7xl">
                    Master the basics. Ace the exams. Treat the patient
                  </h1>
                  <p className="mt-8 text-pretty text-lg font-medium text-muted-foreground sm:max-w-md sm:text-xl/8 lg:max-w-none">
                    Interactive courses and exam-style quizzes built by
                    clinicians. Learn faster, check your understanding, and
                    track your progress from pre-clinical to clinical years.
                  </p>
                  <div className="mt-10 flex items-center gap-x-6">
                    <Link
                      href="/courses"
                      className={buttonVariants({ size: "lg" })}
                    >
                      Get started with courses
                    </Link>
                    <Link href="/quizzes" className="text-sm font-semibold">
                      Or with Quizzes <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>

                <div className="mt-14 flex justify-end gap-8 sm:-mt-24 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-64 lg:order-last lg:pt-36 xl:order-none xl:pt-64">
                    <ImageCard src="/photo1.jpg" />
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <ImageCard src="/photo2.jpg" />
                    <ImageCard src="/photo3.jpg" />
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <ImageCard src="/photo4.jpg" />
                    <ImageCard src="/photo5.jpg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Features />
        <FaqSection />
        <Footer />
      </main>
    </div>
  );
}

function ImageCard({ src }: { src: string }) {
  return (
    <div className="relative">
      <img
        alt=""
        src={src}
        className="aspect-[2/3] w-full rounded-xl bg-muted object-cover shadow-lg"
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-border/60" />
    </div>
  );
}
