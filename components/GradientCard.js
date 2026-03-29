import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { RADIUS, SPACING } from "../lib/theme";

export default function GradientCard({ children, style }) {
  const { colors, shadows } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, shadows), [colors, shadows]);

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const getStyles = (colors, shadows) =>
  StyleSheet.create({
    card: {
      borderRadius: RADIUS.card,
      padding: SPACING.base,
      backgroundColor: colors.surfaceContainerLowest || colors.card,
      ...shadows.sm,
    },
  });
