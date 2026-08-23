import { StatusBar, Style } from "@capacitor/status-bar";

// No-ops on web/unsupported platforms — the plugin's web shim rejects there
// rather than degrading gracefully on its own.
export async function setSplashStatusBar() {
  try {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: "#15803D" });
  } catch {
    // unsupported platform — ignore
  }
}

export async function setAppStatusBar() {
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#F8FAFC" });
  } catch {
    // unsupported platform — ignore
  }
}
