# Firestore Seeding Script

This script seeds your Firestore database with sample sessions and AI-generated resources using the Gemini API.

## Setup

1. **Install dependencies** (if not already installed):

```bash
npm install
```

2. **Set up Gemini API Key**:

   - Get your API key from: https://makersuite.google.com/app/apikey
   - Create a `.env.local` file in the root directory (if it doesn't exist)
   - Add the following line:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```

3. **Run the seed script**:

```bash
npm run seed
```

## What it does

- Adds 12 sample sessions to the `sessions` collection (covering all days of the week)
- Adds 12 resources to the `resources` collection with **AI-generated content**:
  - **Lessons**: Generates comprehensive lesson content using Gemini AI
  - **Quizzes**: Generates multiple-choice questions using Gemini AI
  - **Videos & Downloads**: Uses provided URLs

## AI Generation

The script uses Google's Gemini API to generate:

- **Lesson content** in Markdown format with explanations, examples, and practice tips
- **Quiz questions** with 4 multiple-choice options and correct answers

## Note

- The script will add all the data each time you run it. If you want to avoid duplicates, you may want to clear your Firestore collections first.
- The AI generation may take a few moments for each lesson/quiz, so the script will take longer to complete.
- Make sure your `GEMINI_API_KEY` is set in `.env.local` before running the script.
