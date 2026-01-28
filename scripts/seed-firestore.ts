import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZijeJpfMQeN76Qf12eHs65G3R0r1RUIw",
  authDomain: "rlc2026.firebaseapp.com",
  projectId: "rlc2026",
  storageBucket: "rlc2026.firestorage.app",
  messagingSenderId: "262170905940",
  appId: "1:262170905940:web:bbf614aaebc96c76d20cc1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function generateLesson(
  topic: string,
  difficulty: string
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Create a comprehensive math lesson about "${topic}" for ${difficulty} difficulty level.

The lesson should be written in Markdown format and include:
- A clear title (as a heading)
- Introduction explaining what the topic is
- Step-by-step explanations with examples
- Practice tips
- Key concepts to remember

Make it engaging and appropriate for students learning this topic. Use clear language and include at least 3-4 examples.

Format the response as Markdown with proper headings, lists, and code blocks where appropriate.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

async function generateQuiz(
  topic: string,
  difficulty: string,
  numQuestions: number = 5
): Promise<any[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Create a ${numQuestions}-question multiple choice quiz about "${topic}" for ${difficulty} difficulty level.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0
  }
]

Important:
- correctAnswer should be the INDEX (0-3) of the correct option in the options array
- Include exactly ${numQuestions} questions
- Make questions appropriate for ${difficulty} difficulty
- Ensure exactly 4 options per question
- Return ONLY the JSON array, no other text or markdown formatting`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  let content = response.text().trim();

  // Clean up the response - remove markdown code blocks if present
  content = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const questions = JSON.parse(content);

    // Validate the structure
    if (!Array.isArray(questions)) {
      throw new Error("Response is not an array");
    }

    // Validate each question
    for (const q of questions) {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        typeof q.correctAnswer !== "number"
      ) {
        throw new Error("Invalid question structure");
      }
    }

    return questions;
  } catch (parseError) {
    console.error("Error parsing quiz response:", parseError);
    console.error("Raw response:", content);
    throw new Error("Failed to parse quiz response");
  }
}

// Sample sessions data
const sampleSessions = [
  {
    name: "Addition Basics",
    date: "Monday",
    startTime: "3:00 PM",
    endTime: "3:45 PM",
    type: "Tutoring",
    teacher: "Ms. Sarah",
    maxSpots: 3,
    students: [],
    isFull: false,
  },
  {
    name: "Homework Help",
    date: "Monday",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    type: "Group",
    teacher: "Mr. John",
    maxSpots: 8,
    students: [],
    isFull: false,
  },
  {
    name: "Multiplication Magic",
    date: "Tuesday",
    startTime: "3:00 PM",
    endTime: "3:45 PM",
    type: "Tutoring",
    teacher: "Ms. Emily",
    maxSpots: 2,
    students: [],
    isFull: false,
  },
  {
    name: "Math Games Hour",
    date: "Tuesday",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    type: "Group",
    teacher: "Ms. Lisa",
    maxSpots: 12,
    students: [],
    isFull: false,
  },
  {
    name: "Division Workshop",
    date: "Wednesday",
    startTime: "3:00 PM",
    endTime: "3:45 PM",
    type: "Tutoring",
    teacher: "Mr. David",
    maxSpots: 4,
    students: [],
    isFull: false,
  },
  {
    name: "Problem Solving Club",
    date: "Wednesday",
    startTime: "4:30 PM",
    endTime: "5:30 PM",
    type: "Group",
    teacher: "Ms. Rachel",
    maxSpots: 10,
    students: [],
    isFull: false,
  },
  {
    name: "Fractions Fun",
    date: "Thursday",
    startTime: "3:00 PM",
    endTime: "3:45 PM",
    type: "Tutoring",
    teacher: "Ms. Sarah",
    maxSpots: 3,
    students: [],
    isFull: false,
  },
  {
    name: "Study Buddies",
    date: "Thursday",
    startTime: "4:00 PM",
    endTime: "5:00 PM",
    type: "Group",
    teacher: "Mr. John",
    maxSpots: 15,
    students: [],
    isFull: false,
  },
  {
    name: "Math Challenge",
    date: "Friday",
    startTime: "3:00 PM",
    endTime: "4:00 PM",
    type: "Tutoring",
    teacher: "Ms. Emily",
    maxSpots: 5,
    students: [],
    isFull: false,
  },
  {
    name: "Weekend Prep",
    date: "Friday",
    startTime: "4:30 PM",
    endTime: "5:30 PM",
    type: "Group",
    teacher: "Ms. Lisa",
    maxSpots: 8,
    students: [],
    isFull: false,
  },
  {
    name: "Morning Math",
    date: "Saturday",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    type: "Group",
    teacher: "Mr. David",
    maxSpots: 12,
    students: [],
    isFull: false,
  },
  {
    name: "Week Review",
    date: "Sunday",
    startTime: "2:00 PM",
    endTime: "3:00 PM",
    type: "Group",
    teacher: "Ms. Rachel",
    maxSpots: 10,
    students: [],
    isFull: false,
  },
];

// Resource definitions - content will be generated using Gemini API
const resourceDefinitions = [
  {
    title: "Addition Basics",
    type: "lesson" as const,
    difficulty: "Easy" as const,
    duration: "15 min",
    xp: 50,
    locked: false,
    icon: "📚",
    description: "Learn the fundamentals of adding numbers",
  },
  {
    title: "Counting Fun",
    type: "video" as const,
    difficulty: "Easy" as const,
    duration: "8 min",
    xp: 30,
    locked: false,
    icon: "🎬",
    description: "Watch and learn to count with fun animations",
    url: "https://www.youtube.com/watch?v=uONIJ5TQ2DA",
  },
  {
    title: "Addition Quiz Level 1",
    type: "quiz" as const,
    difficulty: "Easy" as const,
    duration: "10 min",
    xp: 60,
    locked: false,
    icon: "🎯",
    description: "Test your addition skills with 10 questions",
    numQuestions: 10,
  },
  {
    title: "Math Practice Worksheets",
    type: "download" as const,
    difficulty: "Easy" as const,
    duration: "N/A",
    xp: 0,
    locked: false,
    icon: "📄",
    description: "Printable worksheets for extra practice",
    url: "/worksheets/addition-practice.pdf",
  },
  {
    title: "Subtraction Mastery",
    type: "lesson" as const,
    difficulty: "Medium" as const,
    duration: "20 min",
    xp: 75,
    locked: false,
    icon: "📖",
    description: "Master the art of subtraction",
  },
  {
    title: "Multiplication Tables",
    type: "video" as const,
    difficulty: "Medium" as const,
    duration: "12 min",
    xp: 50,
    locked: false,
    icon: "🎥",
    description: "Learn multiplication tables 1-10",
    url: "https://www.youtube.com/watch?v=7J1OkxuyLD0",
  },
  {
    title: "Multiplication Challenge",
    type: "quiz" as const,
    difficulty: "Medium" as const,
    duration: "15 min",
    xp: 80,
    locked: false,
    icon: "🏆",
    description: "Challenge yourself with multiplication problems",
    numQuestions: 8,
  },
  {
    title: "Division Deep Dive",
    type: "lesson" as const,
    difficulty: "Hard" as const,
    duration: "25 min",
    xp: 100,
    locked: true,
    icon: "📕",
    description: "Advanced division techniques",
    unlockLevel: 10,
  },
  {
    title: "Fractions Explained",
    type: "video" as const,
    difficulty: "Hard" as const,
    duration: "18 min",
    xp: 90,
    locked: true,
    icon: "🎞️",
    description: "Understanding fractions visually",
    unlockLevel: 12,
    url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3/imp-adding-and-subtracting-fractions-with-unlike-denominators/v/adding-fractions-with-unlike-denominators-introduction",
  },
  {
    title: "Advanced Math Quiz",
    type: "quiz" as const,
    difficulty: "Hard" as const,
    duration: "20 min",
    xp: 120,
    locked: true,
    icon: "💎",
    description: "Ultimate math challenge for experts",
    unlockLevel: 15,
    numQuestions: 8,
  },
  {
    title: "Basic Operations Worksheets",
    type: "download" as const,
    difficulty: "Easy" as const,
    duration: "N/A",
    xp: 0,
    locked: false,
    icon: "📄",
    description: "Printable worksheets for addition, subtraction, and more",
    url: "https://www.homeschoolmath.net/worksheets/basic-operations-worksheets.php",
  },
  {
    title: "Math Salamanders Worksheets",
    type: "download" as const,
    difficulty: "Easy" as const,
    duration: "N/A",
    xp: 0,
    locked: false,
    icon: "📋",
    description: "Fun worksheets covering all basic operations",
    url: "https://www.math-salamanders.com/addition-subtraction-multiplication-division-worksheets.html",
  },
];
const sampleUsers = [
  {
    uid: "child1",
    email: "child1@example.com",
    displayName: "Alex",
    type: "child",
    level: 5,
    xp: 450,
    character: "dino",
    color: "#4ade80",
    currentStreak: 3,
    totalTime: 120, // in minutes
    lastActivityDate: new Date().toISOString(),
    completedResources: ["resource1", "resource2"],
    achievements: ["First Quiz Completed", "5-day streak"],
    settings: {
      colorMode: "light",
      highContrast: false,
      fontSize: "medium",
      reduceMotion: false,
      increasedSpacing: false,
      screenReaderOptimized: false,
      focusIndicators: true,
      underlineLinks: false,
    },
    registeredSessions: ["session1", "session2"],
  },
  {
    uid: "parent1",
    email: "parent1@example.com",
    displayName: "Dr. Smith",
    type: "parent",
    children: ["child1"],
    settings: {
      colorMode: "dark",
      highContrast: true,
      fontSize: "large",
      reduceMotion: true,
      increasedSpacing: true,
      screenReaderOptimized: true,
      focusIndicators: true,
      underlineLinks: true,
    },
  },
  {
    uid: "admin1",
    email: "admin1@example.com",
    displayName: "Admin User",
    type: "admin",
    settings: {
      colorMode: "system",
      highContrast: false,
      fontSize: "medium",
      reduceMotion: false,
      increasedSpacing: false,
      screenReaderOptimized: false,
      focusIndicators: true,
      underlineLinks: false,
    },
  },
];
async function deleteCollection(collectionName: string) {
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);

    if (snapshot.empty) {
      console.log(`  No existing ${collectionName} to delete.`);
      return;
    }

    console.log(`  Deleting ${snapshot.size} existing ${collectionName}...`);
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, collectionName, docSnap.id))
    );
    await Promise.all(deletePromises);
    console.log(`  ✓ Deleted ${snapshot.size} ${collectionName}\n`);
  } catch (error) {
    console.error(`  ❌ Error deleting ${collectionName}:`, error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    console.log("Starting to seed Firestore database...\n");

    // Delete existing data
    console.log("Clearing existing data...");
    await deleteCollection("sessions");
    await deleteCollection("resources");
    await deleteCollection("users");
    console.log("✓ All existing data cleared\n");

    // Seed users
    console.log("Adding users...");
    for (const user of sampleUsers) {
      await setDoc(doc(db, "users", user.uid), user);
      console.log(`✓ Added user: ${user.displayName}`);
    }
    console.log(`\n✓ Successfully added ${sampleUsers.length} users\n`);

    // Seed sessions
    console.log("Adding sessions...");
    for (const session of sampleSessions) {
      await addDoc(collection(db, "sessions"), session);
      console.log(`✓ Added session: ${session.name}`);
    }
    console.log(`\n✓ Successfully added ${sampleSessions.length} sessions\n`);

    // Seed resources with AI-generated content
    console.log("Adding resources with AI-generated content...\n");

    for (const resourceDef of resourceDefinitions) {
      try {
        const resourceData: any = {
          title: resourceDef.title,
          type: resourceDef.type,
          difficulty: resourceDef.difficulty,
          duration: resourceDef.duration,
          xp: resourceDef.xp,
          locked: resourceDef.locked,
          icon: resourceDef.icon,
          description: resourceDef.description,
        };

        if (resourceDef.unlockLevel) {
          resourceData.unlockLevel = resourceDef.unlockLevel;
        }

        if (resourceDef.type === "lesson") {
          console.log(
            `  Generating lesson content for: ${resourceDef.title}...`
          );
          const content = await generateLesson(
            resourceDef.title,
            resourceDef.difficulty
          );
          resourceData.content = content;
          console.log(`  ✓ Generated lesson content`);
        } else if (resourceDef.type === "quiz") {
          console.log(
            `  Generating quiz questions for: ${resourceDef.title}...`
          );
          const numQuestions = (resourceDef as any).numQuestions || 5;
          const questions = await generateQuiz(
            resourceDef.title,
            resourceDef.difficulty,
            numQuestions
          );
          resourceData.questions = questions;
          console.log(`  ✓ Generated ${questions.length} quiz questions`);
        } else if (resourceDef.url) {
          resourceData.url = resourceDef.url;
        }

        await addDoc(collection(db, "resources"), resourceData);
        console.log(`✓ Added resource: ${resourceDef.title}\n`);
      } catch (error) {
        console.error(
          `❌ Error processing resource "${resourceDef.title}":`,
          error
        );
        // Continue with next resource even if one fails
      }
    }

    console.log(
      `✓ Successfully processed ${resourceDefinitions.length} resources\n`
    );

    console.log("✅ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();