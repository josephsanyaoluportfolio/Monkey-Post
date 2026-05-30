import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import { useTheme } from "@/context/ThemeContext";
import type { GameConfig, MatchMode } from "@/types/game";

const DURATION_OPTIONS = [3, 4, 5, 6, 7, 8, 10, 12, 15];
const PLAYERS_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

export default function SetupScreen() {
  const { colorScheme, toggleTheme } = useTheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { prepareGame, state, stateLoaded, endGame } = useGame();

  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);

  useEffect(() => {
    if (!stateLoaded) return;
    if (state.phase === "playing" || state.phase === "preview") {
      setShowResumeModal(true);
    }
  }, [stateLoaded, state.phase]);

  const handleResume = useCallback(() => {
    setShowResumeModal(false);
    if (state.phase === "playing") {
      router.replace("/match");
    } else if (state.phase === "preview") {
      router.replace("/preview");
    }
  }, [state.phase]);

  const handleEndFromModal = useCallback(() => {
    setShowResumeModal(false);
    setShowEndConfirmModal(true);
  }, []);

  const handleConfirmEnd = useCallback(() => {
    setShowEndConfirmModal(false);
    endGame();
  }, [endGame]);

  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [matchDuration, setMatchDuration] = useState(5);
  const [matchMode, setMatchMode] = useState<MatchMode>("one_goal");
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const addPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerNames((prev) => [...prev, name]);
    setNewPlayerName("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [newPlayerName]);

  const removePlayer = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleRotate = useCallback(() => {
    const validPlayers = playerNames.filter((n) => n.trim());
    if (validPlayers.length < playersPerTeam * 2) {
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const config: GameConfig = {
      playersPerTeam,
      matchDuration,
      matchMode,
      playerNames: validPlayers,
    };
    prepareGame(config);
    router.replace("/preview");
  }, [playerNames, playersPerTeam, matchDuration, matchMode, prepareGame]);

  const validPlayerCount = playerNames.filter((n) => n.trim()).length;
  const minPlayersNeeded = playersPerTeam * 2;
  const canStart = validPlayerCount >= minPlayersNeeded;

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;
  const s = makeStyles(colors, isDark);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* Resume Match Modal */}
      <Modal
        visible={showResumeModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        <View style={s.modalOverlay}>
          <View
            style={[
              s.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={[s.modalIconRow]}>
              <View
                style={[s.modalIconCircle, { backgroundColor: isDark ? "#14532d30" : "#dcfce7" }]}
              >
                <Text style={s.modalEmoji}>⚽</Text>
              </View>
            </View>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              Match in Progress
            </Text>
            <Text style={[s.modalMessage, { color: colors.textSecondary }]}>
              You have an active match. Resume where you left off?
            </Text>
            <View style={s.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  s.modalBtnPrimary,
                  { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleResume}
              >
                <Feather name="play-circle" size={18} color="#fff" />
                <Text style={s.modalBtnPrimaryText}>Resume Match</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  s.modalBtnSecondary,
                  {
                    borderColor: colors.danger,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                onPress={handleEndFromModal}
              >
                <Feather name="x-circle" size={16} color={colors.danger} />
                <Text style={[s.modalBtnSecondaryText, { color: colors.danger }]}>
                  End Game
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* End Game Confirmation Modal */}
      <Modal
        visible={showEndConfirmModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowEndConfirmModal(false)}
      >
        <View style={s.modalOverlay}>
          <View
            style={[
              s.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={s.modalIconRow}>
              <View
                style={[s.modalIconCircle, { backgroundColor: isDark ? "#3d101030" : "#fef2f2" }]}
              >
                <Feather name="alert-triangle" size={28} color={colors.danger} />
              </View>
            </View>
            <Text style={[s.modalTitle, { color: colors.text }]}>
              Quit and Start Over?
            </Text>
            <Text style={[s.modalMessage, { color: colors.textSecondary }]}>
              This will end the current match and clear all progress. This cannot be undone.
            </Text>
            <View style={s.modalButtons}>
              <Pressable
                style={({ pressed }) => [
                  s.modalBtnPrimary,
                  { backgroundColor: colors.danger, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleConfirmEnd}
              >
                <Text style={s.modalBtnPrimaryText}>Yes, Start Over</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  s.modalBtnSecondary,
                  {
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                onPress={() => {
                  setShowEndConfirmModal(false);
                  setShowResumeModal(true);
                }}
              >
                <Text style={[s.modalBtnSecondaryText, { color: colors.text }]}>
                  No, Go Back
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            s.topBar,
            {
              paddingTop: insets.top + webTop + 8,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleTheme();
            }}
            style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather
              name={isDark ? "sun" : "moon"}
              size={18}
              color={isDark ? "#F59E0B" : "#6B7280"}
            />
          </Pressable>

          <View style={s.headerCenter}>
            <Text style={[s.title, { color: colors.tint }]}>Monkey Post</Text>
            <Text style={[s.subtitle, { color: colors.textSecondary }]}>
              Football Rotation
            </Text>
          </View>

          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            s.scroll,
            {
              paddingTop: 20,
              paddingBottom: insets.bottom + 100 + webBottom,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
              Players per Team
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipRow}
            >
              {PLAYERS_OPTIONS.map((num) => (
                <Pressable
                  key={num}
                  style={[
                    s.chip,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                    playersPerTeam === num && {
                      backgroundColor: colors.tint,
                      borderColor: colors.tint,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPlayersPerTeam(num);
                  }}
                >
                  <Text
                    style={[
                      s.chipText,
                      { color: colors.text },
                      playersPerTeam === num && { color: "#fff" },
                    ]}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
              Match Duration (minutes)
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipRow}
            >
              {DURATION_OPTIONS.map((d) => (
                <Pressable
                  key={d}
                  style={[
                    s.chip,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                    matchDuration === d && {
                      backgroundColor: colors.tint,
                      borderColor: colors.tint,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setMatchDuration(d);
                  }}
                >
                  <Text
                    style={[
                      s.chipText,
                      { color: colors.text },
                      matchDuration === d && { color: "#fff" },
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
              Match Mode
            </Text>
            <View style={s.modeRow}>
              <Pressable
                style={[
                  s.modeCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                  matchMode === "one_goal" && {
                    borderColor: colors.tint,
                    backgroundColor: isDark ? "#14532d30" : "#dcfce7",
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMatchMode("one_goal");
                }}
              >
                <View style={s.modeHeader}>
                  <Feather
                    name="zap"
                    size={20}
                    color={matchMode === "one_goal" ? colors.tint : colors.textSecondary}
                  />
                  {matchMode === "one_goal" && (
                    <View style={[s.modeBadge, { backgroundColor: colors.tint }]}>
                      <Feather name="check" size={10} color="#fff" />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    s.modeName,
                    { color: colors.text },
                    matchMode === "one_goal" && { color: colors.tint },
                  ]}
                >
                  One Goal = Out
                </Text>
                <Text style={[s.modeDesc, { color: colors.textSecondary }]}>
                  First goal ends the match
                </Text>
              </Pressable>

              <Pressable
                style={[
                  s.modeCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                  },
                  matchMode === "count_goals" && {
                    borderColor: colors.tint,
                    backgroundColor: isDark ? "#14532d30" : "#dcfce7",
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMatchMode("count_goals");
                }}
              >
                <View style={s.modeHeader}>
                  <Feather
                    name="bar-chart-2"
                    size={20}
                    color={matchMode === "count_goals" ? colors.tint : colors.textSecondary}
                  />
                  {matchMode === "count_goals" && (
                    <View style={[s.modeBadge, { backgroundColor: colors.tint }]}>
                      <Feather name="check" size={10} color="#fff" />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    s.modeName,
                    { color: colors.text },
                    matchMode === "count_goals" && { color: colors.tint },
                  ]}
                >
                  Count Goals
                </Text>
                <Text style={[s.modeDesc, { color: colors.textSecondary }]}>
                  Score until timer ends
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={s.section}>
            <View style={s.playerHeaderRow}>
              <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>
                Players
              </Text>
              <Text
                style={[
                  s.playerCount,
                  validPlayerCount < minPlayersNeeded
                    ? { color: colors.danger }
                    : { color: colors.tint },
                ]}
              >
                {validPlayerCount} / {minPlayersNeeded} min
              </Text>
            </View>

            {playerNames.map((name, index) => (
              <View key={index} style={s.playerRow}>
                <View style={[s.playerNum, { backgroundColor: colors.border }]}>
                  <Text style={[s.playerNumText, { color: colors.textSecondary }]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[s.playerNameText, { color: colors.text }]}>
                  {name}
                </Text>
                <Pressable
                  onPress={() => removePlayer(index)}
                  style={s.removeBtn}
                >
                  <Feather name="x" size={16} color={colors.danger} />
                </Pressable>
              </View>
            ))}

            <View style={s.addRow}>
              <TextInput
                ref={inputRef}
                style={[
                  s.playerInput,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.card,
                    color: colors.text,
                  },
                ]}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                placeholder="Type player name..."
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={addPlayer}
              />
              <Pressable
                onPress={addPlayer}
                style={[s.addBtn, { backgroundColor: colors.tint }]}
              >
                <Feather name="plus" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </ScrollView>

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
          {!canStart && (
            <Text style={[s.hint, { color: colors.danger }]}>
              Need at least {minPlayersNeeded} players for{" "}
              {Math.ceil(minPlayersNeeded / playersPerTeam)} teams
            </Text>
          )}
          <Pressable
            style={({ pressed }) => [
              s.startBtn,
              {
                backgroundColor: canStart ? colors.tint : colors.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleRotate}
            disabled={!canStart}
          >
            <Feather
              name="shuffle"
              size={22}
              color={canStart ? "#fff" : colors.textSecondary}
            />
            <Text
              style={[
                s.startBtnText,
                { color: canStart ? "#fff" : colors.textSecondary },
              ]}
            >
              Rotate Players
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (colors: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    headerCenter: { alignItems: "center" },
    title: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 1,
    },
    scroll: { paddingHorizontal: 20 },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    chipRow: { gap: 8, paddingVertical: 4 },
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1.5,
    },
    chipText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
    modeRow: { flexDirection: "row", gap: 12 },
    modeCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1.5,
      padding: 14,
      gap: 6,
    },
    modeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modeBadge: {
      width: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    modeName: { fontSize: 14, fontFamily: "Inter_700Bold" },
    modeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
    playerHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    playerCount: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: "rgba(128,128,128,0.12)",
    },
    playerNum: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    playerNumText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    playerNameText: { flex: 1, fontSize: 16, fontFamily: "Inter_500Medium" },
    removeBtn: { padding: 6 },
    addRow: { flexDirection: "row", gap: 10, marginTop: 10 },
    playerInput: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      borderWidth: 1.5,
      paddingHorizontal: 14,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
    },
    addBtn: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      paddingTop: 12,
      paddingHorizontal: 20,
      borderTopWidth: 1,
      gap: 8,
    },
    hint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 16,
      borderRadius: 16,
    },
    startBtnText: { fontSize: 18, fontFamily: "Inter_700Bold" },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      borderRadius: 24,
      borderWidth: 1,
      padding: 28,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 12,
    },
    modalIconRow: {
      alignItems: "center",
      marginBottom: 4,
    },
    modalIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    modalEmoji: {
      fontSize: 32,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    modalMessage: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 20,
    },
    modalButtons: {
      gap: 10,
      marginTop: 8,
    },
    modalBtnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 15,
      borderRadius: 14,
    },
    modalBtnPrimaryText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
    modalBtnSecondary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 13,
      borderRadius: 14,
      borderWidth: 1.5,
    },
    modalBtnSecondaryText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
  });
