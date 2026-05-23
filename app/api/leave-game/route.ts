import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const { playerId } = await request.json();

    if (!playerId) {
      return NextResponse.json(
        { error: "Player ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseServer
      .from("players")
      .delete()
      .eq("id", playerId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error leaving game:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
