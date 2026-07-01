import { NextRequest, NextResponse } from "next/server";
import { getLocation, updateLocation } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const location = getLocation(id);
  if (!location) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(location);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const location = getLocation(id);
  if (!location) return NextResponse.json({ error: "not found" }, { status: 404 });
  const fields = await req.json();
  try {
    return NextResponse.json(updateLocation(location.id, fields));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
