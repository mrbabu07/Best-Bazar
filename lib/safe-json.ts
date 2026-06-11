export function safeJsonStringify(value: unknown) {
  return JSON.stringify(value, (_key, currentValue) =>
    typeof currentValue === "bigint" ? currentValue.toString() : currentValue
  );
}

export function safeJsonParse<T>(text: string | null | undefined, fallback: T): T {
  if (!text?.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export function toJsonSafeValue(value: unknown) {
  const text = safeJsonStringify(value);

  return text ? safeJsonParse<unknown>(text, null) : null;
}

export async function safeResponseJson<T>(response: Response, fallback: T): Promise<T> {
  const text = await response.text();

  return safeJsonParse<T>(text, fallback);
}
