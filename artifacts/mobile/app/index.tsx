import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import type { GameConfig, MatchMode } from "@/types/game";

const DURATION_OPTIONS = [3, 4, 5, 6, 7, 8, 10, 12, 15];
const PLAYERS_OPTIONS = [2, 3, 4, 5, 6, 7, 8];

export default function SetupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { startGame } = useGame();

  const [playersPerTeam, setPlayersPerTeam] = useState(5);
  const [matchDuration, setMatchDuration] = useState(5);
  const [matchMode, setMatchMode] = useState<MatchMode>("one_goal");
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const inputRef = useRef<TextInput>(null);

  const addPlayer = useCallback(() => {
    const name = newPlayerName.trim();
    if (!name) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerNames((prev) => [...prev.filter((n) => n.trim()), name]);
    setNewPlayerName("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [newPlayerName]);

  const removePlayer = useCallback((index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlayerNames((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePlayer = useCallback((index: number, name: string) => {
    setPlayerNames((prev) => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const handleStart = useCallback(() => {
    const validPlayers = playerNames.filter((n) => n.trim());
    if (validPlayers.length < playersPerTeam * 2) {
      Alert.alert(
        "Not Enough Players",
        `You need at least ${playersPerTeam * 2} players for 2 teams of ${playersPerTeam}.`
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const config: GameConfig = {
      playersPerTeam,
      matchDuration,
      matchMode,
      playerNames: validPlayers,
    };
    startGame(config);
    router.replace("/match");
  }, [playerNames, playersPerTeam, matchDuration, matchMode, startGame]);

  const validPlayerCount = playerNames.filter((n) => n.trim()).length;
  const minPlayersNeeded = playersPerTeam * 2;

  const s = styles(colors, isDark);

  const webTop = Platform.OS === "web" ? 67 : 0;
  const webBottom = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            s.scroll,
            {
              paddingTop: insets.top + 16 + webTop,
              paddingBottom: insets.bottom + 80 + webBottom,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.header}>
            <Text style={s.title}>Monkey Post</Text>
            <Text style={s.subtitle}>Football Rotation Manager</Text>
          </View>

          <View style={s.section}>
            <Text style={s.sectionLabel}>Players per Team</Text>
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
            <Text style={s.sectionLabel}>Match Duration (minutes)</Text>
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
            <Text style={s.sectionLabel}>Match Mode</Text>
            <View style={s.modeRow}>
              <Pressable
                style={[
                  s.modeCard,
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
                    matchMode === "one_goal" && { color: colors.tint },
                  ]}
                >
                  One Goal = Out
                </Text>
                <Text style={s.modeDesc}>
                  First goal ends the match
                </Text>
              </Pressable>

              <Pressable
                style={[
                  s.modeCard,
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
                    matchMode === "count_goals" && { color: colors.tint },
                  ]}
                >
                  Count Goals
                </Text>
                <Text style={s.modeDesc}>
                  Score until timer ends
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={s.section}>
            <View style={s.playerHeader}>
              <Text style={s.sectionLabel}>
                Players{" "}
                <Text
                  style={[
                    s.playerCount,
                    validPlayerCount < minPlayersNeeded
                      ? { color: colors.danger }
                      : { color: colors.tint },
                  ]}
                >
                  ({validPlayerCount}/{minPlayersNeeded} min)
                </Text>
              </Text>
            </View>

            {playerNames.map((name, index) => (
              <View key={index} style={s.playerRow}>
                <TextInput
                  style={s.playerInput}
                  value={name}
                  onChangeText={(t) => updatePlayer(index, t)}
                  placeholder={`Player ${index + 1}`}
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (index === playerNames.length - 1) {
                      if (newPlayerName.trim()) addPlayer();
                      else inputRef.current?.focus();
                    }
                  }}
                />
                <Pressable
                  onPress={() => removePlayer(index)}
                  style={s.removeBtn}
                >
                  <Feather name="x" size={18} color={colors.danger} />
                </Pressable>
              </View>
            ))}

            <View style={s.playerRow}>
              <TextInput
                ref={inputRef}
                style={s.playerInput}
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                placeholder="Add player name..."
                placeholderTextColor={colors.textSecondary}
                returnKeyType="done"
                onSubmitEditing={addPlayer}
              />
              <Pressable onPress={addPlayer} style={[s.addBtn, { backgroundColor: colors.tint }]}>
                <Feather name="plus" size={18} color="#fff" />
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
          <Pressable
            style={({ pressed }) => [
              s.startBtn,
              { backgroundColor: colors.tint, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleStart}
          >
            <Feather name="play-circle" size={22} color="#fff" />
            <Text style={s.startBtnText}>Start Game</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (colors: typeof Colors.light, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 20 },
    header: { marginBottom: 28, alignItems: "center" },
    title: {
      fontSize: 32,
      fontFamily: "Inter_700Bold",
      color: colors.tint,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      marginTop: 4,
    },
    section: { marginBottom: 24 },
    sectionLabel: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      color: colors.textSecondary,
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
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: colors.text,
    },
    modeRow: { flexDirection: "row", gap: 12 },
    modeCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
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
    modeName: {
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      color: colors.text,
    },
    modeDesc: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      lineHeight: 17,
    },
    playerHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    playerCount: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    playerInput: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      fontSize: 16,
      fontFamily: "Inter_400Regular",
      color: colors.text,
    },
    removeBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: isDark ? "#2d1a1a" : "#fef2f2",
      alignItems: "center",
      justifyContent: "center",
    },
    addBtn: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
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
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      color: "#fff",
    },
  });
