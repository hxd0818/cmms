# Queue Module

BullMQ queue definitions and worker registrations.

## Files (will be created in Phase 1)
- `index.ts` - Queue/Worker factories and Redis connection
- `guest-import.queue.ts` - Guest Excel import queue

## Worker Process
Workers run in a separate process via `pnpm worker:start` (entry: `worker/index.ts`).
They share the same codebase as the Next.js app but run independently for
long-running tasks (Excel parsing, notifications, report exports).
