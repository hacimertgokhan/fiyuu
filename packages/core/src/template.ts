/**
 * RawHtml — marks a string as already-safe HTML.
 * Used as a utility type; html`` does NOT require wrapping with raw().
 */
export class RawHtml {
  readonly value: string;
  constructor(value: string) {
    this.value = value;
  }
  toString(): string {
    return this.value;
  }
}

/**
 * Marks a string as trusted HTML (utility — not required by html``).
 * Useful when you want to explicitly signal that a value is pre-rendered HTML.
 */
export function raw(value: string | RawHtml): RawHtml {
  return value instanceof RawHtml ? value : new RawHtml(value);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Tagged template for building HTML strings.
 *
 * Strings are passed through as-is — use escapeHtml() on user data explicitly.
 * null / undefined / false render as empty string.
 * Arrays are joined without separator.
 *
 * @example
 * html`<p>${escapeHtml(user.bio)}</p>`
 *
 * const items = data.map(x => html`<li>${escapeHtml(x.name)}</li>`).join("");
 * html`<ul>${items}</ul>`
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let output = "";
  for (let index = 0; index < strings.length; index += 1) {
    output += strings[index] ?? "";
    if (index < values.length) {
      output += serializeTemplateValue(values[index]);
    }
  }
  return output;
}

function serializeTemplateValue(value: unknown): string {
  if (value == null || value === false) {
    return "";
  }
  if (value instanceof RawHtml) {
    return value.value;
  }
  if (Array.isArray(value)) {
    return value.map(serializeTemplateValue).join("");
  }
  return String(value);
}
