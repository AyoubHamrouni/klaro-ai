

## Dyslexia Study Assistant — Full Feature Revision Plan

### Current State
Single-page app with: text input + PDF upload, Gemini summarization, ElevenLabs TTS audio player, basic MCQ quiz modal, and a minimal accessibility toolbar. The UI is functional but plain — everything stacks vertically in one long scroll.

---

### Design Overhaul: Tabbed Results + Polished UX

The core idea: after summarization, results appear in a **tabbed interface** (Summary, Key Terms, Listen, Quiz) instead of a long scroll. The input section gets a cleaner, more modern feel with better visual hierarchy.

```text
┌─────────────────────────────────────────────┐
│  Header: StudyEase branding + dark mode     │
│  AccessibilityToolbar (refined, inline)     │
├─────────────────────────────────────────────┤
│  TextInput (cleaner card, subtle animations)│
├─────────────────────────────────────────────┤
│  Stats Bar (reduction %, time saved, terms) │
├─────────────────────────────────────────────┤
│  ┌─ Summary ─┬─ Key Terms ─┬─ Listen ─┬─ Quiz ─┐
│  │  Tab content area                          │
│  └────────────────────────────────────────────┘
└─────────────────────────────────────────────┘
```

---

### Changes to Implement

#### 1. Tabbed Results View
- Replace the vertical stack of Summary / Key Terms / Audio / Quiz CTA with a **Tabs component** (already in `ui/tabs.tsx`)
- **Summary tab**: summary text with copy button, difficulty badge, word count bar
- **Key Terms tab**: accordion cards (existing) with a "study all" flashcard mode button
- **Listen tab**: audio player (existing) + read-along sentence highlighting
- **Quiz tab**: inline quiz (move out of modal into the tab) with gamification elements

#### 2. Dark Mode Toggle
- Add a sun/moon toggle to the accessibility toolbar
- The CSS already has full `.dark` theme variables defined — just toggle the `dark` class on `<html>`

#### 3. Refined Accessibility Toolbar
- Move from floating top-right corner into the **header** as a clean inline bar
- Add dark mode toggle, keep font toggle, text size, and reading ruler
- Better icons and tooltips for each control

#### 4. Gamified Quiz Improvements
- Move quiz from modal to the Quiz tab (inline, full-width)
- Add **points counter** with animated score popup on correct answers
- Add **streak tracker** (consecutive correct answers) with fire emoji animation
- Add **flashcard mode** in Key Terms tab: flip cards with term on front, definition on back
- Show encouraging messages based on performance ("Great streak!", "Keep going!")
- Confetti animation on quiz completion (use a lightweight CSS-only approach)

#### 5. Read-Along Highlighting (Listen tab)
- Display summary text split into sentences in the Listen tab
- Estimate sentence timing from audio duration
- Highlight the current sentence during playback with a smooth background transition

#### 6. UI Polish
- Add a sticky header with app name/logo and accessibility controls
- Smooth scroll-to-results after summarization completes
- Better loading state with step indicators ("Analyzing text...", "Extracting key terms...", "Almost done...")
- Add a "New Text" / reset button to clear results and start over
- Micro-animations: card entrance stagger, button hover states, tab transitions

#### 7. Mobile Responsiveness
- Ensure tabs stack properly on mobile (scrollable tab list)
- Touch-friendly controls for audio player
- Responsive stats bar (stack on mobile, grid on desktop)

---

### Technical Details

**Files to create:**
- `src/components/ResultsTabs.tsx` — new tabbed container wrapping Summary, Key Terms, Listen, Quiz
- `src/components/FlashcardMode.tsx` — flip-card component for key terms
- `src/components/ReadAlongText.tsx` — sentence-highlighted text synced with audio
- `src/components/QuizInline.tsx` — refactored quiz (from modal to inline) with streak/points
- `src/components/Header.tsx` — sticky header with branding + accessibility controls

**Files to modify:**
- `src/pages/Index.tsx` — use new Header, ResultsTabs; add reset flow and scroll-to-results
- `src/components/AccessibilityToolbar.tsx` — add dark mode toggle, refactor to inline layout
- `src/components/AudioPlayer.tsx` — accept onTimeUpdate callback for read-along sync
- `src/components/ResultsDisplay.tsx` — remove (replaced by ResultsTabs)
- `src/index.css` — add dark mode body transition, flashcard flip animation, confetti keyframes

**No backend changes needed** — all edge functions remain the same.

