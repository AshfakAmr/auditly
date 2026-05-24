"use client";

import type { ComponentProps } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, Lock } from "lucide-react";

import { AuditProgressScreen } from "@/components/landing/audit-progress-screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  {
    number: "1",
    title: "Paste profile",
    description: "Any public Twitter or LinkedIn handle",
  },
  {
    number: "2",
    title: "AI analyzes",
    description: "Multi-step agent scans posting behavior",
  },
  {
    number: "3",
    title: "Get report",
    description: "Scored cards with actionable recommendations",
  },
];

export function LandingPage() {
  const router = useRouter();
  const [profileUrlOrHandle, setProfileUrlOrHandle] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (
    event,
  ) => {
    event.preventDefault();

    setSubmitError(null);
    setIsSubmitting(true);
    setActiveStepIndex(0);

    let didRedirect = false;

    const progressTimer = window.setInterval(() => {
      setActiveStepIndex((currentStep) => Math.min(currentStep + 1, 6));
    }, 1800);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profileUrlOrHandle,
          email,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        reportUrl?: string;
        message?: string;
      };

      if (!response.ok || !data.ok || !data.reportUrl) {
        throw new Error(data.message ?? "Could not create report.");
      }

      setActiveStepIndex(6);
      didRedirect = true;
      router.push(data.reportUrl);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the report.",
      );
    } finally {
      window.clearInterval(progressTimer);

      if (!didRedirect) {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitting) {
    return <AuditProgressScreen activeStepIndex={activeStepIndex} />;
  }

  return (
    <main className="min-h-dvh bg-[#1f1f1d] p-4 text-[#f4f2ea] md:h-dvh md:overflow-hidden md:p-5">
      <section className="mx-auto flex min-h-[calc(100dvh-32px)] w-full items-center justify-center md:h-full md:min-h-0">
        <div className="flex w-full items-center justify-center rounded-xl border border-[#4a4a45] bg-[#2d2d2a] px-5 py-10 shadow-[0_30px_120px_rgba(0,0,0,0.36)] md:h-full md:px-8 md:py-10">
          <div className="mx-auto flex w-full max-w-[620px] flex-col items-center text-center">
            <p className="mb-8 text-[14px] font-semibold uppercase tracking-[0.34em] text-[#c8c2b4]">
              Auditly
            </p>

            <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex h-9 items-center gap-2 rounded-full border border-[#5c5b54] bg-[#30302d] px-4 text-[14px] font-semibold text-[#f1ecdf]">
                <span className="text-[15px] leading-none">𝕏</span>
                Twitter / X
              </div>

              <div className="inline-flex h-9 items-center gap-2 rounded-full border border-[#5c5b54] bg-[#30302d] px-4 text-[14px] font-semibold text-[#f1ecdf]">
                <Lock className="size-4" />
                LinkedIn
              </div>
            </div>

            <h1 className="max-w-[600px] text-balance text-[36px] font-semibold leading-[1.18] tracking-[-0.035em] text-white sm:text-[44px] md:text-[48px]">
              Get a free AI audit of your social media content
            </h1>

            <p className="mt-6 max-w-[500px] text-balance text-[16px] font-medium leading-8 text-[#d9d3c4]">
              Paste any public Twitter or LinkedIn profile. Our AI agent
              analyzes your last 30 posts and returns a scored report in 60
              seconds.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-12 w-full max-w-[580px] space-y-5 text-left"
            >
              {submitError ? (
                <div className="mb-5 flex gap-3 rounded-lg border border-[#7a4d4d] bg-[#3a2929] p-4 text-left">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-[#ff8a8a]" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Could not generate report
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#f0b8b8]">
                      {submitError}
                    </p>
                  </div>
                </div>
              ) : null}
              <div>
                <label
                  htmlFor="profile"
                  className="mb-2 block text-[14px] font-semibold text-[#f2eddf]"
                >
                  Profile URL or handle
                </label>
                <Input
                  id="profile"
                  value={profileUrlOrHandle}
                  onChange={(event) =>
                    setProfileUrlOrHandle(event.target.value)
                  }
                  placeholder="e.g. twitter.com/sama or @sama"
                  className="h-12 rounded-lg border-[#5b5a52] bg-[#30302d] px-4 text-[16px] text-white shadow-none placeholder:text-[#aaa69a] focus-visible:ring-1 focus-visible:ring-[#827a6c]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[14px] font-semibold text-[#f2eddf]"
                >
                  Your email — we&apos;ll send you the report link
                </label>
                <Input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  className="h-12 rounded-lg border-[#5b5a52] bg-[#30302d] px-4 text-[16px] text-white shadow-none placeholder:text-[#aaa69a] focus-visible:ring-1 focus-visible:ring-[#827a6c]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 h-12 w-full rounded-lg border border-[#70695f] bg-[#302f2c] text-[15px] font-semibold text-white shadow-none hover:bg-[#3a3935]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Preparing audit
                  </>
                ) : (
                  <>
                    Analyze profile
                    <ArrowRight className="ml-2 size-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 flex max-w-[580px] items-center justify-center gap-2 text-center text-[13px] font-medium leading-5 text-[#c4beaf]">
              <Lock className="size-3.5 shrink-0" />
              <span>
                No login required. Public profiles only. Report link is private
                to you.
              </span>
            </div>

            <div className="my-9 h-px w-full max-w-[580px] bg-[#55544d]" />

            <div className="grid w-full max-w-[580px] grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-7">
              {steps.map((step) => (
                <div key={step.number} className="text-left">
                  <div className="mb-3 flex size-6 items-center justify-center rounded-full border border-[#626159] bg-[#30302d] text-[12px] font-semibold text-[#ded8c8]">
                    {step.number}
                  </div>

                  <h3 className="text-[15px] font-semibold leading-5 text-white">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-[13px] leading-5 text-[#c9c3b5]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
