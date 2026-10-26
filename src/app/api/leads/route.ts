import { NextResponse } from "next/server";
import { findLeads } from "@/lib/places";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || typeof b.businessType !== "string" || typeof b.city !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (!process.env.GOOGLE_API_KEY) {
    return NextResponse.json({ error: "API key missing" }, { status: 500 });
  }

  try {
    const leads = await findLeads({
      businessType: b.businessType.slice(0, 60),
      city: b.city.slice(0, 60),
      area: typeof b.area === "string" ? b.area.slice(0, 60) : "",
      minRating: Number(b.minRating) || 0,
      maxRating: Number(b.maxRating) || 5,
      minReviews: Number(b.minReviews) || 0,
      noWebsiteOnly: Boolean(b.noWebsiteOnly),
    });
    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}