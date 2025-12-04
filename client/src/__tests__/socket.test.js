import { describe, it, expect, vi } from 'vitest';
vi.mock('socket.io-client', () => ({ io: () => ({ on: () => {}, emit: () => {}, off: () => {} }) }));
import { getSocket } from '@/lib/realtime';

// Smoke test: socket initializes and can register handlers
describe('socket', () => {
  it('initializes singleton', () => {
    const s = getSocket();
    expect(s).toBeTruthy();
    expect(typeof s.on).toBe('function');
  });
});
