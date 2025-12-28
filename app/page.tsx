"use client";

import Link from "next/link";

export default function HomePage() {
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
        <Link
          href="/create"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg text-center"
        >
          Create Game
        </Link>
        <Link
          href="/join"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg text-center"
        >
          Join Game
        </Link>
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
