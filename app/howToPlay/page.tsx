"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

// Define the type for a card based on your table schema
interface Card {
  id: number;
  name: string;
  type: string;
  value: number;
  main_color: string | null;
  secondary_color: string | null;
  is_wildcard: boolean;
  quantity: number;
  description: string | null;
}

export default function HowToPlayPage() {
  const supabase = createClient();
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCards = async () => {
      const { data, error } = await supabase.from("cards").select("*");
      if (error) setError(error.message);
      else setCards(data);
      setLoading(false);
    };
    fetchCards();
  }, [supabase]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-900 text-white p-8">
      <div className="w-full max-w-3xl p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 mb-12 mt-8">
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

      <div className="w-full max-w-6xl mb-8">
        <h2 className="text-3xl font-bold mb-8 text-center">Card Deck</h2>

        {loading ? (
          <p className="text-center text-gray-400">Loading cards...</p>
        ) : error ? (
          <p className="text-center text-red-500">
            Error fetching cards: {error}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                className="border border-gray-700 p-4 rounded-xl shadow-lg bg-gray-800"
              >
                <h3 className="font-bold text-xl mb-2">{card.name}</h3>
                <p className="text-sm text-gray-400">
                  Type: <span className="text-gray-200">{card.type}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Value: <span className="text-green-400">{card.value}M</span>
                </p>
                {card.main_color && (
                  <p className="text-sm text-gray-400">
                    Color:{" "}
                    <span className="text-gray-200">{card.main_color}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
