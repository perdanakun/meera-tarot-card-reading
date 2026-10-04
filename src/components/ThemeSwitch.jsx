import {
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Moon, Sun } from "lucide-react";
import "./ThemeSwitch.css";

const STORAGE_KEY = "meera-theme";

function getSavedPreference() {
  if (typeof window === "undefined") {
    return "system";
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  return saved === "light" || saved === "dark"
    ? saved
    : "system";
}

function getSystemDark() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
}

export default function ThemeSwitch() {
  const [preference, setPreference] =
    useState(getSavedPreference);

  const [systemDark, setSystemDark] =
    useState(getSystemDark);

  const resolvedTheme =
    preference === "system"
      ? systemDark
        ? "dark"
        : "light"
      : preference;

  useLayoutEffect(() => {
    const root = document.documentElement;

    if (preference === "system") {
      root.removeAttribute("data-theme");
      return;
    }

    root.setAttribute(
      "data-theme",
      preference,
    );
  }, [preference]);

  useEffect(() => {
    const query = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    const update = () => {
      setSystemDark(query.matches);
    };

    update();
    query.addEventListener("change", update);

    return () => {
      query.removeEventListener(
        "change",
        update,
      );
    };
  }, []);

  function toggleTheme() {
    const next =
      resolvedTheme === "dark"
        ? "light"
        : "dark";

    setPreference(next);
    window.localStorage.setItem(
      STORAGE_KEY,
      next,
    );
  }

  const isDark =
    resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="meera-theme-switch"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      aria-pressed={isDark}
      title={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
    >
      <span
        className="meera-theme-switch__track"
        aria-hidden="true"
      >
        <span className="meera-theme-switch__sun">
          <Sun
            size={13}
            strokeWidth={1.8}
          />
        </span>

        <span className="meera-theme-switch__moon">
          <Moon
            size={13}
            strokeWidth={1.8}
          />
        </span>

        <span
          className={`meera-theme-switch__thumb ${
            isDark ? "is-dark" : ""
          }`}
        />
      </span>
    </button>
  );
}
