"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function JoinGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsername = searchParams.get("username") || "";

  const [username, setUsername] = useState(initialUsername);
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");
    if (!roomCode.trim() || !username.trim()) {
      setError("Please enter a username and game code.");
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch("/api/join-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomCode: roomCode.trim().toUpperCase(),
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join game");
      }

      if (data.inviteCode && data.gameId) {
        router.push(
          `/create?code=${data.inviteCode}&gameId=${data.gameId}&username=${encodeURIComponent(username.trim())}`,
        );
      }
    } catch (err) {
      console.error("Failed to join game:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-4xl font-bold mb-4">Join a Game</h1>
        <p className="text-gray-400 mb-6">
          Enter a game code from your friend to join their lobby.
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Enter Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Enter Game Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-center font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoin}
            disabled={isJoining || !roomCode.trim() || !username.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? "Joining..." : "Join"}
          </button>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block text-blue-400 hover:text-blue-300"
        >
          &larr; Back to Home
        </Link>
      </div>
    </main>
  );
}

export default function JoinGamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <JoinGameContent />
    </Suspense>
  );
}
