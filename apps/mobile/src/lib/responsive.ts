import { useWindowDimensions } from "react-native";

/**
 * Breakpoints for adapting the layout to the device.
 *   phone   < 768   — full-bleed single column (default mobile UI)
 *   tablet  768–1023 — wider, padded
 *   desktop >= 1024 — centered column with a max content width
 */
export type DeviceClass = "phone" | "tablet" | "desktop";

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const device: DeviceClass = width >= 1024 ? "desktop" : width >= 768 ? "tablet" : "phone";
  const isPhone = device === "phone";

  // Cap the readable content width on big screens so the app doesn't stretch
  // edge-to-edge on a laptop; on phones it fills the screen.
  const contentMaxWidth = device === "desktop" ? 480 : device === "tablet" ? 600 : width;
  const horizontalPadding = isPhone ? 16 : 24;

  return { width, height, device, isPhone, contentMaxWidth, horizontalPadding };
}
