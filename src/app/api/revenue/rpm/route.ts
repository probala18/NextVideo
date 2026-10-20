import { NextRequest, NextResponse } from "next/server";
import { getAllRpmAssumptions, upsertRpmAssumption } from "@/lib/sync";
import { validateRpmAssumption } from "@/lib/revenue-calculator";
import { RpmAssumption } from "@/lib/types/revenue";

export async function GET() {
  try {
    const assumptions = await getAllRpmAssumptions();
    return NextResponse.json({
      count: assumptions.length,
      assumptions,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to retrieve RPM assumptions" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const rpm: Omit<RpmAssumption, "id"> = {
      category: String(body.category || "").toLowerCase().trim(),
      region: String(body.region || "").toUpperCase().trim(),
      format: (body.format || "long-form") as any,
      currency: String(body.currency || "USD").toUpperCase().trim(),
      rpm_low: Number(body.rpm_low),
      rpm_typical: Number(body.rpm_typical),
      rpm_high: Number(body.rpm_high),
      source_name: String(body.source_name || "Operator-provided").trim(),
      source_url: String(body.source_url || "").trim(),
      effective_date: String(body.effective_date || new Date().toISOString().slice(0, 10)),
      confidence: (body.confidence || "illustrative") as any,
      notes: body.notes ? String(body.notes).trim() : null,
    };

    if (!rpm.category || !rpm.region) {
      return NextResponse.json(
        { error: "Fields 'category' and 'region' are required." },
        { status: 400 }
      );
    }

    validateRpmAssumption(rpm as any);

    await upsertRpmAssumption(rpm);

    return NextResponse.json({
      success: true,
      message: `RPM assumption for ${rpm.category} in ${rpm.region} (${rpm.format}) saved.`,
      assumption: rpm,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update RPM assumption" },
      { status: 400 }
    );
  }
}
