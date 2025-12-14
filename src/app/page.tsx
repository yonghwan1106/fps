'use client';

import dynamic from 'next/dynamic';

const Game = dynamic(() => import('@/components/Game').then(mod => ({ default: mod.Game })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-green-400 font-mono text-xl animate-pulse">
        Loading FPS Arena...
      </div>
    </div>
  ),
});

export default function Home() {
  return <Game />;
}
