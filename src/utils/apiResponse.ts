/** Unwrap `{ success, data }` API bodies; passthrough if already unwrapped. */
export function unwrapApiData<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as { data: unknown }).data != null) {
    return (body as { data: T }).data;
  }
  return body as T;
}
