import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured in Supabase Edge Function Secrets");

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: "You are a study assistant that generates gamified quizzes for students to test their comprehension of a text. Generate 3 to 5 multiple choice questions. Make the questions clear and encouraging." }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Generate a multiple choice quiz for the following text:\n\nText:\n${text}` }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            description: "An array of 3-5 quiz questions",
            items: {
              type: "OBJECT",
              properties: {
                question: { type: "STRING", description: "The text of the question" },
                options: {
                  type: "ARRAY",
                  description: "Exactly 4 multiple choice options",
                  items: { type: "STRING" }
                },
                correctAnswerIndex: {
                  type: "INTEGER",
                  description: "The 0-based index of the correct option in the options array"
                },
                explanation: {
                  type: "STRING",
                  description: "A short, encouraging explanation of why the correct answer is right"
                }
              },
              required: ["question", "options", "correctAnswerIndex", "explanation"]
            }
          }
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error("No text returned in response from Gemini");
    }

    const parsed = JSON.parse(candidateText);

    return new Response(JSON.stringify({ questions: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
