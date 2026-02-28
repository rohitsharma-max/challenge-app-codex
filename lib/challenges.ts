import { Category, Difficulty } from "@/types/app";

type Template = {
  indoor: string[];
  outdoor: string[];
};

const templates: Record<Category, Template> = {
  Fitness: {
    indoor: [
      "Do a focused 12-minute bodyweight circuit at home.",
      "Complete 3 rounds: 20 squats, 10 push-ups, 30s plank.",
      "Stretch and mobility flow for 15 minutes."
    ],
    outdoor: [
      "Take a brisk 25-minute walk and track your pace.",
      "Do 10 minutes of stairs or hill repeats.",
      "Complete a light jog for at least 2 km."
    ]
  },
  Productivity: {
    indoor: [
      "Run one 45-minute deep work block with phone on silent.",
      "Clear your top 3 tasks before checking social media.",
      "Organize your workspace and inbox for 20 minutes."
    ],
    outdoor: [
      "Take a 15-minute planning walk and define 3 priorities.",
      "Work from a new location for one focused session.",
      "Do a no-phone walk while mentally planning tomorrow."
    ]
  },
  Learning: {
    indoor: [
      "Study a topic for 30 minutes and summarize 3 insights.",
      "Watch one tutorial and implement a quick practice task.",
      "Read 15 pages from a non-fiction book and take notes."
    ],
    outdoor: [
      "Listen to an educational podcast during a 20-minute walk.",
      "Observe something in public and write 5 learning notes.",
      "Visit a library or bookstore and explore one new subject."
    ]
  },
  Fun: {
    indoor: [
      "Try a new 20-minute creative hobby session.",
      "Play a quick puzzle/brain game for 15 minutes.",
      "Write a short story or idea list for 10 minutes."
    ],
    outdoor: [
      "Take a photo walk and capture 5 interesting moments.",
      "Visit a new nearby place for 20 minutes.",
      "Do a mini outdoor scavenger hunt for 10 items."
    ]
  },
  Social: {
    indoor: [
      "Send a thoughtful check-in message to 3 people.",
      "Schedule one meaningful catch-up call this week.",
      "Write a gratitude message to someone who helped you."
    ],
    outdoor: [
      "Start one friendly conversation during a walk or errand.",
      "Invite someone for a short coffee or tea meetup.",
      "Do one small act of kindness for someone nearby."
    ]
  }
};

const difficultySuffix: Record<Difficulty, string> = {
  Easy: "Keep it light and just finish it.",
  Medium: "Push for solid focus and consistency.",
  Hard: "Go all-in and complete it without shortcuts."
};

function seededInt(seed: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function buildDailyChallenge(input: {
  userId: string;
  date: string;
  categories: Category[];
  difficulty: Difficulty;
  allowOutdoor: boolean;
}) {
  const { userId, date, categories, difficulty, allowOutdoor } = input;
  const pickedCategory = categories[seededInt(`${userId}-${date}-cat`, categories.length)] ?? "Productivity";
  const bucket = templates[pickedCategory];

  const outdoor = allowOutdoor && seededInt(`${userId}-${date}-outdoor`, 2) === 1;
  const lines = outdoor ? bucket.outdoor : bucket.indoor;
  const mainText = lines[seededInt(`${userId}-${date}-line`, lines.length)];

  return {
    id: `${userId}-${date}`,
    text: `${mainText} ${difficultySuffix[difficulty]}`,
    category: pickedCategory,
    difficulty,
    outdoor
  };
}

export function xpForDifficulty(difficulty: Difficulty): number {
  if (difficulty === "Hard") return 30;
  if (difficulty === "Medium") return 20;
  return 10;
}