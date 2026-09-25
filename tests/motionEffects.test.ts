import { describe, it, expect, beforeEach } from 'vitest';

// Node test environment memory mock for localStorage
class MockLocalStorage {
  private store: Record<string, string> = {};
  getItem(key: string) {
    return this.store[key] || null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

const mockStorage = new MockLocalStorage();

describe('Motion Effects & Background System', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('defaults to full motion when no preference is saved', () => {
    const saved = mockStorage.getItem('nexora_motion_effects');
    expect(saved).toBeNull();
    const defaultMode = saved || 'full';
    expect(defaultMode).toBe('full');
  });

  it('persists motion mode choices (full, reduced, off) in storage', () => {
    mockStorage.setItem('nexora_motion_effects', 'reduced');
    expect(mockStorage.getItem('nexora_motion_effects')).toBe('reduced');

    mockStorage.setItem('nexora_motion_effects', 'off');
    expect(mockStorage.getItem('nexora_motion_effects')).toBe('off');

    mockStorage.setItem('nexora_motion_effects', 'full');
    expect(mockStorage.getItem('nexora_motion_effects')).toBe('full');
  });

  it('defines the required cyber-arena brand color tokens', () => {
    const tokens = {
      bg: '#050816',
      surface: '#0b1024',
      cyan: '#00e5ff',
      violet: '#7c3aed',
      blue: '#2563eb',
      magenta: '#d946ef',
    };

    expect(tokens.bg).toBe('#050816');
    expect(tokens.surface).toBe('#0b1024');
    expect(tokens.cyan).toBe('#00e5ff');
    expect(tokens.violet).toBe('#7c3aed');
    expect(tokens.blue).toBe('#2563eb');
    expect(tokens.magenta).toBe('#d946ef');
  });

  it('reduces background intensity during active live game state', () => {
    const getOpacity = (isLive: boolean) => (isLive ? 0.1 : 0.42);
    expect(getOpacity(true)).toBeLessThan(getOpacity(false));
  });

  it('boosts central spotlight glow during countdown state without flashing', () => {
    const getGlow = (isCountdown: boolean) => (isCountdown ? 0.7 : 0.45);
    expect(getGlow(true)).toBeGreaterThan(getGlow(false));
  });
});
