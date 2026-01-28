"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Sparkles, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { AdminGuard } from "@/components/admin-guard";

export default function AdminResourcesPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"lesson" | "video" | "quiz" | "download">(
    "lesson"
  );
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Easy"
  );
  const [duration, setDuration] = useState("");
  const [xp, setXp] = useState("");
  const [icon, setIcon] = useState("📚");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [questionsJson, setQuestionsJson] = useState("");
  const [locked, setLocked] = useState(false);
  const [unlockLevel, setUnlockLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerateLesson = async () => {
    if (!title.trim()) {
      setError("Please enter a title first to generate lesson content.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: title,
          difficulty,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate lesson");
      }

      const data = await response.json();
      setContent(data.content);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate lesson content"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!title.trim()) {
      setError("Please enter a title first to generate quiz questions.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: title,
          difficulty,
          numQuestions: 5,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate quiz");
      }

      const data = await response.json();
      setQuestionsJson(JSON.stringify(data.questions, null, 2));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate quiz questions"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!title.trim() || !description.trim()) {
      setError("Please fill in title and description.");
      setIsSubmitting(false);
      return;
    }

    let questions = undefined;
    if (type === "quiz" && questionsJson.trim()) {
      try {
        questions = JSON.parse(questionsJson);
        if (!Array.isArray(questions)) {
          setError("Questions must be a valid JSON array.");
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        setError("Invalid JSON format for questions.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const resourceData: any = {
        title: title.trim(),
        description: description.trim(),
        type,
        difficulty,
        duration: duration.trim() || "N/A",
        xp: xp ? parseInt(xp, 10) : 0,
        icon: icon.trim() || "📚",
        locked,
        unlockLevel: locked && unlockLevel ? parseInt(unlockLevel, 10) : "",
      };

      if (type === "lesson" && content.trim()) {
        resourceData.content = content.trim();
      } else if (type === "quiz" && questions) {
        resourceData.questions = questions;
      } else if (url.trim()) {
        resourceData.url = url.trim();
      }

      await addDoc(collection(db, "resources"), resourceData);

      setSuccess(true);
      setTitle("");
      setDescription("");
      setType("lesson");
      setDifficulty("Easy");
      setDuration("");
      setXp("");
      setIcon("📚");
      setUrl("");
      setContent("");
      setQuestionsJson("");
      setLocked(false);
      setUnlockLevel("");

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create resource. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-3xl">
        <Button
          variant="ghost"
          className="mb-3 sm:mb-4 text-sm sm:text-base"
          size="sm"
          onClick={() => router.push("/admin")}
        >
          ← Back to Admin Dashboard
        </Button>
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
          <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-primary" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
            Create Resource
          </h1>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl md:text-2xl">
              New Resource
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Add a new learning resource for students.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Addition Basics"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will learn..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm sm:text-base">
                    Type *
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(value) => setType(value as any)}
                    required
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson">Lesson</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="download">Download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty" className="text-sm sm:text-base">
                    Difficulty *
                  </Label>
                  <Select
                    value={difficulty}
                    onValueChange={(value) => setDifficulty(value as any)}
                    required
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm sm:text-base">
                    Duration
                  </Label>
                  <Input
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g., 15 min"
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xp" className="text-sm sm:text-base">
                    XP Reward
                  </Label>
                  <Input
                    id="xp"
                    type="number"
                    min="0"
                    value={xp}
                    onChange={(e) => setXp(e.target.value)}
                    placeholder="0"
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Emoji)</Label>
                <Input
                  id="icon"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="📚"
                  maxLength={2}
                />
              </div>

              {type === "lesson" && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <Label htmlFor="content" className="text-sm sm:text-base">
                      Lesson Content (Markdown supported)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateLesson}
                      disabled={isGenerating || !title.trim()}
                      className="gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">
                            Generating...
                          </span>
                          <span className="sm:hidden">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">
                            Generate with AI
                          </span>
                          <span className="sm:hidden">AI Generate</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the lesson content here or click 'Generate with AI'..."
                    rows={8}
                    className="text-sm sm:text-base"
                  />
                </div>
              )}

              {type === "quiz" && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <Label htmlFor="questions" className="text-sm sm:text-base">
                      Quiz Questions (JSON format)
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateQuiz}
                      disabled={isGenerating || !title.trim()}
                      className="gap-1 sm:gap-2 text-xs sm:text-sm w-full sm:w-auto"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden sm:inline">
                            Generating...
                          </span>
                          <span className="sm:hidden">Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">
                            Generate with AI
                          </span>
                          <span className="sm:hidden">AI Generate</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="questions"
                    value={questionsJson}
                    onChange={(e) => setQuestionsJson(e.target.value)}
                    placeholder='[{"question": "What is 2+2?", "options": ["3", "4", "5", "6"], "correctAnswer": 1}] or click "Generate with AI"...'
                    rows={8}
                    className="text-sm sm:text-base font-mono"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Format: Array of objects with "question", "options" (array),
                    and "correctAnswer" (index)
                  </p>
                </div>
              )}

              {(type === "video" || type === "download") && (
                <div className="space-y-2">
                  <Label htmlFor="url" className="text-sm sm:text-base">
                    URL *
                  </Label>
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    required={type === "video" || type === "download"}
                    className="text-sm sm:text-base"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="locked"
                  checked={locked}
                  onCheckedChange={(checked) => setLocked(checked as boolean)}
                />
                <Label
                  htmlFor="locked"
                  className="cursor-pointer text-sm sm:text-base"
                >
                  Lock this resource (requires level to unlock)
                </Label>
              </div>

              {locked && (
                <div className="space-y-2">
                  <Label htmlFor="unlockLevel" className="text-sm sm:text-base">
                    Unlock Level
                  </Label>
                  <Input
                    id="unlockLevel"
                    type="number"
                    min="1"
                    value={unlockLevel}
                    onChange={(e) => setUnlockLevel(e.target.value)}
                    placeholder="e.g., 10"
                    className="text-sm sm:text-base"
                  />
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-sm sm:text-base">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription className="text-sm sm:text-base">
                    Resource created successfully!
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting || isGenerating}
                  className="flex-1 text-sm sm:text-base"
                >
                  {isSubmitting ? "Creating..." : "Create Resource"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/admin")}
                  className="w-full sm:w-auto text-sm sm:text-base"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
