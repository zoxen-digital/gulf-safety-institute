import { NextResponse } from "next/server";
import { AuthError, assertUser } from "@/lib/auth";
import { escapeRegex, traineeScope } from "@/lib/admin";
import { connectDb } from "@/lib/db";
import { Trainee } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const u = await assertUser("trainees.view");
    await connectDb();
    const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 60);
    if (q.length < 2) return NextResponse.json({ results: [] });
    const r = { $regex: escapeRegex(q), $options: "i" };
    const list = await Trainee.find({ $and: [await traineeScope(u), { $or: [{ fullName: r }, { idNumber: r }] }] })
      .select("fullName idNumber company")
      .limit(15)
      .lean();
    return NextResponse.json(
      { results: list.map((t) => ({ id: String(t._id), fullName: t.fullName, idNumber: t.idNumber, company: t.company })) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
