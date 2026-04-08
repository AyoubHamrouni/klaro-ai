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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount > 5500) {
      return new Response(JSON.stringify({ error: "Text exceeds 5000 word limit" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a study assistant specialized in helping dyslexic and struggling readers. Your goal is to make learning material accessible and easy to understand. Always use simple, clear language. Break down complex ideas. Be encouraging.`,
          },
          {
            role: "user",
            content: `Summarize the following text for a student. The summary should be 15-20% of the original length. Use simple, clear language.\n\nText:\n${text}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_summary",
              description: "Create a structured summary with key terms for studying",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "A clear, concise summary of the text using simple language. 15-20% of original length.",
                  },
                  keyTerms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        term: { type: "string", description: "The key term or concept" },
                        definition: { type: "string", description: "A simple 1-2 sentence definition" },
                      },
                      required: ["term", "definition"],
                      additionalProperties: false,
                    },
                    description: "5-8 key terms with simple definitions",
                  },
                  difficulty_level: {
                    type: "string",
                    enum: ["beginner", "intermediate", "advanced"],
                    description: "The difficulty level of the original text",
                  },
                },
                required: ["summary", "keyTerms", "difficulty_level"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_summary" } },
      }),
    });

    if (response.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);
    const summaryWordCount = parsed.summary.trim().split(/\s+/).length;

    return new Response(JSON.stringify({ ...parsed, wordCount: summaryWordCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
