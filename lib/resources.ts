export type Resource = {
  id: string;
  title: string;
  type: "lesson" | "video" | "quiz" | "download";
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  xp: number;
  locked: boolean;
  icon: string;
  description: string;
  url?: string;
  unlockLevel?: number;
};
