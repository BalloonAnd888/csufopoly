"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabaseServer } from "@/lib/supabase/client";

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
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const currentPlayerId = players.find(
    (p) => p.username === currentUsername,
  )?.id;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  useEffect(() => {
    async function fetchPlayers() {
      if (!gameId) return;

      try {
        const response = await fetch(`/api/games/${gameId}/players`);
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

    if (!gameId) return;

    // Subscribe to real-time changes for this specific game's players
    const channel = supabaseServer
      .channel("realtime:players")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchPlayers();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchPlayers();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "players",
        },
        (payload) => {
          setPlayers((prevPlayers) =>
            prevPlayers.filter((player) => player.id !== payload.old.id),
          );
        },
      )
      .subscribe();

    return () => {
      supabaseServer.removeChannel(channel);
    };
  }, [gameId]);

  // Realtime Presence for tracking online users and handling tab closures
  useEffect(() => {
    if (!gameId || !currentPlayerId) return;

    const presenceChannel = supabaseServer.channel(`presence-${gameId}`, {
      config: {
        presence: {
          key: currentPlayerId,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "leave" }, ({ key }) => {
        setTimeout(() => {
          const state = presenceChannel.presenceState();
          // If they haven't reconnected after 5 seconds, they've actually left
          if (!Object.keys(state).includes(key)) {
            setPlayers((currentPlayers) => {
              const me = currentPlayers.find((p) => p.id === currentPlayerId);
              // If the current user is the host, clean up the player who disconnected
              if (me?.is_host && key !== currentPlayerId) {
                fetch(`/api/games/${gameId}/players`, {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ playerId: key }),
                });
              }
              return currentPlayers;
            });
          }
        }, 5000); // 5-second grace period for page refreshes
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ online: true });
        }
      });

    return () => {
      supabaseServer.removeChannel(presenceChannel);
    };
  }, [gameId, currentPlayerId]);

  const handleLeaveGame = async () => {
    if (currentPlayerId) {
      await fetch(`/api/games/${gameId}/players`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: currentPlayerId }),
      });
    }
    router.push("/");
  };

  const handleToggleReady = async () => {
    if (!currentPlayerId || !currentPlayer) return;

    setIsUpdating(true);
    try {
      const { error: updateError } = await supabaseServer
        .from("players")
        .update({ is_ready: !currentPlayer.is_ready })
        .eq("id", currentPlayerId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error("Error toggling ready state:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update ready state",
      );
    } finally {
      setIsUpdating(false);
    }
  };

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

        {currentPlayer && !currentPlayer.is_host && (
          <div className="mt-6">
            <button
              onClick={handleToggleReady}
              disabled={isUpdating}
              className={`w-full py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                currentPlayer.is_ready
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isUpdating
                ? "Updating..."
                : currentPlayer.is_ready
                  ? "Unready"
                  : "Ready"}
            </button>
          </div>
        )}

        <div>
          <button
            onClick={handleLeaveGame}
            className="mt-8 inline-block text-blue-400 hover:text-blue-300"
          >
            &larr; Back to Home
          </button>
        </div>
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
