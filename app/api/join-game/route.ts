import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const { roomCode, username } = await request.json();

    if (!roomCode || !username) {
      return NextResponse.json(
        { error: "Room code and username are required" },
        { status: 400 },
      );
    }

    const inviteCode = roomCode.toUpperCase().trim();

    // Check if game exists
    const { data: gameData, error: gameError } = await supabaseServer
      .from("games")
      .select("id, status")
      .eq("invite_code", inviteCode)
      .single();

    if (gameError || !gameData) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (gameData.status !== "waiting") {
      return NextResponse.json(
        { error: "Game has already started or finished" },
        { status: 400 },
      );
    }

    // Add player to the game
    const { error: playerError } = await supabaseServer.from("players").insert([
      {
        game_id: gameData.id,
        room_id: inviteCode,
        username: username.trim(),
        is_host: false,
        is_ready: false,
      },
    ]);

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    return NextResponse.json(
      { inviteCode, gameId: gameData.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error joining game:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
