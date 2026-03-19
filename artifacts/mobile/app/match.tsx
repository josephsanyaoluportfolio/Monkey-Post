import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

import ConfirmModal from "@/components/ConfirmModal";
import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import type { Team } from "@/types/game";

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MatchScreen() {
  const { colorScheme, toggleTheme } = useTheme();
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
  } = useGame();

  const teamA = getCurrentTeamA();
  const teamB = getCurrentTeamB();
  const [nextA, nextB] = getNextTeams();

  const timerAnim = useRef(new Animated.Value(1)).current;

  const [endModal, setEndModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [drawModal, setDrawModal] = useState(false);
  const [winModal, setWinModal] = useState<{ id: string; label: string } | null>(null);

  const remaining = state.timerSeconds;
  const isRed = remaining <= 120 && remaining > 0;
  const isPulsing = remaining <= 60 && remaining > 0;

  useEffect(() => {
    if (state.phase === "setup") {
      router.replace("/");
    }
  }, [state.phase]);

  useEffect(() => {
    if (isPulsing && state.timerRunning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(timerAnim, {
            toValue: 1.07,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(timerAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
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

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;
  const s = makeStyles(colors, isDark);

  if (!teamA || !teamB || !state.currentMatch) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={s.centered}>
          <Text style={[s.emptyText, { color: colors.text }]}>No active match</Text>
          <Pressable
            style={[s.pill, { backgroundColor: colors.tint, marginTop: 16 }]}
            onPress={() => router.replace("/")}
          >
            <Text style={s.pillText}>Go to Setup</Text>
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
      {/* ---- Modals ---- */}
      <ConfirmModal
        visible={endModal}
        title="End Today's Game?"
        message="All progress and scores will be reset. This cannot be undone."
        confirmText="Yes, End Game"
        cancelText="Cancel"
        confirmDestructive
        onConfirm={() => {
          setEndModal(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          endGame();
          router.replace("/");
        }}
        onCancel={() => setEndModal(false)}
      />

      <ConfirmModal
        visible={resetModal}
        title="Reset Timer?"
        message="Are you sure you want to reset the match timer back to the start?"
        confirmText="Yes, Reset"
        cancelText="No"
        onConfirm={() => {
          setResetModal(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          resetTimer();
        }}
        onCancel={() => setResetModal(false)}
      />

      <ConfirmModal
        visible={drawModal}
        title="Draw?"
        message="Both teams leave the pitch. The next two teams in queue will enter."
        confirmText="Confirm Draw"
        cancelText="Cancel"
        onConfirm={() => {
          setDrawModal(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          handleDraw();
        }}
        onCancel={() => setDrawModal(false)}
      />

      {winModal && (
        <ConfirmModal
          visible={!!winModal}
          title={`${winModal.label} Wins?`}
          message="The winning team stays. The losing team goes to the back of the queue."
          confirmText="Confirm Win"
          cancelText="Cancel"
          onConfirm={() => {
            const id = winModal.id;
            setWinModal(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleWin(id);
          }}
          onCancel={() => setWinModal(null)}
        />
      )}

      {/* ---- Top Bar ---- */}
      <View style={[s.topBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleTheme();
          }}
          style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather
            name={isDark ? "sun" : "moon"}
            size={17}
            color={isDark ? "#F59E0B" : "#6B7280"}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push("/leaderboard")}
          style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="award" size={17} color={colors.tint} />
        </Pressable>

        <Text style={[s.topBarMode, { color: colors.textSecondary }]}>
          {state.config?.matchMode === "one_goal" ? "⚡ One Goal" : "📊 Count Goals"} ·{" "}
          {state.config?.matchDuration}min
        </Text>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setEndModal(true);
          }}
          style={[s.endBtn, { backgroundColor: colors.danger }]}
        >
          <Feather name="x-circle" size={15} color="#fff" />
          <Text style={s.endBtnText}>End</Text>
        </Pressable>
      </View>

      {/* ---- Main Content ---- */}
      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + 24 + webBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Teams */}
        <View style={s.teamsRow}>
          <TeamCard
            team={teamA}
            color={teamAColor}
            isDark={isDark}
            colors={colors}
            side="A"
            scoreValue={state.currentMatch.scoreA}
            showScore={state.config?.matchMode === "count_goals"}
            onIncrement={() => incrementScore("A")}
            onDecrement={() => decrementScore("A")}
            onWin={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setWinModal({ id: teamA.id, label: teamA.label });
            }}
          />

          <View style={s.vsCol}>
            <View style={[s.vsBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.vsText, { color: colors.textSecondary }]}>VS</Text>
            </View>
          </View>

          <TeamCard
            team={teamB}
            color={teamBColor}
            isDark={isDark}
            colors={colors}
            side="B"
            scoreValue={state.currentMatch.scoreB}
            showScore={state.config?.matchMode === "count_goals"}
            onIncrement={() => incrementScore("B")}
            onDecrement={() => decrementScore("B")}
            onWin={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setWinModal({ id: teamB.id, label: teamB.label });
            }}
          />
        </View>

        {/* Timer */}
        <View style={[s.timerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.timerRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setResetModal(true);
              }}
              style={s.timerSideBtn}
            >
              <View style={[s.timerBtnCircle, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: colors.border }]}>
                <Feather name="rotate-ccw" size={19} color={colors.textSecondary} />
              </View>
              <Text style={[s.timerSideLabel, { color: colors.textSecondary }]}>Reset</Text>
            </Pressable>

            <Animated.View style={{ transform: [{ scale: timerAnim }] }}>
              <Text
                style={[
                  s.timerText,
                  {
                    color:
                      remaining === 0
                        ? colors.textSecondary
                        : isRed
                        ? colors.timerRed
                        : colors.text,
                  },
                ]}
              >
                {formatTime(remaining)}
              </Text>
            </Animated.View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                state.timerRunning ? pauseTimer() : resumeTimer();
              }}
              style={s.timerSideBtn}
            >
              <View style={[s.timerBtnCircle, { backgroundColor: isDark ? "#14532d30" : "#dcfce7", borderColor: colors.tint + "44" }]}>
                <Feather
                  name={state.timerRunning ? "pause" : "play"}
                  size={19}
                  color={colors.tint}
                />
              </View>
              <Text style={[s.timerSideLabel, { color: colors.tint }]}>
                {state.timerRunning ? "Pause" : "Play"}
              </Text>
            </Pressable>
          </View>

          {remaining === 0 && (
            <View style={[s.timerWarning, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}>
              <Feather name="clock" size={13} color={colors.textSecondary} />
              <Text style={[s.timerWarningText, { color: colors.textSecondary }]}>
                Time's up — select winner or draw
              </Text>
            </View>
          )}
          {isRed && remaining > 0 && (
            <View style={[s.timerWarning, { backgroundColor: isDark ? "#3d1010" : "#fef2f2" }]}>
              <Feather name="alert-circle" size={13} color={colors.timerRed} />
              <Text style={[s.timerWarningText, { color: colors.timerRed }]}>
                {remaining <= 60 ? "Final minute!" : "Under 2 minutes!"}
              </Text>
            </View>
          )}
        </View>

        {/* Draw */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDrawModal(true);
          }}
          style={({ pressed }) => [
            s.drawBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Feather name="minus-circle" size={18} color={colors.textSecondary} />
          <Text style={[s.drawBtnText, { color: colors.textSecondary }]}>DRAW</Text>
        </Pressable>

        {/* Next Match Preview */}
        {(nextA || nextB) && (
          <View style={[s.nextCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.nextHeaderRow}>
              <Feather name="clock" size={13} color={colors.textSecondary} />
              <Text style={[s.nextLabel, { color: colors.textSecondary }]}>
                Next Match
              </Text>
            </View>
            <View style={s.nextTeamsRow}>
              {nextA && (
                <View style={[s.nextPill, { backgroundColor: Colors.teamColors[nextA.colorIndex] + "22" }]}>
                  <View style={[s.nextDot, { backgroundColor: Colors.teamColors[nextA.colorIndex] }]} />
                  <Text style={[s.nextPillText, { color: Colors.teamColors[nextA.colorIndex] }]}>
                    {nextA.label}
                  </Text>
                </View>
              )}
              {nextA && nextB && (
                <Text style={[s.nextVs, { color: colors.textSecondary }]}>vs</Text>
              )}
              {nextB && (
                <View style={[s.nextPill, { backgroundColor: Colors.teamColors[nextB.colorIndex] + "22" }]}>
                  <View style={[s.nextDot, { backgroundColor: Colors.teamColors[nextB.colorIndex] }]} />
                  <Text style={[s.nextPillText, { color: Colors.teamColors[nextB.colorIndex] }]}>
                    {nextB.label}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Queue with player names */}
        {state.queue.length > 0 && (
          <View style={[s.queueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.queueTitle, { color: colors.textSecondary }]}>
              Waiting Queue — {state.queue.length} team{state.queue.length > 1 ? "s" : ""}
            </Text>
            {state.queue.map((tid, i) => {
              const t = state.teams.find((t) => t.id === tid);
              if (!t) return null;
              const color = Colors.teamColors[t.colorIndex];
              return (
                <View
                  key={tid}
                  style={[
                    s.queueRow,
                    {
                      borderColor: color + "44",
                      backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                    },
                  ]}
                >
                  <View style={[s.queueBadge, { backgroundColor: color }]}>
                    <Text style={s.queueBadgeText}>{i + 3}</Text>
                  </View>
                  <View style={s.queueInfo}>
                    <Text style={[s.queueTeamName, { color: colors.text }]}>
                      {t.label}
                    </Text>
                    <Text style={[s.queuePlayers, { color: colors.textSecondary }]}>
                      {t.players.map((p) => p.name).join(" · ")}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function TeamCard({
  team,
  color,
  isDark,
  colors,
  side,
  scoreValue,
  showScore,
  onIncrement,
  onDecrement,
  onWin,
}: {
  team: Team | undefined;
  color: string;
  isDark: boolean;
  colors: typeof Colors.light;
  side: "A" | "B";
  scoreValue: number;
  showScore: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onWin: () => void;
}) {
  if (!team) return null;
  const s = makeStyles(colors, isDark);
  return (
    <View style={[s.teamCard, { borderColor: color, backgroundColor: isDark ? "#1e293b" : "#fff" }]}>
      <View style={[s.teamHeader2, { backgroundColor: color }]}>
        <Text style={s.teamHeaderLabel}>{team.label}</Text>
      </View>
      <View style={s.teamBody}>
        {team.players.map((p) => (
          <View key={p.id} style={s.playerRow2}>
            <View style={[s.playerDot2, { backgroundColor: color }]} />
            <Text style={[s.playerName2, { color: colors.text }]} numberOfLines={1}>
              {p.name}
            </Text>
          </View>
        ))}

        {showScore && (
          <View style={s.scoreRow}>
            <Pressable
              onPress={onDecrement}
              style={[s.scoreBtn, { borderColor: color }]}
            >
              <Feather name="minus" size={16} color={color} />
            </Pressable>
            <Text style={[s.scoreNum, { color }]}>{scoreValue}</Text>
            <Pressable
              onPress={onIncrement}
              style={[s.scoreBtn, { borderColor: color }]}
            >
              <Feather name="plus" size={16} color={color} />
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={onWin}
          style={({ pressed }) => [
            s.winBtn,
            { backgroundColor: color, opacity: pressed ? 0.82 : 1 },
          ]}
        >
          <Feather name="award" size={15} color="#fff" />
          <Text style={s.winBtnText}>WIN</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyText: { fontSize: 18, fontFamily: "Inter_500Medium" },
    pill: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
    pillText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    topBarMode: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      textAlign: "center",
    },
    endBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 20,
    },
    endBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

    scroll: { padding: 14, gap: 12 },

    teamsRow: { flexDirection: "row", gap: 8, alignItems: "stretch" },
    teamCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 2,
      overflow: "hidden",
    },
    teamHeader2: { paddingVertical: 8, paddingHorizontal: 10 },
    teamHeaderLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
    teamBody: { padding: 10, gap: 5 },
    playerRow2: { flexDirection: "row", alignItems: "center", gap: 6 },
    playerDot2: { width: 6, height: 6, borderRadius: 3 },
    playerName2: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
    scoreRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 6,
    },
    scoreBtn: {
      width: 30,
      height: 30,
      borderRadius: 8,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    scoreNum: { fontSize: 24, fontFamily: "Inter_700Bold", minWidth: 32, textAlign: "center" },
    winBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      marginTop: 8,
      paddingVertical: 9,
      borderRadius: 10,
    },
    winBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

    vsCol: { alignItems: "center", justifyContent: "center", width: 32 },
    vsBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    vsText: { fontSize: 10, fontFamily: "Inter_700Bold" },

    timerCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 14,
      alignItems: "center",
      gap: 10,
    },
    timerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    timerSideBtn: { alignItems: "center", gap: 5, minWidth: 58 },
    timerBtnCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    timerSideLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
    timerText: { fontSize: 56, fontFamily: "Inter_700Bold", letterSpacing: -1 },
    timerWarning: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
    },
    timerWarningText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

    drawBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: 1.5,
      alignSelf: "center",
      paddingHorizontal: 32,
    },
    drawBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },

    nextCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
    nextHeaderRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    nextLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    nextTeamsRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
    nextPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    nextDot: { width: 7, height: 7, borderRadius: 3.5 },
    nextPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    nextVs: { fontSize: 12, fontFamily: "Inter_500Medium" },

    queueCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
    queueTitle: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    queueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 10,
      borderWidth: 1,
      padding: 10,
    },
    queueBadge: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    queueBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
    queueInfo: { flex: 1, gap: 2 },
    queueTeamName: { fontSize: 14, fontFamily: "Inter_700Bold" },
    queuePlayers: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  });
