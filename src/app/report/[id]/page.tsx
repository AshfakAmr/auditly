import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

type ReportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: {
      id,
    },
    include: {
      lead: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#1f1f1d] p-4 text-[#f4f2ea] md:p-5">
      <section className="mx-auto flex min-h-[calc(100dvh-32px)] w-full items-center justify-center md:min-h-[calc(100dvh-40px)]">
        <div className="w-full max-w-4xl rounded-xl border border-[#4a4a45] bg-[#2d2d2a] p-6 shadow-[0_30px_120px_rgba(0,0,0,0.36)] md:p-8">
          <div className="mb-8 flex flex-col gap-4 border-b border-[#55544d] pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#c8c2b4]">
                Auditly Report
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                @{report.profileHandle}
              </h1>
              <p className="mt-2 text-sm text-[#c9c3b5]">
                Platform: {report.platform} · Status: {report.status}
              </p>
            </div>

            <Link
              href="/"
              className="rounded-lg border border-[#70695f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3a3935]"
            >
              New audit
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#55544d] bg-[#30302d] p-5">
              <p className="text-sm text-[#c9c3b5]">Report ID</p>
              <p className="mt-2 break-all text-sm font-medium text-white">
                {report.id}
              </p>
            </div>

            <div className="rounded-xl border border-[#55544d] bg-[#30302d] p-5">
              <p className="text-sm text-[#c9c3b5]">Email</p>
              <p className="mt-2 break-all text-sm font-medium text-white">
                {report.lead.email}
              </p>
            </div>

            <div className="rounded-xl border border-[#55544d] bg-[#30302d] p-5">
              <p className="text-sm text-[#c9c3b5]">Created</p>
              <p className="mt-2 text-sm font-medium text-white">
                {report.createdAt.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#55544d] bg-[#30302d] p-6">
            <h2 className="text-xl font-semibold text-white">
              Report generation started
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#c9c3b5]">
              This page is now loading from the database using the persistent
              report ID. In the next step, we will connect the multi-step audit
              agent to fetch real posts, calculate metrics, call Gemini, and
              save the final scored report here.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
