import React, { useEffect, useState } from "react";
import { Button } from "@/ui/button";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

const ThemeToggleButton = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme") as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    let activeTheme = theme;
    if (theme === "system") {
      // If system is chosen, apply the current system theme
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    root.classList.add(activeTheme); // Apply 'light' or 'dark'
    localStorage.setItem("theme", theme); // Store the user's explicit choice (light, dark, or system)
  }, [theme]);

  const toggleTheme = () => {
    // Simple toggle: light <-> dark
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // To enable a three-way toggle (light -> dark -> system -> light):
  // const toggleTheme = () => {
  //   setTheme(prevTheme => {
  //     if (prevTheme === 'light') return 'dark';
  //     if (prevTheme === 'dark') return 'system';
  //     return 'light'; // system goes to light
  //   });
  // };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="hover:bg-muted hover:text-muted-foreground"
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      {/* If using system theme, you might want a third icon or adjust logic
      {theme === 'system' && <MonitorSmartphone className="h-5 w-5" />} 
      */}
    </Button>
  );
};

export default ThemeToggleButton;
