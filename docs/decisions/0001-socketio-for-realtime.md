# ADR 0001: Use Socket.IO for real-time play

**Status:** accepted (2026-11-18)

**Context:** Versus matches need low-latency two-way messages, rooms, and graceful reconnects. The whole project has a 14-day budget.

**Options considered:** raw `ws`, Socket.IO, a hosted realtime service.

**Decision:** Socket.IO on a Node server.

**Consequences**
- Good: rooms and automatic reconnection are built in, which saves time in milestone M5. Same language as the client, so the engine is shared.
- Cost: an extra dependency, and the wire protocol is abstracted away from raw WebSockets.
- Mitigation: the event names and payloads are documented in `docs/protocol.md` and typed in `shared/`, so swapping transports later is a contained change.
