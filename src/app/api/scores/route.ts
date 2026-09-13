import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/scores — top 10 best scores (lowest total strokes first)
export async function GET() {
  try {
    const scores = await db.score.findMany({
      orderBy: [{ diff: "asc" }, { totalStrokes: "asc" }, { createdAt: "desc" }],
      take: 10,
    });
    return NextResponse.json({ scores });
  } catch (err) {
    console.error("Failed to fetch scores:", err);
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    );
  }
}

// POST /api/scores — submit a completed game's score
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerName, totalStrokes, par, holeStrokes, holesPlayed } = body ?? {};

    if (
      typeof totalStrokes !== "number" ||
      typeof par !== "number" ||
      !Array.isArray(holeStrokes) ||
      typeof holesPlayed !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid score payload" },
        { status: 400 }
      );
    }

    const diff = totalStrokes - par;
    const name =
      typeof playerName === "string" && playerName.trim()
        ? playerName.trim().slice(0, 20)
        : "Anonymous";

    const created = await db.score.create({
      data: {
        playerName: name,
        totalStrokes,
        par,
        diff,
        holeStrokes: JSON.stringify(holeStrokes),
        holesPlayed,
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("Failed to save score:", err);
    return NextResponse.json(
      { error: "Failed to save score" },
      { status: 500 }
    );
  }
}
