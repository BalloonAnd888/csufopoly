import Link from "next/link";

export default function JoinGamePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="text-center w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-4xl font-bold mb-4">Join a Game</h1>
        <p className="text-gray-400 mb-6">
          Enter a game code from your friend to join their lobby.
        </p>

        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Enter Game Code"
            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-center font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
            Join
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
