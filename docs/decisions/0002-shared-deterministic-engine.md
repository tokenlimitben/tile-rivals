# ADR 0002: One shared, deterministic game engine

**Status:** accepted (2026-11-18)

**Context:** The client needs instant feedback (prediction), the server must be authoritative, and tests need reproducible games.

**Decision:** The game rules live in `shared/` as pure TypeScript with no DOM or Node APIs. Tile spawns come from `hash(seed, spawnIndex)`, so the same seed always produces the same random numbers, and a whole match can be replayed from `seed + moves`.

**Consequences**
- Good: client prediction, server validation and tests all run the same code. Both players in a match get identical spawn randomness, which makes versus fair.
- Cost: shared code must stay free of platform-specific imports.
