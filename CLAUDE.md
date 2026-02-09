# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Browser-based 3D FPS game built with Next.js and Three.js. "Neon Arena Rivals" - a cyberpunk-themed first-person shooter with multiple game modes, weapons, abilities, and perks.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

No test framework configured.

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Three.js 0.182** - 3D rendering engine
- **Zustand 5** - State management
- **Tailwind CSS 4** - Styling
- **Web Audio API** - Procedural sound generation (no audio files)

## Architecture

### Two Versions Coexist

- **Legacy (root)**: `game.js`, `index.html`, `style.css` - Monolithic vanilla JS prototype with mobile touch controls. Not actively used by Next.js app.
- **Current (`src/`)**: Modular TypeScript rewrite. This is what runs.

**When modifying game logic, always edit files in `src/`, not root `game.js`.**

### Entry Point Flow

```
app/page.tsx → Game.tsx (dynamic, SSR disabled)
                ├── HUD.tsx (health, ammo, score, crosshair, buffs)
                ├── Menu.tsx (StartMenu, PauseMenu, GameOverMenu)
                └── Leaderboard.tsx (localStorage high scores)
```

### Game Engine (`src/game/`)

| File | Responsibility |
|------|---------------|
| `Scene.ts` | Sky, fog, lighting, ground plane, obstacles |
| `Player.ts` | WASD movement, mouse look, bounded movement |
| `Target.ts` | Enemy types (normal/charger/tank/shooter/boss), AI, spawning, items, enemy bullets |
| `Weapons.ts` | Raycasting hit detection, spread, bullet trails, muzzle flash |
| `Effects.ts` | Particle systems (explosion, hit, dust), screen shake |
| `Audio.ts` | Procedural sound via Web Audio API oscillators |

### State Management (`src/store/gameStore.ts`)

Central Zustand store (~911 lines) containing:
- **8 Weapons**: 7 primary + 1 secondary (Volt Pistol). Each has damage, fire rate, spread, ammo, reload time.
- **4 Abilities**: Blink (teleport), Overcharge (2x fire rate), Phase Shift (invulnerable), Scanner (highlight enemies)
- **8 Perks** (select 2): Quick Reload, Thick Skin, Dead Eye, Marathoner, Scavenger, Vampirism, Ninja, Heavy Hitter
- **3 Game Modes**: Survival (endless), Wave Assault (bosses every 5 waves), Time Attack (5000pts in 2min)
- **3 Difficulties**: Easy/Normal/Hard (enemy health & damage multipliers)
- **Movement**: Sliding, dashing (2 charges), sprinting, crouching
- **Killstreaks**: 3/5/7/10/15 kills for Speed Boost, Damage Amp, Shield, Orbital Strike, Neon Storm

### Enemy Config Location

Enemy stats (speed, health, damage) are in `src/game/Target.ts` → `ENEMY_CONFIGS` object.

## Key Technical Decisions

- Client-side only rendering (`dynamic(() => import(), { ssr: false })`)
- No physics engine - distance-based collision detection
- Raycasting for instant hit detection (no projectile physics for player weapons)
- localStorage for leaderboard (no backend)
- All audio is procedurally generated (no sound files needed)
