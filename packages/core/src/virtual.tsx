import { html } from "./template.js";

export interface VirtualListProps {
  items: unknown[];
  itemHeight: number;
  height: number;
  renderItem: (item: unknown, index: number) => string;
}

/**
 * renderVirtualList — server-side HTML generator for virtualized lists.
 *
 * On the server all items are rendered (no real windowing). Client-side
 * virtualization can be layered on top by reading the `data-fiyuu-virtual`
 * attribute and the `data-item-height` / `data-total-height` values.
 */
export function renderVirtualList(props: VirtualListProps): string {
  const { items, itemHeight, height, renderItem } = props;
  const totalHeight = items.length * itemHeight;
  const itemsHtml = items
    .map((item, index) => `<div style="height:${itemHeight}px;overflow:hidden">${renderItem(item, index)}</div>`)
    .join("");

  return html`<div
    data-fiyuu-virtual
    data-item-height="${itemHeight}"
    data-total-height="${totalHeight}"
    style="height:${height}px;overflow-y:auto;position:relative"
  ><div style="height:${totalHeight}px;position:relative">${itemsHtml}</div></div>`;
}
