import Link from "next/link";

export default function CreateGamePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-4xl font-bold mb-4">Create Game Lobby</h1>
        <p className="text-gray-400 mb-6">
          This is where game settings (like properties to win) and the player
          list will be displayed.
        </p>

        {/* Placeholder for settings and player list */}
        <div className="text-left bg-gray-900 p-4 rounded-lg">
          <p>
            Game Code:{" "}
            <span className="font-mono bg-gray-700 p-1 rounded">XYZ123</span>
          </p>
          <p>Players: You</p>
          <p>Properties to Win: 3</p>
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
