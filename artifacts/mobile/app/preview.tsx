import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";

export default function PreviewScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { state, confirmStart, endGame } = useGame();

  const [phase, setPhase] = useState<"randomising" | "ready">("randomising");
  const spinAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state.phase !== "preview") {
      router.replace("/");
      return;
    }

    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    );
    const dots = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, { toValue: 3, duration: 600, useNativeDriver: false }),
        Animated.timing(dotsAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ])
    );
    spin.start();
    dots.start();

    const timer = setTimeout(() => {
      spin.stop();
      dots.stop();
      setPhase("ready");
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);

    return () => {
      clearTimeout(timer);
      spin.stop();
      dots.stop();
    };
  }, []);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    confirmStart();
    router.replace("/match");
  };

  const handleBack = () => {
    endGame();
    router.replace("/");
  };

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;
  const s = makeStyles(colors, isDark);

  if (phase === "randomising") {
    const rotate = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

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
        <View style={s.randomising}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <View style={[s.ball, { backgroundColor: colors.tint }]}>
              <Feather name="rotate-cw" size={40} color="#fff" />
            </View>
          </Animated.View>
          <Text style={[s.randTitle, { color: colors.text }]}>
            Randomising Players...
          </Text>
          <Text style={[s.randSub, { color: colors.textSecondary }]}>
            Shuffling and building teams
          </Text>
        </View>
      </View>
    );
  }

  const playingTeamA = state.currentMatch
    ? state.teams.find((t) => t.id === state.currentMatch!.teamAId)
    : null;
  const playingTeamB = state.currentMatch
    ? state.teams.find((t) => t.id === state.currentMatch!.teamBId)
    : null;
  const waitingTeams = state.queue.map((id) =>
    state.teams.find((t) => t.id === id)
  );

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
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </Pressable>
        <Text style={[s.topTitle, { color: colors.text }]}>Teams Ready</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeIn }}>
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            { paddingBottom: insets.bottom + webBottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.banner, { backgroundColor: isDark ? "#14532d30" : "#dcfce7" }]}>
            <Feather name="check-circle" size={18} color={colors.tint} />
            <Text style={[s.bannerText, { color: colors.tint }]}>
              {state.teams.length} teams created from {state.config?.playerNames.filter((n) => n.trim()).length} players
            </Text>
          </View>

          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
            First Match
          </Text>

          <View style={s.firstMatchRow}>
            {playingTeamA && (
              <View
                style={[
                  s.teamCard,
                  {
                    borderColor: Colors.teamColors[playingTeamA.colorIndex],
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                  },
                ]}
              >
                <View
                  style={[
                    s.teamHeader,
                    { backgroundColor: Colors.teamColors[playingTeamA.colorIndex] },
                  ]}
                >
                  <Text style={s.teamLabel}>{playingTeamA.label}</Text>
                </View>
                {playingTeamA.players.map((p) => (
                  <View key={p.id} style={s.playerRow}>
                    <View
                      style={[
                        s.playerDot,
                        { backgroundColor: Colors.teamColors[playingTeamA.colorIndex] },
                      ]}
                    />
                    <Text style={[s.playerName, { color: colors.text }]}>
                      {p.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={s.vsBox}>
              <Text style={[s.vsText, { color: colors.textSecondary }]}>vs</Text>
            </View>

            {playingTeamB && (
              <View
                style={[
                  s.teamCard,
                  {
                    borderColor: Colors.teamColors[playingTeamB.colorIndex],
                    backgroundColor: isDark ? "#1e293b" : "#fff",
                  },
                ]}
              >
                <View
                  style={[
                    s.teamHeader,
                    { backgroundColor: Colors.teamColors[playingTeamB.colorIndex] },
                  ]}
                >
                  <Text style={s.teamLabel}>{playingTeamB.label}</Text>
                </View>
                {playingTeamB.players.map((p) => (
                  <View key={p.id} style={s.playerRow}>
                    <View
                      style={[
                        s.playerDot,
                        { backgroundColor: Colors.teamColors[playingTeamB.colorIndex] },
                      ]}
                    />
                    <Text style={[s.playerName, { color: colors.text }]}>
                      {p.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {waitingTeams.length > 0 && (
            <>
              <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
                Waiting Queue ({waitingTeams.length} teams)
              </Text>
              {waitingTeams.map((team, i) => {
                if (!team) return null;
                const color = Colors.teamColors[team.colorIndex];
                return (
                  <View
                    key={team.id}
                    style={[
                      s.queueCard,
                      {
                        backgroundColor: isDark ? "#1e293b" : "#fff",
                        borderColor: color + "55",
                      },
                    ]}
                  >
                    <View style={[s.queueBadge, { backgroundColor: color }]}>
                      <Text style={s.queueBadgeNum}>{i + 3}</Text>
                    </View>
                    <View style={s.queueInfo}>
                      <Text style={[s.queueTeamName, { color: colors.text }]}>
                        {team.label}
                      </Text>
                      <Text style={[s.queuePlayers, { color: colors.textSecondary }]}>
                        {team.players.map((p) => p.name).join(" · ")}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      </Animated.View>

      <View
        style={[
          s.footer,
          {
            paddingBottom: insets.bottom + 16 + webBottom,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            s.startBtn,
            { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleStart}
        >
          <Feather name="play-circle" size={22} color="#fff" />
          <Text style={s.startBtnText}>Start Game — Start Timer</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    randomising: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 20,
    },
    ball: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: "center",
      justifyContent: "center",
    },
    randTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    randSub: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backBtn: { padding: 6 },
    topTitle: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
    },
    scroll: { padding: 16, gap: 12 },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderRadius: 12,
      marginBottom: 4,
    },
    bannerText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginTop: 8,
    },
    firstMatchRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
    },
    teamCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 2,
      overflow: "hidden",
    },
    teamHeader: {
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    teamLabel: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderTopWidth: 0.5,
      borderTopColor: "rgba(0,0,0,0.06)",
    },
    playerDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    playerName: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    vsBox: {
      width: 30,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 18,
    },
    vsText: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
    },
    queueCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderRadius: 14,
      borderWidth: 1.5,
      padding: 14,
    },
    queueBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    queueBadgeNum: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    queueInfo: { flex: 1, gap: 3 },
    queueTeamName: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
    queuePlayers: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    footer: {
      paddingTop: 12,
      paddingHorizontal: 20,
      borderTopWidth: 1,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
      borderRadius: 16,
    },
    startBtnText: {
      fontSize: 17,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
  });
