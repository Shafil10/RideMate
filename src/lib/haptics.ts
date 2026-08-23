import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";

// Silently no-ops on desktop browsers / unsupported platforms — Capacitor's web
// haptics shim throws there rather than degrading gracefully on its own.
export async function hapticTap() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // unsupported platform — ignore
  }
}

export async function hapticSuccess() {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // unsupported platform — ignore
  }
}
