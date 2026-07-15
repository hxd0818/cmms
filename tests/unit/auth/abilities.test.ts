import { describe, it, expect } from 'vitest';
import { defineAbilityFor } from '@/lib/auth/abilities';

describe('abilities', () => {
  it('SUPER_ADMIN can manage everything', () => {
    const ability = defineAbilityFor({ role: 'SUPER_ADMIN' });
    expect(ability.can('manage', 'Guest')).toBe(true);
    expect(ability.can('delete', 'Guest')).toBe(true);
    expect(ability.can('read', 'AuditLog')).toBe(true);
  });

  it('VIEWER can read but not write Guest', () => {
    const ability = defineAbilityFor({ role: 'VIEWER' });
    expect(ability.can('read', 'Guest')).toBe(true);
    expect(ability.can('create', 'Guest')).toBe(false);
    expect(ability.can('update', 'Guest')).toBe(false);
    expect(ability.can('delete', 'Guest')).toBe(false);
  });

  it('VIEWER can read Meeting but not AuditLog/User', () => {
    const ability = defineAbilityFor({ role: 'VIEWER' });
    expect(ability.can('read', 'Meeting')).toBe(true);
    expect(ability.can('read', 'AuditLog')).toBe(false);
    expect(ability.can('read', 'User')).toBe(false);
  });
});
