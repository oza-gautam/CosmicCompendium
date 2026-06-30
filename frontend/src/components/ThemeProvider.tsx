"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const FONT_SIZES = [12, 13, 14, 15, 16, 18, 20] as const;
const FONT_DEFAULT = 14;
const LS_FONT_KEY = "ui-font-size";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontSizes: readonly number[];
}>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  fontSize: FONT_DEFAULT,
  setFontSize: () => {},
  fontSizes: FONT_SIZES,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function applyFontSize(size: number) {
  document.documentElement.style.fontSize = `${size}px`;
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [fontSize, setFontSizeState] = useState<number>(FONT_DEFAULT);

  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) ?? "dark";
    setThemeState(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedSize = parseInt(localStorage.getItem(LS_FONT_KEY) ?? "", 10);
    const size =
      !isNaN(savedSize) && (FONT_SIZES as readonly number[]).includes(savedSize)
        ? savedSize
        : FONT_DEFAULT;
    setFontSizeState(size);
    applyFontSize(size);
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem("theme", t);
    document.documentElement.setAttribute("data-theme", t);
  }

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  function setFontSize(size: number) {
    setFontSizeState(size);
    localStorage.setItem(LS_FONT_KEY, String(size));
    applyFontSize(size);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        fontSize,
        setFontSize,
        fontSizes: FONT_SIZES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
