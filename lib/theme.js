export const LIGHT_RENKLER = {
  primary: "#00236f",
  primaryLight: "#90a8ff",
  primaryBg: "rgba(0, 35, 111, 0.06)",
  primaryDark: "#00164e",
  primaryContainer: "#1e3a8a",
  onPrimaryContainer: "#90a8ff",

  background: "#f7f9fb",
  secondaryBackground: "#ffffff",
  tertiaryBackground: "#f2f4f6",
  groupedBackground: "#f7f9fb",
  card: "#ffffff",

  surface: "#f7f9fb",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f2f4f6",
  surfaceContainer: "#eceef0",
  surfaceContainerHigh: "#e6e8ea",
  surfaceContainerHighest: "#e0e3e5",
  surfaceDim: "#d8dadc",

  text: "#191c1e",
  textSecondary: "#3c3c43",
  textTertiary: "#444651",
  textMuted: "#757682",
  textPlaceholder: "#c5c5d3",
  onSurface: "#191c1e",
  onSurfaceVariant: "#444651",
  outline: "#757682",
  outlineVariant: "#c5c5d3",

  border: "#c5c5d3",
  borderLight: "rgba(197, 197, 211, 0.15)",
  separator: "#c5c5d3",
  opaqueSeparator: "#38383A",

  beklemede: "#FF9500",
  atandi: "#AF52DE",
  devamEdiyor: "#1e3a8a",
  aksiyonBekleniyor: "#ba1a1a",
  onayBekliyor: "#FF3B30",
  tamamlandi: "#34C759",
  kapatildi: "#757682",

  yuksek: "#ba1a1a",
  orta: "#FF9500",
  dusuk: "#34C759",

  danger: "#ba1a1a",
  warning: "#FF9500",
  success: "#34C759",
  info: "#00236f",
  purple: "#AF52DE",
  indigo: "#5856D6",
  teal: "#5AC8FA",
  pink: "#FF2D55",
  mint: "#00C7BE",
  cyan: "#32D2FF",
  orange: "#FF9500",

  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  tertiaryColor: "#4b1c00",
  tertiaryContainer: "#6e2c00",

  overlay: "rgba(0, 0, 0, 0.4)",
  overlayLight: "rgba(0, 0, 0, 0.18)",
  materialThin: "rgba(255, 255, 255, 0.85)",
  materialRegular: "rgba(255, 255, 255, 0.92)",
  materialThick: "rgba(255, 255, 255, 0.97)",

  fill: "rgba(120, 120, 128, 0.2)",
  secondaryFill: "rgba(120, 120, 128, 0.16)",
  tertiaryFill: "rgba(120, 120, 128, 0.12)",
  quaternaryFill: "rgba(120, 120, 128, 0.08)",
};

export const DARK_RENKLER = {
  primary: "#90a8ff",
  primaryLight: "#b6c4ff",
  primaryBg: "rgba(144, 168, 255, 0.1)",
  primaryDark: "#6b8aff",
  primaryContainer: "#264191",
  onPrimaryContainer: "#dce1ff",

  background: "#0E1117",
  secondaryBackground: "#171C24",
  tertiaryBackground: "#1E2530",
  groupedBackground: "#0A0D12",
  card: "#171C24",

  surface: "#0E1117",
  surfaceContainerLowest: "#0A0D12",
  surfaceContainerLow: "#171C24",
  surfaceContainer: "#1E2530",
  surfaceContainerHigh: "#262D38",
  surfaceContainerHighest: "#313842",
  surfaceDim: "#0E1117",

  text: "#F5F7FB",
  textSecondary: "#D9DFE7",
  textTertiary: "#ABB4C2",
  textMuted: "#8A93A3",
  textPlaceholder: "#626B7A",
  onSurface: "#F5F7FB",
  onSurfaceVariant: "#ABB4C2",
  outline: "#8A93A3",
  outlineVariant: "#3D4654",

  border: "#3D4654",
  borderLight: "rgba(61, 70, 84, 0.3)",
  separator: "#2B3340",
  opaqueSeparator: "#8A93A3",

  beklemede: "#FFB340",
  atandi: "#C486FF",
  devamEdiyor: "#6b8aff",
  aksiyonBekleniyor: "#FF6B61",
  onayBekliyor: "#FF6B61",
  tamamlandi: "#4FD67A",
  kapatildi: "#8A93A3",

  yuksek: "#FF6B61",
  orta: "#FFB340",
  dusuk: "#4FD67A",

  danger: "#FF6B61",
  warning: "#FFB340",
  success: "#4FD67A",
  info: "#90a8ff",
  purple: "#C486FF",
  indigo: "#7B78FF",
  teal: "#72D8FF",
  pink: "#FF5E82",
  mint: "#3DE1D1",
  cyan: "#59D9FF",
  orange: "#FFB340",

  errorContainer: "#93000a",
  onErrorContainer: "#ffdad6",
  tertiaryColor: "#ffb691",
  tertiaryContainer: "#773205",

  overlay: "rgba(0, 0, 0, 0.62)",
  overlayLight: "rgba(0, 0, 0, 0.28)",
  materialThin: "rgba(23, 28, 36, 0.86)",
  materialRegular: "rgba(18, 22, 29, 0.92)",
  materialThick: "rgba(14, 17, 23, 0.98)",

  fill: "rgba(255, 255, 255, 0.16)",
  secondaryFill: "rgba(255, 255, 255, 0.12)",
  tertiaryFill: "rgba(255, 255, 255, 0.08)",
  quaternaryFill: "rgba(255, 255, 255, 0.06)",
};

export const TEMA_MODLARI = {
  light: "light",
  dark: "dark",
};

export function getThemeColors(mode = TEMA_MODLARI.light) {
  return mode === TEMA_MODLARI.dark ? DARK_RENKLER : LIGHT_RENKLER;
}

export function getShadows(mode = TEMA_MODLARI.light) {
  const isDark = mode === TEMA_MODLARI.dark;

  return {
    sm: {
      shadowColor: isDark ? "#000" : "#191c1e",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.28 : 0.04,
      shadowRadius: isDark ? 6 : 4,
      elevation: isDark ? 2 : 1,
    },
    md: {
      shadowColor: isDark ? "#000" : "#191c1e",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.34 : 0.06,
      shadowRadius: isDark ? 12 : 12,
      elevation: isDark ? 4 : 3,
    },
    lg: {
      shadowColor: isDark ? "#000" : "#191c1e",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.06,
      shadowRadius: isDark ? 18 : 24,
      elevation: isDark ? 7 : 6,
    },
    xl: {
      shadowColor: isDark ? "#000" : "#191c1e",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.46 : 0.08,
      shadowRadius: isDark ? 28 : 24,
      elevation: isDark ? 10 : 8,
    },
  };
}

export const RENKLER = LIGHT_RENKLER;
export const SHADOWS = getShadows(TEMA_MODLARI.light);

export const TIPOGRAFI = {
  displayMd: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5 },
  displaySm: { fontSize: 28, fontWeight: "800", letterSpacing: -0.3 },
  headlineLg: { fontSize: 24, fontWeight: "800", letterSpacing: -0.2 },
  headlineMd: { fontSize: 20, fontWeight: "700", letterSpacing: -0.1 },
  titleLg: { fontSize: 22, fontWeight: "700", letterSpacing: 0.35 },
  titleMd: { fontSize: 17, fontWeight: "600", letterSpacing: -0.41 },
  titleSm: { fontSize: 15, fontWeight: "600", letterSpacing: -0.24 },
  bodyLg: { fontSize: 17, fontWeight: "400", letterSpacing: -0.41 },
  bodyMd: { fontSize: 15, fontWeight: "400", letterSpacing: -0.24 },
  bodySm: { fontSize: 13, fontWeight: "400", letterSpacing: -0.08 },
  labelLg: { fontSize: 14, fontWeight: "700", letterSpacing: 0.1 },
  labelMd: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  labelSm: { fontSize: 10, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  caption1: { fontSize: 12, fontWeight: "400" },
  caption2: { fontSize: 11, fontWeight: "400", letterSpacing: 0.07 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const RADIUS = {
  sm: 2,
  md: 4,
  lg: 8,
  xl: 12,
  pill: 999,
  card: 12,
  button: 12,
  input: 8,
  badge: 2,
  modal: 16,
};
