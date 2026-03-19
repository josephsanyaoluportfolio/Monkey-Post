import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform, Vibration } from "react-native";

import Colors from "@/constants/colors";
import {
  cancelMatchNotifications,
  requestNotificationPermissions,
  scheduleMatchNotifications,
  setupNotificationChannel,
} from "@/utils/notifications";
import type { GameConfig, GameState, Match, Team } from "@/types/game";

const STORAGE_KEY = "monkey_post_game_state";

interface GameContextType {
  state: GameState;
  prepareGame: (config: GameConfig) => void;
  confirmStart: () => void;
  endGame: () => void;
  handleWin: (winnerId: string) => void;
  handleDraw: () => void;
  incrementScore: (teamId: "A" | "B") => void;
  decrementScore: (teamId: "A" | "B") => void;
  resetTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  getTeam: (id: string) => Team | undefined;
  getCurrentTeamA: () => Team | undefined;
  getCurrentTeamB: () => Team | undefined;
  getNextTeams: () => [Team | undefined, Team | undefined];
  getLeaderboard: () => Team[];
}

const GameContext = createContext<GameContextType | null>(null);

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildTeams(config: GameConfig): { teams: Team[]; queue: string[] } {
  const players = config.playerNames
    .filter((n) => n.trim().length > 0)
    .map((name) => ({ id: genId(), name: name.trim() }));

  const shuffled = shuffleArray(players);
  const teams: Team[] = [];
  const { playersPerTeam } = config;

  let teamIndex = 0;
  while (shuffled.length > 0) {
    const isLast = shuffled.length <= playersPerTeam;
    const chunk = isLast ? shuffled.splice(0) : shuffled.splice(0, playersPerTeam);
    teams.push({
      id: genId(),
      label: `Team ${teamIndex + 1}`,
      colorIndex: teamIndex % Colors.teamColors.length,
      players: chunk,
      wins: 0,
      matchesPlayed: 0,
    });
    teamIndex++;
  }

  const queue = teams.map((t) => t.id);
  return { teams, queue };
}

const DEFAULT_STATE: GameState = {
  phase: "setup",
  config: null,
  teams: [],
  queue: [],
  currentMatch: null,
  timerSeconds: 0,
  timerRunning: false,
  timerStartedAt: null,
  timerElapsedAtPause: 0,
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const whistleRef = useRef<boolean>(false);

  useEffect(() => {
    setupNotificationChannel();
    requestNotificationPermissions();
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved: GameState = JSON.parse(raw);
          if (saved.phase === "playing" || saved.phase === "preview") {
            setState({ ...saved, timerRunning: false });
          }
        } catch (_) {}
      }
    });
  }, []);

  const saveState = useCallback((s: GameState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});
  }, []);

  const getRemainingSeconds = useCallback((s: GameState): number => {
    if (!s.config) return 0;
    const total = s.config.matchDuration * 60;
    if (!s.timerRunning || !s.timerStartedAt) {
      return Math.max(0, total - s.timerElapsedAtPause);
    }
    const elapsed =
      s.timerElapsedAtPause + (Date.now() - s.timerStartedAt) / 1000;
    return Math.max(0, total - elapsed);
  }, []);

  useEffect(() => {
    if (state.timerRunning) {
      const remaining = getRemainingSeconds(state);
      scheduleMatchNotifications(remaining);
    } else {
      cancelMatchNotifications();
    }
  }, [state.timerRunning, state.timerStartedAt]);

  useEffect(() => {
    if (state.timerRunning) {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          const remaining = getRemainingSeconds(prev);
          if (remaining <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (!whistleRef.current) {
              whistleRef.current = true;
              playWhistle();
            }
            return { ...prev, timerSeconds: 0, timerRunning: false };
          }
          if (remaining <= 120 && Platform.OS !== "web") {
            const rounded = Math.round(remaining);
            if (rounded % 6 === 0) {
              Vibration.vibrate([0, 250, 80, 250]);
            }
          }
          return { ...prev, timerSeconds: remaining };
        });
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.timerRunning, getRemainingSeconds]);

  function playWhistle() {
    if (Platform.OS === "web") return;
    try {
      Vibration.vibrate([0, 300, 100, 300, 100, 300]);
    } catch (_) {}
  }

  const prepareGame = useCallback(
    (config: GameConfig) => {
      const { teams, queue } = buildTeams(config);
      const activeMatch = {
        teamAId: queue[0],
        teamBId: queue[1],
        scoreA: 0,
        scoreB: 0,
      };
      const updatedTeams = teams.map((t, i) => {
        if (i === 0) return { ...t, post: "A" as const };
        if (i === 1) return { ...t, post: "B" as const };
        return t;
      });

      const newState: GameState = {
        phase: "preview",
        config,
        teams: updatedTeams,
        queue: queue.slice(2),
        currentMatch: activeMatch,
        timerSeconds: config.matchDuration * 60,
        timerRunning: false,
        timerStartedAt: null,
        timerElapsedAtPause: 0,
      };
      whistleRef.current = false;
      setState(newState);
      saveState(newState);
    },
    [saveState]
  );

  const confirmStart = useCallback(() => {
    setState((prev) => {
      const newState: GameState = {
        ...prev,
        phase: "playing",
        timerRunning: true,
        timerStartedAt: Date.now(),
        timerElapsedAtPause: 0,
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  const endGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const newState = { ...DEFAULT_STATE };
    setState(newState);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const rotateAfterWin = useCallback(
    (winnerId: string, s: GameState): GameState => {
      if (!s.currentMatch || !s.config) return s;
      const { teamAId, teamBId } = s.currentMatch;
      const loserId = winnerId === teamAId ? teamBId : teamAId;

      const updatedTeams = s.teams.map((t) => {
        if (t.id === winnerId)
          return { ...t, wins: t.wins + 1, matchesPlayed: t.matchesPlayed + 1 };
        if (t.id === loserId) return { ...t, matchesPlayed: t.matchesPlayed + 1 };
        return t;
      });

      const newQueue = [...s.queue, loserId];
      const nextOpponentId = newQueue[0];
      const remainingQueue = newQueue.slice(1);

      let newMatch: Match | null = null;
      if (nextOpponentId) {
        const isWinnerA = winnerId === teamAId;
        newMatch = {
          teamAId: isWinnerA ? winnerId : nextOpponentId,
          teamBId: isWinnerA ? nextOpponentId : winnerId,
          scoreA: 0,
          scoreB: 0,
        };
      }

      const totalDuration = s.config.matchDuration * 60;
      return {
        ...s,
        teams: updatedTeams,
        queue: remainingQueue,
        currentMatch: newMatch,
        timerSeconds: totalDuration,
        timerRunning: false,
        timerStartedAt: null,
        timerElapsedAtPause: 0,
      };
    },
    []
  );

  const rotateAfterDraw = useCallback((s: GameState): GameState => {
    if (!s.currentMatch || !s.config) return s;
    const { teamAId, teamBId } = s.currentMatch;

    const updatedTeams = s.teams.map((t) => {
      if (t.id === teamAId || t.id === teamBId)
        return { ...t, matchesPlayed: t.matchesPlayed + 1 };
      return t;
    });

    const drawTeamA = s.teams.find((t) => t.id === teamAId);
    const drawTeamB = s.teams.find((t) => t.id === teamBId);
    const postAFirst =
      drawTeamA?.post === "A"
        ? teamAId
        : drawTeamB?.post === "A"
        ? teamBId
        : teamAId;
    const postBSecond = postAFirst === teamAId ? teamBId : teamAId;

    const newQueue = [...s.queue, postAFirst, postBSecond];

    let newMatch: Match | null = null;
    if (newQueue.length >= 2) {
      newMatch = {
        teamAId: newQueue[0],
        teamBId: newQueue[1],
        scoreA: 0,
        scoreB: 0,
      };
    }

    const totalDuration = s.config.matchDuration * 60;
    return {
      ...s,
      teams: updatedTeams,
      queue: newQueue.slice(2),
      currentMatch: newMatch,
      timerSeconds: totalDuration,
      timerRunning: false,
      timerStartedAt: null,
      timerElapsedAtPause: 0,
    };
  }, []);

  const handleWin = useCallback(
    (winnerId: string) => {
      whistleRef.current = false;
      setState((prev) => {
        const next = rotateAfterWin(winnerId, prev);
        saveState(next);
        return next;
      });
    },
    [rotateAfterWin, saveState]
  );

  const handleDraw = useCallback(() => {
    whistleRef.current = false;
    setState((prev) => {
      const next = rotateAfterDraw(prev);
      saveState(next);
      return next;
    });
  }, [rotateAfterDraw, saveState]);

  const incrementScore = useCallback(
    (side: "A" | "B") => {
      setState((prev) => {
        if (!prev.currentMatch) return prev;
        const updated = {
          ...prev,
          currentMatch: {
            ...prev.currentMatch,
            scoreA:
              side === "A" ? prev.currentMatch.scoreA + 1 : prev.currentMatch.scoreA,
            scoreB:
              side === "B" ? prev.currentMatch.scoreB + 1 : prev.currentMatch.scoreB,
          },
        };
        saveState(updated);
        return updated;
      });
    },
    [saveState]
  );

  const decrementScore = useCallback(
    (side: "A" | "B") => {
      setState((prev) => {
        if (!prev.currentMatch) return prev;
        const updated = {
          ...prev,
          currentMatch: {
            ...prev.currentMatch,
            scoreA:
              side === "A"
                ? Math.max(0, prev.currentMatch.scoreA - 1)
                : prev.currentMatch.scoreA,
            scoreB:
              side === "B"
                ? Math.max(0, prev.currentMatch.scoreB - 1)
                : prev.currentMatch.scoreB,
          },
        };
        saveState(updated);
        return updated;
      });
    },
    [saveState]
  );

  const resetTimer = useCallback(() => {
    whistleRef.current = false;
    setState((prev) => {
      if (!prev.config) return prev;
      const total = prev.config.matchDuration * 60;
      const next: GameState = {
        ...prev,
        timerSeconds: total,
        timerRunning: true,
        timerStartedAt: Date.now(),
        timerElapsedAtPause: 0,
      };
      saveState(next);
      return next;
    });
  }, [saveState]);

  const pauseTimer = useCallback(() => {
    setState((prev) => {
      const elapsed = prev.timerStartedAt
        ? prev.timerElapsedAtPause + (Date.now() - prev.timerStartedAt) / 1000
        : prev.timerElapsedAtPause;
      const next: GameState = {
        ...prev,
        timerRunning: false,
        timerStartedAt: null,
        timerElapsedAtPause: elapsed,
        timerSeconds: Math.max(
          0,
          (prev.config?.matchDuration ?? 5) * 60 - elapsed
        ),
      };
      saveState(next);
      return next;
    });
  }, [saveState]);

  const resumeTimer = useCallback(() => {
    setState((prev) => {
      const next: GameState = {
        ...prev,
        timerRunning: true,
        timerStartedAt: Date.now(),
      };
      saveState(next);
      return next;
    });
  }, [saveState]);

  const getTeam = useCallback(
    (id: string) => state.teams.find((t) => t.id === id),
    [state.teams]
  );

  const getCurrentTeamA = useCallback(
    () =>
      state.currentMatch
        ? state.teams.find((t) => t.id === state.currentMatch!.teamAId)
        : undefined,
    [state.currentMatch, state.teams]
  );

  const getCurrentTeamB = useCallback(
    () =>
      state.currentMatch
        ? state.teams.find((t) => t.id === state.currentMatch!.teamBId)
        : undefined,
    [state.currentMatch, state.teams]
  );

  const getNextTeams = useCallback((): [Team | undefined, Team | undefined] => {
    if (!state.currentMatch) return [undefined, undefined];
    const q = state.queue;
    const nextA = q[0] ? state.teams.find((t) => t.id === q[0]) : undefined;
    const nextB = q[1] ? state.teams.find((t) => t.id === q[1]) : undefined;
    return [nextA, nextB];
  }, [state]);

  const getLeaderboard = useCallback(
    () =>
      [...state.teams].sort(
        (a, b) => b.wins - a.wins || b.matchesPlayed - a.matchesPlayed
      ),
    [state.teams]
  );

  return (
    <GameContext.Provider
      value={{
        state,
        prepareGame,
        confirmStart,
        endGame,
        handleWin,
        handleDraw,
        incrementScore,
        decrementScore,
        resetTimer,
        pauseTimer,
        resumeTimer,
        getTeam,
        getCurrentTeamA,
        getCurrentTeamB,
        getNextTeams,
        getLeaderboard,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
