/**
 * Embeds server-side data as a JSON script tag for client access via fiyuu.data(id).
 *
 * @example
 * // In page.tsx template:
 * ${clientData('my-posts', posts.map(p => ({ id: p.id, title: p.title })))}
 *
 * // In inline script:
 * const posts = fiyuu.data('my-posts');
 */
export function clientData<T>(id: string, data: T): string {
  return `<script type="application/json" id="${id}">${JSON.stringify(data)}</script>`;
}

/**
 * RawHtml — marks a string as already-safe HTML (bypasses auto-escaping).
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
 * Marks a string as trusted HTML (bypasses auto-escaping).
 */
export function raw(value: string | RawHtml): RawHtml {
  return value instanceof RawHtml ? value : new RawHtml(value);
}

/**
 * Alias for raw() — more explicit about intent.
 */
export const unsafeHtml = raw;

/**
 * Internal HTML escaping — used by media.ts and responsive-wrapper.ts.
 * Not intended for direct user consumption; html`` auto-escapes.
 */
export function escapeHtml(value: unknown): string {
  const text = value == null ? "" : String(value);
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function autoEscape(value: unknown): string {
  if (value instanceof RawHtml) {
    return value.value;
  }
  const text = value == null ? "" : String(value);
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Tagged template for building HTML strings.
 *
 * All interpolations are auto-escaped by default (XSS-safe).
 * Use raw() or unsafeHtml() for intentional raw HTML.
 * null / undefined / false render as empty string.
 * Arrays are auto-flattened and joined.
 *
 * @example
 * html`<p>${user.bio}</p>`                    // auto-escaped
 * html`<div>${unsafeHtml(someHtml)}</div>`    // intentional raw HTML
 * html`<ul>${items.map(i => html`<li>${i}</li>`)}</ul>`  // auto-flattened
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
  return autoEscape(value);
}

export type ComponentProps = Record<string, unknown>;

export function component<Props extends ComponentProps = ComponentProps>(
  render: (props: Props) => string,
): (props: Props) => string {
  return render;
}
