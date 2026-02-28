export type Category = "Fitness" | "Productivity" | "Learning" | "Fun" | "Social";
export type Difficulty = "Easy" | "Medium" | "Hard";

export type UserPreferences = {
  categories: Category[];
  difficulty: Difficulty;
  allowOutdoor: boolean;
};

export type DayStatus = "assigned" | "completed" | "missed" | "restored";

export type Challenge = {
  id: string;
  text: string;
  category: Category;
  difficulty: Difficulty;
  outdoor: boolean;
};

export type HistoryRecord = {
  date: string;
  challenge: Challenge;
  status: DayStatus;
  xpEarned: number;
  proofNote?: string;
  completedAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  preferences?: UserPreferences;
  onboardingComplete: boolean;
  xp: number;
  streak: {
    current: number;
    best: number;
    lastCompletedDate?: string;
    frozenBeforeMiss?: number;
    restorableMissedDate?: string;
    restoreDeadline?: string;
  };
  history: HistoryRecord[];
};
