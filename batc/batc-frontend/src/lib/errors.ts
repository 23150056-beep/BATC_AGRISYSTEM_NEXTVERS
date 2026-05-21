/**
 * Extract a human-readable message from an API error.
 *
 * DRF responses come in three common shapes:
 *
 *   1. `{ "detail": "..." }`                    — generic 4xx/5xx
 *   2. `{ "field": ["msg1", "msg2"], ... }`     — serializer validation errors
 *   3. `{ "non_field_errors": ["..."] }`        — cross-field validation
 *
 * Without a normalizer the UI either shows a stringified blob or falls back
 * to a generic "Something failed", which is what was happening on the client
 * apply / feedback flows. This helper walks the response and returns the
 * first useful sentence.
 */
export function getApiErrorMessage(err: unknown, fallback = "Something went wrong."): string {
  // axios-shaped error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (err as any)?.response?.data;

  if (!data) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msg = (err as any)?.message;
    return typeof msg === "string" && msg.length ? msg : fallback;
  }

  if (typeof data === "string") return data;

  // 1. Top-level `detail`
  if (typeof data.detail === "string" && data.detail.length) return data.detail;

  // 2. `non_field_errors`
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return String(data.non_field_errors[0]);
  }

  // 3. Field-level validation: walk and pick the first useful message.
  //    Skip the `detail` key (already handled) and `code` (DRF metadata).
  for (const [field, value] of Object.entries(data)) {
    if (field === "detail" || field === "code") continue;
    if (typeof value === "string" && value.length) return value;
    if (Array.isArray(value) && value.length) {
      const first = value[0];
      if (typeof first === "string" && first.length) {
        return field === "non_field_errors" ? first : `${prettifyField(field)}: ${first}`;
      }
    }
  }

  return fallback;
}

function prettifyField(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
