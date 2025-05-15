import { NextResponse } from "next/server";

// GET /api/rule/[id]/history
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const apiVersion = process.env.FB_API_VERSION;
  if (!accessToken || !apiVersion) {
    return NextResponse.json(
      { error: "Missing FB_ACCESS_TOKEN or FB_API_VERSION" },
      { status: 500 }
    );
  }

  const { id } = params;
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${id}/history`);
  url.searchParams.set("access_token", accessToken);
  // propagate any supported filters
  const { searchParams } = request.url ? new URL(request.url) : { searchParams: new URLSearchParams() };
  ["object_id", "action", "hide_no_changes"].forEach((filter) => {
    const val = searchParams.get(filter);
    if (val) url.searchParams.set(filter, val);
  });

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const err = await resp.json().catch(() => null);
    return NextResponse.json({ error: "FB API error", details: err }, { status: resp.status });
  }

  const data = await resp.json();
  return NextResponse.json(data);
}
