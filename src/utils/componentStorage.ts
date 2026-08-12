import type { GeneratedComponent } from '../types';

export const STORAGE_KEY = 'react-component-generator:components';

export function saveComponents(components: GeneratedComponent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
}

export function loadComponents(): GeneratedComponent[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as GeneratedComponent[];
    return parsed.map((component) => ({
      ...component,
      createdAt: new Date(component.createdAt),
    }));
  } catch {
    return [];
  }
}
