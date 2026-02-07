import React, { useMemo } from "react";
import { ScrollView, Text, StyleSheet, View, Dimensions } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import { Colors, Spacing, Typography } from "@/src/lib/theme";
import { useApp } from "@/src/context/AppContext";
import ChartCard from "@/src/components/ChartCard";

const CHART_WIDTH = Dimensions.get("window").width - 80;

export default function ChartsScreen() {
  const { state } = useApp();
  const { trades, metrics } = state;

  // ── Chart 1: Trades Per Day ────────────────────────────────────────────
  const tradesPerDay = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const t of trades) {
      const day = new Date(t.timestamp).toISOString().slice(5, 10); // MM-DD
      buckets.set(day, (buckets.get(day) || 0) + 1);
    }
    return Array.from(buckets.entries())
      .sort()
      .map(([label, value]) => ({
        value,
        label,
        frontColor: value > 20 ? Colors.danger : value > 12 ? Colors.warning : Colors.secondary,
      }));
  }, [trades]);

  // ── Chart 1b: P/L Timeline (Cumulative) ──────────────────────────────
  const pnlTimeline = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    let cum = 0;
    return sorted.map((t, i) => {
      cum += t.pnl;
      return {
        value: Math.round(cum),
        label: i % Math.max(1, Math.floor(sorted.length / 6)) === 0
          ? new Date(t.timestamp).toISOString().slice(5, 10)
          : "",
      };
    });
  }, [trades]);

  // ── Chart 2: Time Between Trades Distribution ─────────────────────────
  const gapDistribution = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const gapMin = (sorted[i].timestamp - sorted[i - 1].timestamp) / 60000;
      if (gapMin < 120) gaps.push(gapMin);
    }

    // Bucket into 5-min intervals
    const buckets = new Map<number, number>();
    for (const g of gaps) {
      const bucket = Math.floor(g / 5) * 5;
      buckets.set(bucket, (buckets.get(bucket) || 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([min, count]) => ({
        value: count,
        label: `${min}m`,
        dataPointText: String(count),
      }));
  }, [trades]);

  // ── Chart 2b: Hourly Heatmap ─────────────────────────────────────────
  const hourlyCounts = useMemo(() => {
    if (metrics?.hourlyTradeCounts && metrics.hourlyTradeCounts.length === 24) {
      return metrics.hourlyTradeCounts;
    }
    const counts = Array.from({ length: 24 }, () => 0);
    for (const t of trades) {
      const h = new Date(t.timestamp).getHours();
      counts[h] += 1;
    }
    return counts;
  }, [metrics, trades]);

  // ── Chart 3: Post-Loss Trade Count ────────────────────────────────────
  const postLossData = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
    const data: { value: number; label: string; frontColor: string }[] = [];
    let lossIdx = 0;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].pnl < 0) {
        lossIdx++;
        let count = 0;
        for (let j = i + 1; j < sorted.length; j++) {
          if ((sorted[j].timestamp - sorted[i].timestamp) / 60000 > 30) break;
          count++;
        }
        if (lossIdx % 3 === 0 || count >= 3) {
          data.push({
            value: count,
            label: `L${lossIdx}`,
            frontColor: count >= 3 ? Colors.danger : count >= 2 ? Colors.warning : Colors.secondary,
          });
        }
      }
    }
    return data.slice(0, 15); // Limit for readability
  }, [trades]);

  // ── Chart 4: Win vs Loss Hold Time ────────────────────────────────────
  const holdTimeData = useMemo(() => {
    if (!metrics?.avgHoldMinutesWins || !metrics?.avgHoldMinutesLosses) return null;
    return [
      {
        value: metrics.avgHoldMinutesWins,
        label: "Wins",
        frontColor: Colors.secondary,
      },
      {
        value: metrics.avgHoldMinutesLosses,
        label: "Losses",
        frontColor: Colors.danger,
      },
    ];
  }, [metrics]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Trades Per Day */}
      <ChartCard
        title="Trades Per Day"
        subtitle="Color-coded: green (healthy), amber (elevated), red (overtrading)"
      >
        {tradesPerDay.length > 0 && (
          <BarChart
            data={tradesPerDay}
            width={CHART_WIDTH}
            height={180}
            barWidth={32}
            spacing={16}
            noOfSections={5}
            barBorderRadius={4}
            yAxisColor={Colors.border}
            xAxisColor={Colors.border}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            isAnimated
          />
        )}
      </ChartCard>

      {/* P/L Timeline */}
      <ChartCard
        title="Cumulative P/L Timeline"
        subtitle="Shows how your P/L evolves over time"
      >
        {pnlTimeline.length > 0 ? (
          <LineChart
            data={pnlTimeline}
            width={CHART_WIDTH}
            height={180}
            color={Colors.secondary}
            thickness={2}
            noOfSections={4}
            areaChart
            startFillColor={Colors.secondary + "30"}
            endFillColor={Colors.secondary + "05"}
            yAxisColor={Colors.border}
            xAxisColor={Colors.border}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            dataPointsColor={Colors.secondary}
            isAnimated
          />
        ) : (
          <Text style={styles.noData}>Insufficient data</Text>
        )}
      </ChartCard>

      {/* Time Between Trades */}
      <ChartCard
        title="Time Between Trades"
        subtitle="Distribution of gaps (minutes) — lower is more impulsive"
      >
        {gapDistribution.length > 0 && (
          <LineChart
            data={gapDistribution}
            width={CHART_WIDTH}
            height={180}
            color={Colors.primaryLight}
            thickness={2}
            noOfSections={4}
            areaChart
            startFillColor={Colors.primary + "40"}
            endFillColor={Colors.primary + "05"}
            yAxisColor={Colors.border}
            xAxisColor={Colors.border}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            dataPointsColor={Colors.primaryLight}
            isAnimated
          />
        )}
      </ChartCard>

      {/* Hourly Heatmap */}
      <ChartCard
        title="Hourly Trading Heatmap"
        subtitle="Darker blocks = more trades at that hour"
      >
        <View style={styles.heatmapGrid}>
          {hourlyCounts.map((count, hour) => {
            const max = Math.max(...hourlyCounts, 1);
            const intensity = count / max;
            const color = hexToRgba(Colors.primary, 0.15 + intensity * 0.75);
            return (
              <View key={hour} style={[styles.heatCell, { backgroundColor: color }]}>
                <Text style={styles.heatLabel}>{hour}</Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.heatLegend}>Low → High</Text>
      </ChartCard>

      {/* Post-Loss Trades */}
      <ChartCard
        title="Trades Within 30min After Loss"
        subtitle="Shows revenge trading patterns — higher bars = more impulsive"
      >
        {postLossData.length > 0 ? (
          <BarChart
            data={postLossData}
            width={CHART_WIDTH}
            height={180}
            barWidth={20}
            spacing={8}
            noOfSections={5}
            barBorderRadius={4}
            yAxisColor={Colors.border}
            xAxisColor={Colors.border}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            isAnimated
          />
        ) : (
          <Text style={styles.noData}>Insufficient data</Text>
        )}
      </ChartCard>

      {/* Hold Time Comparison */}
      <ChartCard
        title="Avg Hold Time: Wins vs Losses"
        subtitle="Loss aversion shows when you hold losers longer than winners"
      >
        {holdTimeData ? (
          <BarChart
            data={holdTimeData}
            width={CHART_WIDTH}
            height={180}
            barWidth={60}
            spacing={40}
            noOfSections={4}
            barBorderRadius={4}
            yAxisColor={Colors.border}
            xAxisColor={Colors.border}
            yAxisTextStyle={styles.axisText}
            xAxisLabelTextStyle={styles.axisText}
            yAxisLabelSuffix=" min"
            isAnimated
          />
        ) : (
          <Text style={styles.noData}>Hold time data not available</Text>
        )}
      </ChartCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  axisText: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  heatmapGrid: {
    width: CHART_WIDTH,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    justifyContent: "space-between",
  },
  heatCell: {
    width: (CHART_WIDTH - Spacing.xs * 5) / 6,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  heatLabel: {
    fontSize: 10,
    color: Colors.textPrimary,
  },
  heatLegend: {
    ...Typography.caption,
    marginTop: Spacing.sm,
    color: Colors.textMuted,
  },
  noData: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: "center",
    padding: Spacing.xl,
  },
});

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
