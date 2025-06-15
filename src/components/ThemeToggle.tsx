
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [dark, setDark] = useState<boolean>(false);

  useEffect(() => {
    if (
      (window.matchMedia("(prefers-color-scheme: dark)").matches && !localStorage.theme) ||
      localStorage.theme === "dark"
    ) {
      setDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    const isDark = !dark;
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    }
  };

  return (
    <button
      aria-label="Toggle dark mode"
      className="bg-zinc-100 dark:bg-[#232333] border border-zinc-200 dark:border-zinc-700 rounded-full p-2 transition flex items-center justify-center hover:scale-105 shadow"
      onClick={toggle}
    >
      {dark ? <Sun size={18} className="text-yellow-300" /> : <Moon size={18} className="text-zinc-500" />}
    </button>
  );
};

export default ThemeToggle;
