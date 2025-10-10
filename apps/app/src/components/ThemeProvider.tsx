import { createContext, useContext, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

const themes = {
  "diplomatic-dawn": {
    primary: "#F7E7DC", // pastel beige
    secondary: "#E8C9B0", // slightly darker beige
    accent: "#D4B59E", // accent beige
    text: "#3B3B3B", // dark charcoal text
  },
  "peace-accord": {
    primary: "#DCE8F7", // pastel blue
    secondary: "#B8CEE8", // muted blue
    accent: "#9BB8E0", // accent blue
    text: "#2F3B4C", // deep navy text
  },
  "resolution-rose": {
    primary: "#F7DCE7", // pastel pink
    secondary: "#E8B8CE", // muted rose
    accent: "#D99BB8", // accent rose
    text: "#3B2F34", // dark brownish text
  },
  "summit-sage": {
    primary: "#E2F0E8", // pastel green
    secondary: "#B9D7C6", // muted sage
    accent: "#9BC7B0", // accent sage
    text: "#2E3A34", // deep forest text
  },
  "consensus-coral": {
    primary: "#FDE2DC", // pastel coral
    secondary: "#F7C0B6", // muted coral
    accent: "#F0A394", // accent coral
    text: "#3B2B28", // dark warm brown text
  },
  classic: {
    primary: "#f8fafc", // Very light blue-gray
    secondary: "#e2e8f0", // Light blue-gray
    accent: "#dbeafe", // Light blue
    text: "#1e293b", // Dark slate for text
  },
  modern: {
    primary: "#fefefe", // Almost white
    secondary: "#f1f5f9", // Very light gray
    accent: "#e0f2fe", // Light cyan
    text: "#0f172a", // Very dark slate
  },
  academic: {
    primary: "#fffbeb", // Very light amber
    secondary: "#fef3c7", // Light amber
    accent: "#fde68a", // Soft yellow
    text: "#451a03", // Dark amber for text
  },
  minimal: {
    primary: "#ffffff", // Pure white
    secondary: "#f9fafb", // Very light gray
    accent: "#f3f4f6", // Light gray
    text: "#111827", // Dark gray
  },
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState("diplomatic-dawn");
  const userProfile = useQuery(api.users.getUserProfile);
  const updateProfile = useMutation(api.users.updateUserProfile);

  useEffect(() => {
    if (
      userProfile?.defaultTheme &&
      themes[userProfile.defaultTheme as keyof typeof themes]
    ) {
      setThemeState(userProfile.defaultTheme);
    }
  }, [userProfile?.defaultTheme]);

  useEffect(() => {
    const selectedTheme =
      themes[theme as keyof typeof themes] || themes["diplomatic-dawn"];

    // Apply CSS custom properties immediately with solid colors
    document.documentElement.style.setProperty(
      "--theme-primary",
      selectedTheme.primary,
    );
    document.documentElement.style.setProperty(
      "--theme-secondary",
      selectedTheme.secondary,
    );
    document.documentElement.style.setProperty(
      "--theme-accent",
      selectedTheme.accent,
    );
    document.documentElement.style.setProperty(
      "--theme-text",
      selectedTheme.text,
    );

    // Force immediate re-render by updating body class
    document.body.className = `theme-${theme}`;

    // Ensure no opacity issues
    document.body.style.opacity = "1";
    document.documentElement.style.opacity = "1";
  }, [theme]);

  const setTheme = async (newTheme: string) => {
    // Apply theme immediately
    setThemeState(newTheme);

    // Save to database
    try {
      await updateProfile({ defaultTheme: newTheme });
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
