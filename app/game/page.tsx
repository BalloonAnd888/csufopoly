import ActivePlayerArea from "@/components/game-board/ActivePlayerArea";
import CenterTable from "@/components/game-board/CenterTable";
import OpponentArea from "@/components/game-board/OpponentArea";
import React from "react";

export default function GamePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-gray-900 text-white">
        <OpponentArea />
        <CenterTable />
        <ActivePlayerArea />
    </main>
  );
}
