import { describe, it, expect } from 'vitest';
import { MAX_PROMPT_LENGTH, isPromptTooLong } from './promptLimit';

describe('isPromptTooLong', () => {
  it('길이가 제한 이하이면 false를 반환한다', () => {
    expect(isPromptTooLong('a'.repeat(MAX_PROMPT_LENGTH))).toBe(false);
  });

  it('길이가 제한을 초과하면 true를 반환한다', () => {
    expect(isPromptTooLong('a'.repeat(MAX_PROMPT_LENGTH + 1))).toBe(true);
  });

  it('빈 문자열은 false를 반환한다', () => {
    expect(isPromptTooLong('')).toBe(false);
  });
});
