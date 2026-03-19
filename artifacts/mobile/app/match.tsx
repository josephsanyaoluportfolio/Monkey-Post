import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MatchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const {
    state,
    handleWin,
    handleDraw,
    incrementScore,
    decrementScore,
    resetTimer,
    pauseTimer,
    resumeTimer,
    endGame,
    getCurrentTeamA,
    getCurrentTeamB,
    getNextTeams,
    getLeaderboard,
  } = useGame();

  const teamA = getCurrentTeamA();
  const teamB = getCurrentTeamB();
  const [nextA, nextB] = getNextTeams();

  const timerAnim = useRef(new Animated.Value(1)).current;
  const [showDrawConfirm, setShowDrawConfirm] = useState(false);
  const [pendingWinnerId, setPendingWinnerId] = useState<string | null>(null);

  const remaining = state.timerSeconds;
  const isRed = remaining <= 120;
  const isPulsing = remaining <= 60;

  useEffect(() => {
    if (state.phase !== "playing") {
      router.replace("/");
    }
  }, [state.phase]);

  useEffect(() => {
    if (isPulsing && state.timerRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(timerAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
          Animated.timing(timerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      timerAnim.setValue(1);
    }
  }, [isPulsing, state.timerRunning]);

  const teamAColor = teamA ? Colors.teamColors[teamA.colorIndex] : "#22C55E";
  const teamBColor = teamB ? Colors.teamColors[teamB.colorIndex] : "#3B82F6";

  const confirmEndGame = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "End Today's Game?",
      "All progress and scores will be reset.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, End Game",
          style: "destructive",
          onPress: () => {
            endGame();
            router.replace("/");
          },
        },
      ]
    );
  }, [endGame]);

  const confirmResetTimer = useCallback(() => {
    Alert.alert(
      "Reset Timer?",
      "Are you sure you want to reset the match timer?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Reset",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            resetTimer();
          },
        },
      ]
    );
  }, [resetTimer]);

  const confirmWin = useCallback(
    (teamId: string, teamLabel: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(
        `${teamLabel} Wins?`,
        "This will rotate teams and reset the timer.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Confirm Win",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              handleWin(teamId);
            },
          },
        ]
      );
    },
    [handleWin]
  );

  const confirmDraw = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Draw?",
      "Both teams will leave and the next two teams will enter.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm Draw",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            handleDraw();
          },
        },
      ]
    );
  }, [handleDraw]);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;
  const s = styles(colors, isDark);

  if (!teamA || !teamB || !state.currentMatch) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={s.centered}>
          <Text style={[s.emptyText, { color: colors.text }]}>No active match</Text>
          <Pressable
            style={[s.btnPrimary, { backgroundColor: colors.tint, marginTop: 16 }]}
            onPress={() => router.replace("/")}
          >
            <Text style={s.btnPrimaryText}>Go to Setup</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        s.root,
        { backgroundColor: colors.background, paddingTop: insets.top + webTop },
      ]}
    >
      <View style={s.topBar}>
        <Pressable
          onPress={() => router.push("/leaderboard")}
          style={s.topBarBtn}
        >
          <Feather name="award" size={22} color={colors.tint} />
        </Pressable>

        <Text style={s.topBarTitle}>
          {state.config?.matchMode === "one_goal" ? "One Goal = Out" : "Count Goals"}
        </Text>

        <Pressable onPress={confirmEndGame} style={s.endBtn}>
          <Feather name="x-circle" size={16} color="#fff" />
          <Text style={s.endBtnText}>End</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 24 + webBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.teamsRow}>
          <View
            style={[
              s.teamCard,
              { borderColor: teamAColor, backgroundColor: isDark ? "#1e293b" : "#fff" },
            ]}
          >
            <View style={[s.teamBadge, { backgroundColor: teamAColor }]}>
              <Text style={s.teamBadgeText}>{teamA.label}</Text>
            </View>
            {teamA.players.map((p) => (
              <Text key={p.id} style={[s.playerName, { color: colors.text }]}>
                {p.name}
              </Text>
            ))}

            {state.config?.matchMode === "count_goals" && (
              <View style={s.scoreRow}>
                <Pressable
                  onPress={() => decrementScore("A")}
                  style={[s.scoreBtn, { borderColor: teamAColor }]}
                >
                  <Feather name="minus" size={18} color={teamAColor} />
                </Pressable>
                <Text style={[s.scoreNum, { color: teamAColor }]}>
                  {state.currentMatch.scoreA}
                </Text>
                <Pressable
                  onPress={() => incrementScore("A")}
                  style={[s.scoreBtn, { borderColor: teamAColor }]}
                >
                  <Feather name="plus" size={18} color={teamAColor} />
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => confirmWin(teamA.id, teamA.label)}
              style={({ pressed }) => [
                s.winBtn,
                { backgroundColor: teamAColor, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="award" size={16} color="#fff" />
              <Text style={s.winBtnText}>WIN</Text>
            </Pressable>
          </View>

          <View style={s.vsColumn}>
            <View style={[s.vsBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.vsText, { color: colors.textSecondary }]}>VS</Text>
            </View>
          </View>

          <View
            style={[
              s.teamCard,
              { borderColor: teamBColor, backgroundColor: isDark ? "#1e293b" : "#fff" },
            ]}
          >
            <View style={[s.teamBadge, { backgroundColor: teamBColor }]}>
              <Text style={s.teamBadgeText}>{teamB.label}</Text>
            </View>
            {teamB.players.map((p) => (
              <Text key={p.id} style={[s.playerName, { color: colors.text }]}>
                {p.name}
              </Text>
            ))}

            {state.config?.matchMode === "count_goals" && (
              <View style={s.scoreRow}>
                <Pressable
                  onPress={() => decrementScore("B")}
                  style={[s.scoreBtn, { borderColor: teamBColor }]}
                >
                  <Feather name="minus" size={18} color={teamBColor} />
                </Pressable>
                <Text style={[s.scoreNum, { color: teamBColor }]}>
                  {state.currentMatch.scoreB}
                </Text>
                <Pressable
                  onPress={() => incrementScore("B")}
                  style={[s.scoreBtn, { borderColor: teamBColor }]}
                >
                  <Feather name="plus" size={18} color={teamBColor} />
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => confirmWin(teamB.id, teamB.label)}
              style={({ pressed }) => [
                s.winBtn,
                { backgroundColor: teamBColor, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="award" size={16} color="#fff" />
              <Text style={s.winBtnText}>WIN</Text>
            </Pressable>
          </View>
        </View>

        <View style={[s.timerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.timerRow}>
            <Pressable onPress={confirmResetTimer} style={s.timerSideBtn}>
              <Feather name="rotate-ccw" size={20} color={colors.textSecondary} />
              <Text style={[s.timerSideBtnText, { color: colors.textSecondary }]}>Reset</Text>
            </Pressable>

            <Animated.View style={{ transform: [{ scale: timerAnim }] }}>
              <Text
                style={[
                  s.timerText,
                  {
                    color: isRed ? colors.timerRed : colors.text,
                  },
                ]}
              >
                {formatTime(remaining)}
              </Text>
            </Animated.View>

            <Pressable
              onPress={state.timerRunning ? pauseTimer : resumeTimer}
              style={s.timerSideBtn}
            >
              <Feather
                name={state.timerRunning ? "pause" : "play"}
                size={20}
                color={colors.tint}
              />
              <Text style={[s.timerSideBtnText, { color: colors.tint }]}>
                {state.timerRunning ? "Pause" : "Play"}
              </Text>
            </Pressable>
          </View>
          {isRed && (
            <View style={[s.timerWarning, { backgroundColor: isDark ? "#3d1010" : "#fef2f2" }]}>
              <Feather name="alert-circle" size={12} color={colors.timerRed} />
              <Text style={[s.timerWarningText, { color: colors.timerRed }]}>
                {remaining <= 60 ? "Final minute!" : "Under 2 minutes!"}
              </Text>
            </View>
          )}
        </View>

        <View style={s.drawRow}>
          <Pressable
            onPress={confirmDraw}
            style={({ pressed }) => [
              s.drawBtn,
              {
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                borderColor: colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="minus-circle" size={18} color={colors.textSecondary} />
            <Text style={[s.drawBtnText, { color: colors.textSecondary }]}>DRAW</Text>
          </Pressable>
        </View>

        {(nextA || nextB) && (
          <View
            style={[
              s.nextCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={s.nextHeaderRow}>
              <Feather name="clock" size={13} color={colors.textSecondary} />
              <Text style={[s.nextLabel, { color: colors.textSecondary }]}>Next Match</Text>
            </View>
            <View style={s.nextTeamsRow}>
              {nextA && (
                <View style={[s.nextTeamPill, { backgroundColor: Colors.teamColors[nextA.colorIndex] + "22" }]}>
                  <View style={[s.nextDot, { backgroundColor: Colors.teamColors[nextA.colorIndex] }]} />
                  <Text style={[s.nextTeamText, { color: Colors.teamColors[nextA.colorIndex] }]}>
                    {nextA.label}
                  </Text>
                </View>
              )}
              {nextA && nextB && (
                <Text style={[s.nextVs, { color: colors.textSecondary }]}>vs</Text>
              )}
              {nextB && (
                <View style={[s.nextTeamPill, { backgroundColor: Colors.teamColors[nextB.colorIndex] + "22" }]}>
                  <View style={[s.nextDot, { backgroundColor: Colors.teamColors[nextB.colorIndex] }]} />
                  <Text style={[s.nextTeamText, { color: Colors.teamColors[nextB.colorIndex] }]}>
                    {nextB.label}
                  </Text>
                </View>
              )}
              {nextA && !nextB && (
                <Text style={[s.nextVs, { color: colors.textSecondary }]}>waits for winner</Text>
              )}
            </View>
          </View>
        )}

        {state.queue.length > 0 && (
          <View style={[s.queueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.queueTitle, { color: colors.textSecondary }]}>
              Waiting Queue ({state.queue.length})
            </Text>
            <View style={s.queueRow}>
              {state.queue.map((tid, i) => {
                const t = state.teams.find((t) => t.id === tid);
                if (!t) return null;
                return (
                  <View key={tid} style={[s.queuePill, { backgroundColor: Colors.teamColors[t.colorIndex] + "22" }]}>
                    <Text style={[s.queuePillText, { color: Colors.teamColors[t.colorIndex] }]}>
                      {t.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (colors: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyText: { fontSize: 18, fontFamily: "Inter_500Medium" },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#1e293b" : "#e5e7eb",
    },
    topBarBtn: {
      padding: 6,
    },
    topBarTitle: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.textSecondary,
    },
    endBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.danger,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },
    endBtnText: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    scroll: { padding: 16, gap: 14 },
    teamsRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "stretch",
    },
    teamCard: {
      flex: 1,
      borderRadius: 18,
      borderWidth: 2,
      padding: 14,
      gap: 6,
      minHeight: 160,
    },
    teamBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      marginBottom: 6,
    },
    teamBadgeText: {
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    playerName: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      lineHeight: 20,
    },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 8,
    },
    scoreBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    scoreNum: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      minWidth: 36,
      textAlign: "center",
    },
    winBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
      paddingVertical: 10,
      borderRadius: 12,
    },
    winBtnText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    vsColumn: {
      alignItems: "center",
      justifyContent: "center",
      width: 36,
    },
    vsBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    vsText: {
      fontSize: 11,
      fontFamily: "Inter_700Bold",
    },
    timerCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      alignItems: "center",
      gap: 10,
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    timerSideBtn: {
      alignItems: "center",
      gap: 4,
      minWidth: 56,
    },
    timerSideBtnText: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
    },
    timerText: {
      fontSize: 58,
      fontFamily: "Inter_700Bold",
      letterSpacing: -1,
      textAlign: "center",
    },
    timerWarning: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 20,
    },
    timerWarningText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    drawRow: {
      alignItems: "center",
    },
    drawBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 28,
      borderRadius: 14,
      borderWidth: 1.5,
    },
    drawBtnText: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
    },
    nextCard: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      gap: 8,
    },
    nextHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    nextLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    nextTeamsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    nextTeamPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    nextDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    nextTeamText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
    },
    nextVs: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    queueCard: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      gap: 10,
    },
    queueTitle: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    queueRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    queuePill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
    },
    queuePillText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    btnPrimary: {
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 14,
    },
    btnPrimaryText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
  });
