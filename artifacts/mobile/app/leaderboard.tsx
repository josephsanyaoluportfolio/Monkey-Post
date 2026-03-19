import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import type { Team } from "@/types/game";

function getRankEmoji(rank: number): string {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return `${rank + 1}.`;
}

export default function LeaderboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { getLeaderboard, state } = useGame();

  const leaderboard = getLeaderboard();
  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  const s = styles(colors, isDark);

  const renderItem = ({ item, index }: { item: Team; index: number }) => {
    const color = Colors.teamColors[item.colorIndex];
    const isTop = index === 0;
    return (
      <View
        style={[
          s.row,
          {
            backgroundColor: isTop ? color + "18" : colors.card,
            borderColor: isTop ? color : colors.border,
          },
        ]}
      >
        <Text style={s.rank}>
          {getRankEmoji(index)}
        </Text>
        <View style={[s.colorDot, { backgroundColor: color }]} />
        <View style={s.teamInfo}>
          <Text style={[s.teamLabel, { color: colors.text }]}>{item.label}</Text>
          <Text style={[s.players, { color: colors.textSecondary }]}>
            {item.players.map((p) => p.name).join(", ")}
          </Text>
        </View>
        <View style={s.stats}>
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: color }]}>{item.wins}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Wins</Text>
          </View>
          <View style={[s.statDivider, { backgroundColor: colors.border }]} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: colors.text }]}>{item.matchesPlayed}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Played</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        s.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + webTop,
        },
      ]}
    >
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={s.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[s.title, { color: colors.text }]}>Leaderboard</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          s.list,
          { paddingBottom: insets.bottom + 24 + webBottom },
        ]}
        ListHeaderComponent={
          <View style={s.statsBar}>
            <View style={[s.statsBarItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="users" size={16} color={colors.tint} />
              <Text style={[s.statsBarNum, { color: colors.text }]}>{state.teams.length}</Text>
              <Text style={[s.statsBarLabel, { color: colors.textSecondary }]}>Teams</Text>
            </View>
            <View style={[s.statsBarItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="activity" size={16} color={colors.tint} />
              <Text style={[s.statsBarNum, { color: colors.text }]}>
                {state.teams.reduce((sum, t) => sum + t.matchesPlayed, 0) / 2}
              </Text>
              <Text style={[s.statsBarLabel, { color: colors.textSecondary }]}>Matches</Text>
            </View>
            <View style={[s.statsBarItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="award" size={16} color={colors.tint} />
              <Text style={[s.statsBarNum, { color: colors.text }]}>
                {state.teams.reduce((sum, t) => sum + t.wins, 0)}
              </Text>
              <Text style={[s.statsBarLabel, { color: colors.textSecondary }]}>Total Wins</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Feather name="award" size={40} color={colors.border} />
            <Text style={[s.emptyText, { color: colors.textSecondary }]}>
              No teams yet
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = (colors: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backBtn: { padding: 6 },
    title: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
    },
    list: { padding: 16, gap: 10 },
    statsBar: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 16,
    },
    statsBarItem: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      padding: 12,
      alignItems: "center",
      gap: 4,
    },
    statsBarNum: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
    },
    statsBarLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 16,
      borderWidth: 1.5,
      padding: 14,
    },
    rank: {
      fontSize: 18,
      minWidth: 32,
      textAlign: "center",
      fontFamily: "Inter_700Bold",
    },
    colorDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    teamInfo: {
      flex: 1,
      gap: 2,
    },
    teamLabel: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
    players: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
    },
    stats: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    statItem: { alignItems: "center", minWidth: 38 },
    statNum: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
    },
    statDivider: {
      width: 1,
      height: 28,
    },
    empty: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 60,
      gap: 12,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: "Inter_500Medium",
    },
  });
