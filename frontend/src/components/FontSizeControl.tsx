"use client";

import { useTheme } from "./ThemeProvider";

export default function FontSizeControl() {
  const { fontSize, setFontSize, fontSizes } = useTheme();

  const minSize = fontSizes[0];
  const maxSize = fontSizes[fontSizes.length - 1];
  const currentIdx = fontSizes.indexOf(fontSize as (typeof fontSizes)[number]);

  function decrease() {
    if (currentIdx > 0) setFontSize(fontSizes[currentIdx - 1]);
  }

  function increase() {
    if (currentIdx < fontSizes.length - 1)
      setFontSize(fontSizes[currentIdx + 1]);
  }

  return (
    <div className="flex items-center gap-0.5 border border-border rounded-lg overflow-hidden">
      <button
        onClick={decrease}
        disabled={fontSize <= minSize}
        title="Decrease font size"
        className="px-2 py-1.5 text-xs text-secondary hover:text-primary hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        A-
      </button>
      <span className="px-1.5 text-xs text-muted tabular-nums select-none border-x border-border">
        {fontSize}
      </span>
      <button
        onClick={increase}
        disabled={fontSize >= maxSize}
        title="Increase font size"
        className="px-2 py-1.5 text-sm text-secondary hover:text-primary hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        A+
      </button>
    </div>
  );
}
