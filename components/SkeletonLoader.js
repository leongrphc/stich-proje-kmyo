import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";
import { RADIUS, SPACING } from "../lib/theme";

/**
 * Shimmer animasyonlu iskelet kutusu
 */
function SkeletonBox({ width, height, borderRadius = RADIUS.md, style }) {
  const { colors } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceContainerHigh,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Dashboard (index.js) için iskelet
 */
export function DashboardSkeleton() {
  const { colors } = useAppTheme();

  return (
    <View style={skeletonStyles.container}>
      {/* Hoşgeldin bölümü */}
      <View style={skeletonStyles.welcomeRow}>
        <SkeletonBox width={52} height={52} borderRadius={26} />
        <View style={skeletonStyles.welcomeText}>
          <SkeletonBox width={200} height={20} borderRadius={RADIUS.lg} />
          <SkeletonBox
            width={140}
            height={14}
            borderRadius={RADIUS.md}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      </View>

      {/* Ana istatistik kartı */}
      <View
        style={[
          skeletonStyles.mainCard,
          { backgroundColor: colors.surfaceContainerLowest },
        ]}
      >
        <SkeletonBox
          width={80}
          height={12}
          borderRadius={RADIUS.sm}
          style={{ marginBottom: SPACING.md }}
        />
        <SkeletonBox width={100} height={48} borderRadius={RADIUS.lg} />
      </View>

      {/* Alt istatistik kartları */}
      <View style={skeletonStyles.subRow}>
        <View
          style={[
            skeletonStyles.subCard,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <SkeletonBox width={70} height={10} borderRadius={RADIUS.sm} />
          <SkeletonBox
            width={60}
            height={36}
            borderRadius={RADIUS.lg}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
        <View
          style={[
            skeletonStyles.subCard,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <SkeletonBox width={70} height={10} borderRadius={RADIUS.sm} />
          <SkeletonBox
            width={60}
            height={36}
            borderRadius={RADIUS.lg}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      </View>

      {/* Hızlı işlemler */}
      <SkeletonBox
        width="100%"
        height={56}
        borderRadius={RADIUS.card}
        style={{ marginTop: SPACING.xl }}
      />
      <SkeletonBox
        width="100%"
        height={56}
        borderRadius={RADIUS.card}
        style={{ marginTop: SPACING.md }}
      />

      {/* Son aktivite başlık */}
      <SkeletonBox
        width={120}
        height={18}
        borderRadius={RADIUS.md}
        style={{ marginTop: SPACING.xl }}
      />

      {/* Son aktivite listesi */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            skeletonStyles.activityItem,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <SkeletonBox width={4} height="100%" borderRadius={2} />
          <View style={skeletonStyles.activityContent}>
            <SkeletonBox width="70%" height={15} borderRadius={RADIUS.md} />
            <SkeletonBox
              width="50%"
              height={13}
              borderRadius={RADIUS.md}
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Talepler listesi (talepler.js) için iskelet
 */
export function TalepListeSkeleton() {
  const { colors } = useAppTheme();

  return (
    <View style={skeletonStyles.listContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            skeletonStyles.talepCard,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <SkeletonBox width={4} height="100%" borderRadius={2} />
          <View style={skeletonStyles.talepContent}>
            <View style={skeletonStyles.talepTopRow}>
              <SkeletonBox width={80} height={11} borderRadius={RADIUS.sm} />
              <SkeletonBox width={60} height={20} borderRadius={RADIUS.sm} />
            </View>
            <SkeletonBox
              width="80%"
              height={18}
              borderRadius={RADIUS.md}
              style={{ marginTop: SPACING.sm }}
            />
            <View style={{ marginTop: SPACING.md }}>
              <SkeletonBox width="60%" height={13} borderRadius={RADIUS.md} />
              <SkeletonBox
                width="45%"
                height={13}
                borderRadius={RADIUS.md}
                style={{ marginTop: SPACING.xs }}
              />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * Bildirimler listesi (bildirimler.js) için iskelet
 */
export function BildirimListeSkeleton() {
  const { colors } = useAppTheme();

  return (
    <View style={skeletonStyles.listContainer}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={skeletonStyles.bildirimRow}>
          <SkeletonBox width={44} height={44} borderRadius={22} />
          <View style={skeletonStyles.bildirimContent}>
            <View style={skeletonStyles.bildirimHeaderRow}>
              <SkeletonBox width="60%" height={14} borderRadius={RADIUS.md} />
              <SkeletonBox width={50} height={12} borderRadius={RADIUS.sm} />
            </View>
            <SkeletonBox
              width="90%"
              height={13}
              borderRadius={RADIUS.md}
              style={{ marginTop: SPACING.sm }}
            />
            <SkeletonBox
              width="40%"
              height={12}
              borderRadius={RADIUS.md}
              style={{ marginTop: SPACING.sm }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  welcomeText: {
    flex: 1,
  },
  mainCard: {
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
  },
  subRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  subCard: {
    flex: 1,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
  },
  activityItem: {
    flexDirection: "row",
    borderRadius: RADIUS.card,
    overflow: "hidden",
    marginTop: SPACING.sm,
    minHeight: 60,
  },
  activityContent: {
    flex: 1,
    padding: SPACING.base,
    justifyContent: "center",
  },
  listContainer: {
    padding: SPACING.base,
  },
  talepCard: {
    flexDirection: "row",
    borderRadius: RADIUS.card,
    overflow: "hidden",
    marginBottom: SPACING.md,
    minHeight: 100,
  },
  talepContent: {
    flex: 1,
    padding: SPACING.lg,
  },
  talepTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bildirimRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.base,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  },
  bildirimContent: {
    flex: 1,
  },
  bildirimHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
