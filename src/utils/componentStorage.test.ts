import { describe, it, expect, beforeEach } from 'vitest';
import { saveComponents, loadComponents, STORAGE_KEY } from './componentStorage';
import type { GeneratedComponent } from '../types';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as Record<string, unknown>).localStorage = localStorageMock;
}

const sample: GeneratedComponent[] = [
  {
    id: '1',
    prompt: '프로필 카드',
    code: 'render(<div />)',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  },
];

describe('componentStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadComponents()).toEqual([]);
  });

  it('저장한 컴포넌트 목록을 그대로 불러온다', () => {
    saveComponents(sample);
    expect(loadComponents()).toEqual(sample);
  });

  it('불러온 컴포넌트의 createdAt은 Date 인스턴스다', () => {
    saveComponents(sample);
    const [loaded] = loadComponents();
    expect(loaded.createdAt).toBeInstanceOf(Date);
  });

  it('손상된 JSON이 저장되어 있으면 빈 배열을 반환한다', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadComponents()).toEqual([]);
  });
});
