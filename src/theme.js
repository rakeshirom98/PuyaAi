const SETTINGS_KEY = "puya-ai-settings-page-v1";

export function readThemePreference() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return ["System", "Light", "Dark"].includes(saved.theme) ? saved.theme : "Dark";
  } catch {
    return "Dark";
  }
}

export function applyAppTheme(preference) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  const updateTheme = () => {
    const isLight = preference === "Light" || (preference === "System" && media.matches);
    document.documentElement.dataset.appTheme = isLight ? "light" : "dark";
    document.documentElement.style.colorScheme = isLight ? "light" : "dark";
  };

  updateTheme();

  if (preference !== "System") return () => {};
  media.addEventListener("change", updateTheme);
  return () => media.removeEventListener("change", updateTheme);
}
