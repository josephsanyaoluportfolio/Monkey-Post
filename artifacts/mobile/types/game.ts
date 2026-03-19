export interface Player {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  label: string;
  colorIndex: number;
  players: Player[];
  wins: number;
  matchesPlayed: number;
  post?: "A" | "B";
}

export type MatchMode = "one_goal" | "count_goals";

export interface GameConfig {
  playersPerTeam: number;
  matchDuration: number;
  matchMode: MatchMode;
  playerNames: string[];
}

export interface Match {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
}

export interface GameState {
  phase: "setup" | "playing" | "ended";
  config: GameConfig | null;
  teams: Team[];
  queue: string[];
  currentMatch: Match | null;
  timerSeconds: number;
  timerRunning: boolean;
  timerStartedAt: number | null;
  timerElapsedAtPause: number;
}
