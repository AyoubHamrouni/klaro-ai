# Dyslexia Study Assistant - Lovable.dev Generation Prompt

## Using Free & Low-Cost APIs (Gemini + ElevenLabs)

---

## Project Overview

Build a full-stack web application that helps dyslexic and struggling readers study more efficiently by converting long texts into AI-summarized content with text-to-speech audio playback and gamified quizzes. The app significantly reduces reading time (from 8 minutes to 2 minutes per 500-word text) while improving comprehension.

**Key Advantage**: Uses Google Gemini (free) + ElevenLabs (generous free tier) - minimal cost, high-quality voices.

---

## Core Features (MUST BUILD)

### 1. Text Input & Processing

- **File Upload**: Accept PDF files and plain text input (drag-and-drop UI)
- **Text Extraction**: Automatically extract readable text from PDFs using pdf.js library (client-side, free)
- **Character Limit**: Support documents up to 5,000 words
- **Input Validation**: Show clear error messages for unsupported formats or oversized files
- **Demo Feature**: Include a pre-loaded sample text so judges can test immediately without uploading

### 2. AI-Powered Summarization (Google Gemini API - FREE)

- **API**: Google AI Studio Gemini 1.5 Flash (Free tier, no credit card required)
- **Model**: Use `gemini-1.5-flash` - fastest and free
- **Summarization Engine**: Generate intelligent summaries from user-provided text
- **Summary Length**: Condense original text to 15-20% of original length (target 100-150 words from 500+ word input)
- **Key Term Extraction**: Automatically extract 5-8 key terms with concise definitions (1-2 sentences each)
- **API Response Format**: Parse response and return structured data:
  ```json
  {
    "summary": "string",
    "keyTerms": [{ "term": "string", "definition": "string" }],
    "wordCount": "number",
    "difficulty_level": "beginner|intermediate|advanced"
  }
  ```
