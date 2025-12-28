import Link from "next/link";

export default function HowToPlayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <div className="w-full max-w-2xl p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <h1 className="text-4xl font-bold mb-6 text-center">How to Play</h1>

        <div className="space-y-6 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Objective
            </h2>
            <p>
              The goal of the game is to be the first player to collect 3 full
              property sets of different colors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-2">Setup</h2>
            <p>
              Each player starts with 5 cards. The rest of the cards form the
              draw pile.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-2">
              On Your Turn
            </h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <span className="font-bold text-white">Draw 2 cards</span> from
                the draw pile. (If you have no cards, draw 5).
              </li>
              <li>
                <span className="font-bold text-white">Play up to 3 cards</span>{" "}
                from your hand. You can:
                <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-gray-400">
                  <li>Put money/action cards into your bank.</li>
                  <li>Put property cards down in your collection.</li>
                  <li>
                    Play action cards into the center to use their ability.
                  </li>
                </ul>
              </li>
              <li>
                <span className="font-bold text-white">Discard</span> if you
                have more than 7 cards in your hand.
              </li>
            </ol>
          </section>
        </div>

        <div className="text-center mt-8">
          <Link
            href="/"
            className="inline-block text-blue-400 hover:text-blue-300 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
