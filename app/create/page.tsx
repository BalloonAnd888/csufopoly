"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface Player {
  id: string;
  username: string;
  is_host: boolean;
  is_ready: boolean;
  avatar_url: string | null;
}

function CreateGameContent() {
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("code") || "Loading...";
  const gameId = searchParams.get("gameId");
  const currentUsername = searchParams.get("username");

  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPlayers() {
      if (!gameId) return;

      try {
        const response = await fetch(`/api/get-players?gameId=${gameId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch players");
        }

        setPlayers(data.players || []);
      } catch (err) {
        console.error("Error fetching players:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlayers();
  }, [gameId]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-4xl font-bold mb-4">Create Game Lobby</h1>
        <p className="text-gray-400 mb-6">
          This is where game settings (like properties to win) and the player
          list will be displayed.
        </p>

        <div className="text-left bg-gray-900 p-4 rounded-lg">
          <p className="mb-4">
            Game Code:{" "}
            <span className="font-mono bg-gray-700 p-1 rounded">
              {roomCode}
            </span>
          </p>

          <h2 className="text-xl font-semibold mb-2 border-b border-gray-700 pb-2">
            Players
          </h2>
          {isLoading ? (
            <p className="text-gray-400">Loading players...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : players.length === 0 ? (
            <p className="text-gray-400">No players yet.</p>
          ) : (
            <ul className="space-y-2">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex justify-between items-center bg-gray-800 p-2 rounded"
                >
                  <span className="font-medium">
                    {player.username}
                    {currentUsername === player.username && (
                      <span className="ml-2 text-xs bg-purple-600 px-2 py-1 rounded-full">
                        You
                      </span>
                    )}
                    {player.is_host && (
                      <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded-full">
                        Host
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${player.is_ready ? "bg-green-600" : "bg-yellow-600"}`}
                  >
                    {player.is_ready ? "Ready" : "Not Ready"}
                  </span>
                </li>
              ))}
            </ul>
          )}
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

export default function CreateGamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <CreateGameContent />
    </Suspense>
  );
}
