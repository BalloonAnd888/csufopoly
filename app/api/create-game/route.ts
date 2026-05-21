// app/api/create-game/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!; // Use service role for backend insertion
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const generateRoomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export async function POST() {
  const inviteCode = generateRoomCode();

  // Insert the new game into the games table
  const { data, error } = await supabase
    .from("games")
    .insert([
      {
        invite_code: inviteCode,
        status: "waiting",
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inviteCode: data.invite_code }, { status: 200 });
}
