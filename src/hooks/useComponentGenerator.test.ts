import { describe, it, expect, beforeEach } from 'vitest';
import { loadComponents, saveComponents } from '../utils/componentStorage';
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

(global as any).localStorage = localStorageMock;

const sample: GeneratedComponent = {
  id: '1',
  prompt: '프로필 카드',
  code: 'render(<div />)',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('localStorage에 컴포넌트를 저장하고 불러올 수 있다', () => {
    saveComponents([sample]);
    expect(loadComponents()).toEqual([sample]);
  });

  it('여러 컴포넌트를 저장하고 불러올 수 있다', () => {
    const components = [
      sample,
      {
        id: '2',
        prompt: '버튼 컴포넌트',
        code: 'render(<button />)',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      },
    ];
    saveComponents(components);
    expect(loadComponents()).toEqual(components);
  });

  it('저장 후 제거하면 변경된 목록이 localStorage에 반영된다', () => {
    saveComponents([sample]);
    const loaded = loadComponents();
    const filtered = loaded.filter((c) => c.id !== sample.id);
    saveComponents(filtered);
    expect(loadComponents()).toEqual([]);
  });

  it('전체 삭제 시 빈 배열이 저장된다', () => {
    saveComponents([sample]);
    saveComponents([]);
    expect(loadComponents()).toEqual([]);
  });
});
