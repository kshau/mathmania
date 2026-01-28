# Gemini API Setup

This application uses Google's Gemini API to generate lesson content and quiz questions automatically.

## Setup Instructions

1. **Get a Gemini API Key**

   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy your API key

2. **Add API Key to Environment Variables**

   - Create a `.env.local` file in the root directory (if it doesn't exist)
   - Add the following line:
     ```
     GEMINI_API_KEY=your_actual_api_key_here
     ```
   - Replace `your_actual_api_key_here` with your actual API key

3. **Restart Your Development Server**
   - Stop your current dev server (Ctrl+C)
   - Run `npm run dev` again

## Usage

When creating a new resource in the admin panel:

1. **For Lessons:**

   - Enter a title and select difficulty
   - Click the "Generate with AI" button next to the content field
   - The AI will generate comprehensive lesson content based on your title

2. **For Quizzes:**
   - Enter a title and select difficulty
   - Click the "Generate with AI" button next to the questions field
   - The AI will generate 5 multiple-choice questions based on your title

## Notes

- The API key is stored securely in environment variables and never exposed to the client
- You can still manually enter content/questions if you prefer
- Generated content can be edited before saving
