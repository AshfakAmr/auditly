import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function GET() {
  const reportCount = await prisma.report.count();

  return NextResponse.json({
    ok: true,
    database: "connected",
    reportCount,
  });
}
