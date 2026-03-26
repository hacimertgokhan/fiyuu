import React from "react";
import { useClientMemo, useClientState } from "./state.js";

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  overscan?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualList<T>({ items, itemHeight, height, overscan = 6, renderItem }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useClientState(0);
  const totalHeight = items.length * itemHeight;

  const windowed = useClientMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const end = Math.min(items.length, Math.ceil((scrollTop + height) / itemHeight) + overscan);
    return {
      start,
      end,
      offsetTop: start * itemHeight,
      visible: items.slice(start, end),
    };
  }, [height, itemHeight, items, overscan, scrollTop]);

  return (
    <div style={{ height, overflowY: "auto" }} onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ position: "absolute", top: windowed.offsetTop, left: 0, right: 0 }}>
          {windowed.visible.map((item, index) => (
            <div key={windowed.start + index} style={{ height: itemHeight }}>
              {renderItem(item, windowed.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
