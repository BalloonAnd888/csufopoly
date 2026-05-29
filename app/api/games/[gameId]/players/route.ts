import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 },
      );
    }

    const { data: players, error } = await supabaseServer
      .from("players")
      .select("id, username, is_host, is_ready, avatar_url")
      .eq("game_id", gameId)
      .order("joined_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ players }, { status: 200 });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    const { playerId, isReady } = await request.json();

    if (!playerId || typeof isReady !== "boolean") {
      return NextResponse.json(
        { error: "Player ID and isReady status are required" },
        { status: 400 },
      );
    }

    const { data, error: updateError } = await supabaseServer
      .from("players")
      .update({ is_ready: isReady })
      .eq("id", playerId)
      .eq("game_id", gameId)
      .select();

    if (updateError) {
      console.error("Supabase player update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error(
        "Update affected 0 rows. Check RLS policies or if player exists.",
      );
      return NextResponse.json(
        { error: "Failed to update player (RLS blocked or not found)" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, isReady }, { status: 200 });
  } catch (error) {
    console.error("Error updating player status:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  try {
    const { gameId } = await params;
    // Extract the roomCode assuming /api/games/{roomCode}/players was hit
    const inviteCode = gameId.toUpperCase().trim();
    const { username } = await request.json();

    if (!inviteCode || !username) {
      return NextResponse.json(
        { error: "Room code and username are required" },
        { status: 400 },
      );
    }

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
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
