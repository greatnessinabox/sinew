"use client";

import { useEffect } from "react";

export function ConsoleEasterEgg() {
  useEffect(() => {
    console.log(
      `%c
   _____ _
  / ____(_)
 | (___  _ _ __   _____      __
  \\___ \\| | '_ \\ / _ \\ \\ /\\ / /
  ____) | | | | |  __/\\ V  V /
 |_____/|_|_| |_|\\___| \\_/\\_/

%cThe connective tissue that makes apps work.
%c
GitHub: github.com/greatnessinabox/sinew
Docs:   sinew.marquis.codes

%cHint: Press ⌘K to search patterns
`,
      "color: #e85a2c; font-family: monospace; font-weight: bold",
      "color: #808080; font-size: 12px",
      "color: #61afef; font-size: 11px",
      "color: #98c379; font-size: 10px; font-style: italic"
    );
  }, []);

  return null;
}
