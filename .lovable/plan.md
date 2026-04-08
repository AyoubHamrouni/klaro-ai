

## Dyslexia Study Assistant — MVP Plan

### Phase 1: MVP (This Build)
Text input → AI summarization → ElevenLabs TTS playback + dyslexia-friendly UI

### Phase 2: Follow-up
Gamified quizzes (MCQ, flashcards, points, streaks, animations)

---

### Pages & Layout

**Single-page app** with a clean, dyslexia-friendly design:
- OpenDyslexic-inspired font choices, high contrast, generous spacing
- Warm cream/soft blue color palette (low visual stress)
- Large clickable targets, clear visual hierarchy

### Features to Build

#### 1. Text Input Section
- **Text area** for pasting text directly
- **PDF upload** with drag-and-drop (using pdf.js client-side extraction)
- **Demo button** — loads a pre-built sample text instantly
- Character limit: 5,000 words with live word count
- Clear error messages for invalid inputs

#### 2. AI Summarization (Lovable AI Gateway)
- Edge function that calls Lovable AI to generate:
  - Condensed summary (15-20% of original)
  - 5-8 key terms with definitions
  - Difficulty level
- Structured output via tool calling
- Loading state with friendly progress indicator

#### 3. Results Display
- Summary shown in a dyslexia-friendly card with large text and line spacing
- Key terms displayed as expandable cards/accordion
- Word count comparison (original vs summary) with visual indicator
- Difficulty badge

#### 4. Text-to-Speech (ElevenLabs)
- Connect ElevenLabs via connector
- Edge function for TTS — converts summary text to audio
- Play/pause controls with progress indicator
- Adjustable playback speed
- Read-along highlighting (highlight current sentence during playback)

#### 5. Dyslexia-Friendly UI Throughout
- Toggle for OpenDyslexic font vs standard font
- Adjustable text size (small/medium/large)
- Reading ruler overlay option
- High contrast mode toggle
- Syllable spacing option

### Technical Approach
- Lovable Cloud for backend (edge functions)
- Lovable AI Gateway for summarization
- ElevenLabs connector for TTS
- pdf.js (pdfjs-dist) for client-side PDF parsing
- All state managed client-side (no database needed for MVP)

