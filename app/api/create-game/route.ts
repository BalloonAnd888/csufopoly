// app/api/create-game/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/client";

const generateRoomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      );
    }

    const inviteCode = generateRoomCode();

    const { data: gameData, error: gameError } = await supabaseServer
      .from("games")
      .insert([
        {
          invite_code: inviteCode,
          status: "waiting",
        },
      ])
      .select("id, invite_code")
      .single();

    if (gameError) {
      return NextResponse.json({ error: gameError.message }, { status: 500 });
    }

    const { error: playerError } = await supabaseServer.from("players").insert([
      {
        game_id: gameData.id,
        room_id: inviteCode,
        username: username.trim(),
        is_host: true,
        is_ready: true,
      },
    ]);

    if (playerError) {
      return NextResponse.json({ error: playerError.message }, { status: 500 });
    }

    return NextResponse.json(
      { inviteCode: gameData.invite_code, gameId: gameData.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
