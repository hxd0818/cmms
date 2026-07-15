# Shared Library

前后端共享的 Zod schema / 类型 / 枚举 / 常量。

## Usage

```ts
import { GuestLevel, guestSchema } from '@/lib/shared/guest';
```

## Files (will be created in Phase 1)
- `guest.ts` - Guest schemas and enums
- `meeting.ts` - Meeting schemas and enums
- `errors.ts` - AppError classes (ConflictError, NotFoundError, etc.)
- `constants.ts` - Cross-cutting constants
