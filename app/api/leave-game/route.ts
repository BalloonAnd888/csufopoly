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

    const { error: deleteError } = await supabaseServer
      .from("players")
      .delete()
      .eq("id", playerId);

    if (deleteError) {
      console.error("Supabase player delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in leave-game:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
