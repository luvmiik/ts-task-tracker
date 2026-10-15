import type { Priority, Result } from './models.js';

export function parseTitle(value: unknown): Result<string> {
  if (typeof value !== 'string') {
    return { ok: false, error: 'Заголовок должен быть строкой' };
  }

  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 80) {
    return {
      ok: false,
      error: 'Заголовок должен содержать от 1 до 80 символов после обрезки пробелов',
    };
  }

  return { ok: true, value: trimmed };
}

export function parsePriority(value: unknown): Result<Priority> {
  if (value === 'low' || value === 'normal' || value === 'high') {
    return { ok: true, value };
  }

  return {
    ok: false,
    error: 'Приоритет должен быть одним из значений: low, normal, high',
  };
}