"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [username, setUsername] = useState("");

  // Look for handleCreateGame in app/page.tsx and update it to look like this:

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/create-game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create game: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.inviteCode && data.gameId) {
        router.push(
          `/create?code=${data.inviteCode}&gameId=${data.gameId}&username=${encodeURIComponent(username.trim())}`,
        );
      }
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tighter mb-4">
          Monopoly Deal Online
        </h1>
        <p className="text-gray-400 mb-10">
          The online version of the classic fast-paced card game.
        </p>
      </div>

      <div className="flex flex-col space-y-4 w-full max-w-xs">
        <Input
          id="username"
          placeholder="Enter your username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full block">
                <button
                  onClick={handleCreateGame}
                  disabled={isCreating || !username.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:pointer-events-none text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg text-center"
                >
                  {isCreating ? "Creating..." : "Create Game"}
                </button>
              </span>
            </TooltipTrigger>
            {!username.trim() && (
              <TooltipContent>
                <p>Enter Username</p>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="w-full block">
                <button
                  onClick={() =>
                    router.push(
                      `/join?username=${encodeURIComponent(username.trim())}`,
                    )
                  }
                  disabled={!username.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 cursor-pointer disabled:pointer-events-none text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg text-center"
                >
                  Join Game
                </button>
              </span>
            </TooltipTrigger>
            {!username.trim() && (
              <TooltipContent>
                <p>Enter Username</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <Link
          href="/howToPlay"
          className="w-full bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg text-center"
        >
          How to Play
        </Link>
      </div>
    </main>
  );
}
