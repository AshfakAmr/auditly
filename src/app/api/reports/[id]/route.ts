import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

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
    return NextResponse.json(
      {
        ok: false,
        message: "Report not found.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    report,
  });
}
