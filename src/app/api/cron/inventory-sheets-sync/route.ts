import { NextResponse } from "next/server";

import { retryPendingInventorySheets } from "@/lib/inventory/sheets-sync";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const attempted = await retryPendingInventorySheets(adminDb(), 50);
  return NextResponse.json({ ok: true, attempted });
}
