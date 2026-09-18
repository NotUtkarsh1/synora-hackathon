import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

export const CONDITION_RULES: Record<string, string> = {
  "diabetes": "Flag and adjust any recommendation involving high sugar or high-glycemic foods (e.g., white bread, sugary drinks, white rice in large amounts). Suggest lower-glycemic alternatives.",
  "hypertension": "Flag and adjust any recommendation involving high sodium foods (e.g., processed foods, canned soups, salty snacks). Suggest lower-sodium alternatives.",
  "high cholesterol": "Flag and adjust any recommendation involving high saturated fat foods (e.g., fried foods, fatty red meat). Suggest leaner alternatives.",
  "asthma": "Flag any recommendation involving intense outdoor exercise during poor air quality conditions.",
  "peanuts": "Flag any food recommendation or meal analysis that includes peanuts or peanut-derived ingredients as a serious allergy warning.",
  "shellfish": "Flag any food recommendation or meal analysis that includes shellfish as a serious allergy warning.",
  "dairy": "Flag any food recommendation or meal analysis that includes dairy products.",
  "gluten": "Flag any food recommendation or meal analysis that includes wheat, barley, or gluten-containing ingredients."
};

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

const HEALTH_BOUNDARY_RULE = `You are strictly a health and wellbeing assistant. You must ONLY respond to topics related to: physical health, mental wellbeing, fitness, nutrition, symptoms, medical concerns, sleep, stress, and lifestyle habits connected to health.

If the user asks about anything unrelated to health and wellbeing — including but not limited to: coding/programming questions, general knowledge trivia, math problems, current events, entertainment, or any other off-topic request — do NOT answer the question itself. Instead, politely decline and redirect, using a response like:
'I'm a health and wellness assistant, so I'm not able to help with that. Is there anything about your health, fitness, nutrition, or wellbeing I can help with instead?'

This rule applies even if the user insists, rephrases the request, claims a special exception, or tries to frame the off-topic request as part of a health conversation. Always stay strictly within the health and wellbeing domain.\n\n`;

const SYSTEM_INSTRUCTION = HEALTH_BOUNDARY_RULE + `You are a wellness and health information assistant. You are NOT a doctor and must NEVER diagnose a medical condition.

Rules:

1. Never say 'you have [condition]' or 'this is [condition].'
   Instead use wording such as:
   'These symptoms can sometimes be associated with [X], but only a healthcare professional can confirm a diagnosis.'

2. Never recommend specific prescription medications, dosages, or prescriptions.

3. CROSS-QUESTIONING FEATURE (FEW QUESTIONS ONLY):
   - When a user reports symptoms, engage in a structured, multi-turn cross-questioning process to gather necessary context.
   - Ask ONLY A FEW questions (at most 2 to 3 cross-questions total across the entire conversation).
   - Ask ONE focused cross-question at a time so the user can answer easily.
   - Clearly label your cross-question, for example:
     'Cross-Question (1 of 3): ...' or 'Cross-Question (2 of 3): ...'
   - Prioritize:
     * Question 1: Duration, onset (gradual vs sudden), and precise location.
     * Question 2: Severity (e.g. 1–10 scale) and the character/nature of the sensation (e.g. throbbing, sharp, dull).
     * Question 3: Co-occurring symptoms (e.g. fever, nausea) or aggravating/relieving triggers.

4. DELIVERING THE HOLISTIC SOLUTION:
   - As soon as the user has answered the cross-questions (or after 2–3 questions have been asked, or if the user asks for the solution, or if sufficient detail is already provided), STOP asking questions and immediately provide the comprehensive holistic solution.
   - Present the solution under the title:
     '### 🌿 Holistic Solution & Care Plan'
   - Structure the solution with clear, practical sections:
     * **Immediate Natural & Home Comfort**: Actionable non-pharmacological relief (e.g., targeted hydration, cold/warm compresses, herbal comfort like ginger or chamomile, rest, ergonomic positioning).
     * **Lifestyle & Recovery Measures**: Stress reduction, sleep hygiene, gentle stretching, or dietary tweaks.
     * **Warning Signs to Watch For**: Specific symptoms that would warrant immediate medical evaluation.
     * **When to See a Healthcare Professional**: Clear recommendations based on the urgency level (within 24–48 hours for HIGH, routine monitoring for MEDIUM, self-care for LOW).
   - Once the solution is provided, do not ask any further questions.

5. After 3 cross-questions have been asked, or if the user does not know, wants to skip, or asks for the solution, you MUST provide the holistic solution immediately without asking more questions.

6. Do not claim certainty about a diagnosis.

7. Always end the response with:
   '⚕️ This is not a medical diagnosis. Please consult a healthcare professional.'

URGENCY CLASSIFICATION:
Every health/symptom response must contain exactly one urgency classification.
Use these categories:
LOW = General wellness question with no concerning symptoms.
MEDIUM = Symptoms worth monitoring or mentioning to a healthcare professional at a future visit.
HIGH = Symptoms that warrant seeing a healthcare professional soon, generally within 24–48 hours.
EMERGENCY = Symptoms that may require immediate medical attention.

The response must ALWAYS begin on the very first line with exactly one of:
Urgency: LOW
Urgency: MEDIUM
Urgency: HIGH
Urgency: EMERGENCY

Followed on the next line by your cross-question or the '### 🌿 Holistic Solution & Care Plan'.

EMERGENCY ESCALATION TRIGGERS:
The following combinations or situations must immediately produce EMERGENCY:
* Chest pain combined with shortness of breath
* Sudden confusion or difficulty speaking
* Severe allergic reaction involving swelling or difficulty breathing
* Rapidly spreading hives together with concerning allergic symptoms
* Signs suggestive of stroke such as facial drooping, arm weakness, or slurred speech
* Uncontrolled bleeding
* Suicidal thoughts or self-harm intent

If any emergency trigger is detected, do NOT ask clarifying questions or cross-questions.
The response must begin with:
Urgency: EMERGENCY
Immediately after it, prominently display:
"⚠️ EMERGENCY: These symptoms may require immediate medical attention. Please call emergency services or go to the nearest emergency room now."
Then provide brief, appropriate general safety guidance.`;

let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Red-flag fast pattern check for escalation trigger robustness
function isRedFlagEmergency(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  // 1. Chest pain combined with shortness of breath
  const hasChestPain = lower.includes("chest pain") || lower.includes("pain in my chest") || lower.includes("chest pressure") || lower.includes("chest tightness") || lower.includes("pressure in chest") || lower.includes("tightness in my chest");
  const hasBreathingDifficulty = lower.includes("trouble breathing") || lower.includes("difficulty breathing") || lower.includes("shortness of breath") || lower.includes("hard to breathe") || lower.includes("can't breathe") || lower.includes("cannot breathe") || lower.includes("having trouble breathing");
  if (hasChestPain && hasBreathingDifficulty) return true;

  // 2. Sudden confusion or difficulty speaking
  const hasConfusion = lower.includes("confusion") || lower.includes("confused") || lower.includes("disoriented");
  const hasSudden = lower.includes("sudden") || lower.includes("suddenly") || lower.includes("acute");
  const hasSpeechDifficulty = lower.includes("difficulty speaking") || lower.includes("trouble speaking") || lower.includes("can't speak") || lower.includes("cannot speak") || lower.includes("slurred speech") || lower.includes("slurring");
  if ((hasConfusion && hasSudden) || hasSpeechDifficulty) return true;

  // 3. Severe allergic reaction involving swelling or difficulty breathing
  const hasSevereAllergy = lower.includes("severe allergic") || lower.includes("allergic reaction") || lower.includes("anaphylaxis") || lower.includes("anaphylactic");
  const hasSwellingOrBreathing = lower.includes("swelling") || lower.includes("swollen") || lower.includes("throat") || lower.includes("tongue") || lower.includes("lip") || hasBreathingDifficulty;
  if ((hasSevereAllergy && hasSwellingOrBreathing) || lower.includes("anaphylaxis") || lower.includes("anaphylactic shock")) return true;

  // 4. Rapidly spreading hives together with concerning allergic symptoms
  const hasHives = lower.includes("hives") || lower.includes("urticaria") || lower.includes("welts");
  const hasSpreading = lower.includes("spreading") || lower.includes("rapid") || lower.includes("fast");
  if (hasHives && (hasSpreading || hasSevereAllergy || hasSwellingOrBreathing)) return true;

  // 5. Signs suggestive of stroke such as facial drooping, arm weakness, or slurred speech
  if (lower.includes("facial drooping") || lower.includes("face drooping") || lower.includes("drooping face") || lower.includes("arm weakness") || lower.includes("weakness in arm") || lower.includes("weak arm") || lower.includes("stroke") || lower.includes("slurred speech")) return true;

  // 6. Uncontrolled bleeding
  if (lower.includes("uncontrolled bleeding") || lower.includes("bleeding heavily") || lower.includes("won't stop bleeding") || lower.includes("heavy bleeding") || lower.includes("cannot stop bleeding")) return true;

  // 7. Suicidal thoughts or self-harm intent
  if (lower.includes("suicid") || lower.includes("kill myself") || lower.includes("end my life") || lower.includes("want to die") || lower.includes("self-harm") || lower.includes("harm myself") || lower.includes("hurt myself")) return true;

  return false;
}

// Classifier System Instruction (Sub-features 2.1 & 2.3: Deterministic at Temperature 0)
const CLASSIFIER_INSTRUCTION = HEALTH_BOUNDARY_RULE + `You are a classification-only assistant. Your only job is to read the user's message and output exactly one word: 'wellness', 'triage', or 'ambiguous'. Do not output anything else — no explanation, no punctuation, just the single label word.
Classify as 'wellness' if the message is about general fitness, nutrition, diet, exercise, or lifestyle habits with no concerning symptoms.
Classify as 'triage' if the message clearly describes a symptom, pain, illness, or medical concern.
Classify as 'ambiguous' if the message could reasonably be either — for example, mentions of tiredness, low energy, mood changes, or vague discomfort without enough detail to tell if it's lifestyle-related or symptom-related.

Examples:
'What's a good post-workout meal?' → wellness
'I twisted my ankle and it's swelling' → triage
'I've had a headache for 3 days and it's getting worse' → triage
'How many calories should I eat to lose weight?' → wellness
'I feel a bit off today' → ambiguous
'My chest hurts when I breathe deeply' → triage
'What's the best way to build muscle?' → wellness`;

// Ambiguous Clarifying Follow-Up Question Instruction (Sub-feature 2.2)
const AMBIGUOUS_CLARIFYING_INSTRUCTION = HEALTH_BOUNDARY_RULE + `The user's message was ambiguous — it could be a general wellness matter or a medical concern. Ask ONE short, natural clarifying question to help determine which it is. Examples of good clarifying questions: 'Is this affecting your daily activities?', 'Are you experiencing any other symptoms along with this?', 'How long has this been going on?'. Only ask one question, keep it brief and conversational, do not diagnose or give advice yet.`;

// Friendly Fitness & Nutrition Coach Instruction (Sub-feature 2.4: Wellness downstream)
const WELLNESS_COACH_INSTRUCTION = HEALTH_BOUNDARY_RULE + `You are a friendly fitness and nutrition coach. Give practical, encouraging wellness advice. Keep responses concise.`;

// Stored User Health Profile Context Formatter (Sub-feature 2.4)
// Default profile has NO diabetes; answers generally and inquires rather than presuming
function formatUserProfileContext(profile?: any): string {
  if (!profile) {
    return `User Profile Context: General adult. No pre-existing medical conditions recorded. Answer generally without assuming specific conditions (e.g., diabetes or hypertension). If nutrition or fitness plans depend on specific conditions like diabetes, ask the user if they have any such conditions rather than presuming.`;
  }
  const age = profile.age || 30;
  const activity = profile.activityLevel || "Moderate";
  const conditions = Array.isArray(profile.knownConditions) ? profile.knownConditions : [];

  if (conditions.length > 0) {
    return `User Profile Context: Age ${age}, Activity Level: ${activity}, Recorded Health Conditions: ${conditions.join(", ")}.`;
  }

  return `User Profile Context: Age ${age}, Activity Level: ${activity}. No pre-existing medical conditions recorded. Answer generally without assuming specific conditions (such as diabetes). If guidance significantly depends on specific conditions like diabetes, metabolic conditions, or allergies, ask the user whether they have any such conditions rather than presuming.`;
}

// Deterministic Classification Helper (Temperature: 0)
async function classifyMessageIntent(
  userText: string,
  isFollowUp = false,
  originalMessage = ""
): Promise<"wellness" | "triage" | "ambiguous"> {
  const ai = getGemini();
  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.8-flash",
  ];

  let queryContent = userText.trim();
  if (isFollowUp && originalMessage) {
    queryContent = `Initial statement: "${originalMessage}". Follow-up clarification answer: "${userText}". Classify as wellness or triage based on full combined context.`;
  }

  let rawOutput = "";
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: queryContent,
        config: {
          systemInstruction: CLASSIFIER_INSTRUCTION,
          temperature: 0, // Deterministic
        },
      });
      rawOutput = (response.text || "").trim().toLowerCase();
      if (rawOutput) break;
    } catch (err: any) {
      console.warn(`Classifier with ${model} failed:`, err?.message || err);
    }
  }

  // Sanitize label
  if (rawOutput.includes("wellness")) return "wellness";
  if (rawOutput.includes("triage")) return "triage";
  if (rawOutput.includes("ambiguous")) {
    // If this is a follow-up reclassification, do NOT return ambiguous a second time — default to triage for safety!
    if (isFollowUp) return "triage";
    return "ambiguous";
  }

  // Fallback safe default
  return isFollowUp ? "triage" : "ambiguous";
}

// API Health
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Precheck API Endpoint (Lightweight domain boundary check)
app.post("/api/precheck", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing or invalid 'message' string." });
      return;
    }

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // fastest model for quick pre-checks
      contents: message,
      config: {
        systemInstruction: "Is this message related to health, wellbeing, fitness, nutrition, or medical topics? Respond with only 'yes' or 'no'.",
        temperature: 0,
      },
    });

    const answer = (response.text || "").trim().toLowerCase();
    const isHealthRelated = answer.includes("yes");

    res.json({ isHealthRelated });
  } catch (error: any) {
    console.error("Precheck error:", error);
    // On error, default to true to avoid blocking valid queries due to a temporary glitch
    res.json({ isHealthRelated: true });
  }
});

// Sub-feature 2.1 & 2.3: Dedicated Classifier Endpoint
app.post("/api/classify", async (req: Request, res: Response) => {
  try {
    const { message, isFollowUp, originalMessage } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing or invalid 'message' string." });
      return;
    }

    const intentLabel = await classifyMessageIntent(
      message,
      Boolean(isFollowUp),
      originalMessage || ""
    );

    res.json({
      intentLabel,
      temperature: 0,
      isFollowUp: Boolean(isFollowUp),
    });
  } catch (error: any) {
    console.error("Classification error:", error);
    res.status(500).json({ error: "Failed to classify intent." });
  }
});

// Sub-feature 2.2: Ambiguous Clarifying Follow-up Question Generator Endpoint
app.post("/api/clarify-ambiguous", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Missing or invalid 'message' string." });
      return;
    }

    const ai = getGemini();
    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
    ];

    let question = "";
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: message,
          config: {
            systemInstruction: AMBIGUOUS_CLARIFYING_INSTRUCTION,
            temperature: 0.2,
          },
        });
        question = (response.text || "").trim();
        if (question) break;
      } catch (err: any) {
        console.warn(`Clarify question with ${model} failed:`, err?.message || err);
      }
    }

    if (!question) {
      question = "Are you experiencing any other symptoms along with this, or is this affecting your day-to-day activities?";
    }

    res.json({ clarifyingQuestion: question });
  } catch (error: any) {
    console.error("Clarify ambiguous error:", error);
    res.json({
      clarifyingQuestion: "Could you share a bit more detail on whether this feels like a workout/lifestyle fatigue or an illness symptom?",
    });
  }
});

// Chat API Endpoint with Intent Classification & Route Handoff (Sub-features 2.1 - 2.4)
app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const {
      messages,
      forceNoQuestions,
      intentLabel: providedIntent,
      isClarificationReply,
      originalAmbiguousMessage,
      userProfile,
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Missing or invalid 'messages' array." });
      return;
    }

    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === "user");
    const lastUserText = lastUserMessage ? lastUserMessage.text : "";

    // Emergency trigger screening check (always runs first for patient safety)
    if (isRedFlagEmergency(lastUserText)) {
      const emergencyResponse = `Urgency: EMERGENCY\n⚠️ EMERGENCY: These symptoms may require immediate medical attention. Please call emergency services or go to the nearest emergency room now.\n\nThese symptoms can sometimes be associated with an acute medical emergency, but only a healthcare professional can confirm a diagnosis. Do not delay or attempt self-treatment—please seek emergency medical care immediately by calling 911 or your local emergency number, or proceeding to the nearest emergency facility.\n\n⚕️ This is not a medical diagnosis. Please consult a healthcare professional.`;
      res.json({
        text: emergencyResponse,
        intentLabel: "triage",
        isClarifyingQuestion: false,
      });
      return;
    }

    const profileContext = formatUserProfileContext(userProfile);
    const ai = getGemini();

    // 1. Determine or resolve the intentLabel
    let resolvedIntent = providedIntent;
    if (!resolvedIntent) {
      resolvedIntent = await classifyMessageIntent(
        lastUserText,
        Boolean(isClarificationReply),
        originalAmbiguousMessage || ""
      );
    }

    // 2. Sub-feature 2.2: Ambiguous Handling
    // When classified as ambiguous and not yet a follow-up reply, generate ONE short clarifying follow-up question
    if (resolvedIntent === "ambiguous" && !isClarificationReply) {
      let clarifyingQ = "";
      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-3.6-flash",
        "gemini-3.8-flash",
      ];
      for (const model of modelsToTry) {
        try {
          const resClarify = await ai.models.generateContent({
            model,
            contents: lastUserText,
            config: {
              systemInstruction: AMBIGUOUS_CLARIFYING_INSTRUCTION,
              temperature: 0.2,
            },
          });
          clarifyingQ = (resClarify.text || "").trim();
          if (clarifyingQ) break;
        } catch (e: any) {
          console.warn(`Ambiguous clarify generation error:`, e?.message || e);
        }
      }

      if (!clarifyingQ) {
        clarifyingQ = "Are you experiencing any other symptoms along with this, or is this related to your recent physical activity or routine?";
      }

      res.json({
        text: clarifyingQ,
        intentLabel: "ambiguous",
        isClarifyingQuestion: true,
      });
      return;
    }

    // If still ambiguous after clarification, default to triage for safety
    if (resolvedIntent === "ambiguous") {
      resolvedIntent = "triage";
    }

    // 3. Sub-feature 2.4: Route Handoff based on final intentLabel
    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    // ROUTE A: WELLNESS COACH
    if (resolvedIntent === "wellness") {
      let dynamicContext = "";
      if (userProfile && (userProfile.conditions?.length > 0 || userProfile.allergies?.length > 0)) {
        const allConstraints = [...(userProfile.conditions || []), ...(userProfile.allergies || [])];
        const activeRules = [];
        for (const c of allConstraints) {
          const rule = CONDITION_RULES[c.toLowerCase()];
          if (rule) activeRules.push(`- ${c}: ${rule}`);
        }
        if (activeRules.length > 0) {
          dynamicContext = `\n\nThe user has the following health conditions and allergies: ${allConstraints.join(", ")}.\nYou MUST apply these constraints to your response:\n${activeRules.join("\n")}\nIf your recommendation would normally conflict with any of these rules, do not give the generic version — instead modify the recommendation to comply with the constraint, or clearly flag why it's being adjusted.\nIMPORTANT: If you adjust the advice based on these rules, YOU MUST START your response with exactly this format on the very first line:\n[ADJUSTED for {condition or allergy name}: {short reason}]\n`;
        }
      }

      const wellnessSystemInstruction = `${WELLNESS_COACH_INSTRUCTION}\n\n${profileContext}${dynamicContext}`;

      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      let wellnessText = "";
      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction: wellnessSystemInstruction,
              temperature: 0.3,
            },
          });
          wellnessText = response.text || "";
          if (wellnessText) break;
        } catch (err: any) {
          console.warn(`Wellness coach model ${modelName} failed:`, err?.message || err);
        }
      }

      if (!wellnessText) {
        wellnessText = "Staying active, maintaining balanced whole-food meals, and prioritizing adequate rest are wonderful foundations for your wellness journey! What specific fitness or nutrition goal would you like to explore next?";
      }

      res.json({
        text: wellnessText,
        intentLabel: "wellness",
        isClarifyingQuestion: false,
      });
      return;
    }

    // ROUTE B: CLINICAL SAFETY TRIAGE (Feature 1 clinical system instruction)
    let currentSystemInstruction = `${SYSTEM_INSTRUCTION}\n\n${profileContext}`;
    if (forceNoQuestions) {
      currentSystemInstruction += `\n\nCRITICAL ENFORCEMENT: The cross-questioning phase is COMPLETE. Do not ask any more questions. Provide your best-effort urgency classification and comprehensive '### 🌿 Holistic Solution & Care Plan' now using the information already provided. Begin with the required urgency label (Urgency: LOW, Urgency: MEDIUM, Urgency: HIGH, or Urgency: EMERGENCY) and deliver practical holistic remedies, lifestyle steps, red flags to watch for, and medical follow-up guidelines. Do NOT ask the user anything further. Always end with: '⚕️ This is not a medical diagnosis. Please consult a healthcare professional.'`;
    }

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    let responseText = "";
    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: currentSystemInstruction,
            temperature: 0.2,
          },
        });
        responseText = response.text || "";
        if (responseText) break;
      } catch (err: any) {
        console.warn(`Triage model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!responseText) {
      responseText = `Urgency: MEDIUM\n\nThe wellness assistant is temporarily experiencing high request volume. Here is general symptom guidance:\n\n* **Monitor your symptoms:** Keep track of the duration, intensity, and any changes.\n* **Rest and hydration:** Ensure adequate fluid intake and restful sleep.\n* **When to consult a doctor:** If symptoms persist or worsen, consult a healthcare professional.\n* **Red flags:** If severe chest pain or breathing difficulty occurs, seek immediate emergency care.\n\n⚕️ This is not a medical diagnosis. Please consult a healthcare professional.`;
    }

    res.json({
      text: responseText,
      intentLabel: "triage",
      isClarifyingQuestion: false,
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.json({
      text: `Urgency: MEDIUM\n\nWe encountered a temporary connection issue. Please consult a healthcare professional for personalized guidance regarding your symptoms.\n\n⚕️ This is not a medical diagnosis. Please consult a healthcare professional.`,
      intentLabel: "triage",
      isClarifyingQuestion: false,
    });
  }
});


// Meal Scanner AI Analysis Endpoint
app.post("/api/scan-meal", async (req: Request, res: Response) => {
  try {
    const { image, mimeType = "image/jpeg", userClarification, userProfile } = req.body;

    if (!image || typeof image !== "string") {
      res.status(400).json({ error: "Missing required 'image' (base64 string)." });
      return;
    }

    // Extract base64 data if prefixed with data:image/...;base64,
    let base64Data = image;
    let resolvedMimeType = mimeType;
    const dataUrlMatch = image.match(/^data:([^;]+);base64,(.+)$/);
    if (dataUrlMatch) {
      resolvedMimeType = dataUrlMatch[1];
      base64Data = dataUrlMatch[2];
    }

    const ai = getGemini();

    const mealPrompt = HEALTH_BOUNDARY_RULE + `You are a nutrition assistant analyzing a photo of a meal or food item.
Look at the image carefully and identify:
Every distinct food item visible in the image
Approximate portion size for each item (e.g., "1 cup", "150g", "1 medium piece")
Any visible preparation method (fried, grilled, steamed, raw, etc.)
Any visible sauces, dressings, or condiments that would affect nutrition
Consider the full plate/container context — don't miss smaller items like garnish, sauce pools, or side items partially visible at the edges of the frame.
If multiple food items are combined into a single dish (e.g., a stir fry, a sandwich, a salad), identify it as one item but list its major visible components.
Based on this identification, estimate calories, protein, carbohydrates, and fat for a typical serving matching what you see in the image.

Confidence/Uncertainty Handling:
Before finalizing your estimate, assess your own certainty:
Set "confidence": "high" if the food items are clearly visible, well-lit, and unambiguous (e.g., a whole apple, a clearly labeled packaged item).
Set "confidence": "medium" if you can identify the general dish but portion size, exact ingredients, or preparation method are unclear (e.g., "looks like a chicken curry, but the exact sauce and rice quantity are hard to judge").
Set "confidence": "low" if the image is blurry, poorly lit, food is heavily obscured, mixed together in a way that's hard to separate, or could plausibly be multiple different dishes.
If confidence is "medium" or "low", use the "notes" field to briefly explain what's uncertain and, if helpful, ask a clarifying question the user could answer (e.g., "Is this grilled or fried chicken?"). Do not silently guess and present it as certain — the notes field must reflect real ambiguity when it exists.
Never fabricate specificity you don't have (e.g., don't claim "6oz chicken breast" if you can't tell it's chicken breast — say "approximately 150g of a protein, likely chicken or turkey").

Portion Estimation Caveat:
Remember that portion and macro estimates from an image are inherently approximate — you cannot know exact weights, oil quantities, or hidden ingredients (e.g., butter/oil used in cooking, exact sugar in a sauce).
Always populate the "notes" field with a brief caveat when your estimate relies on typical/average assumptions, e.g.:
"Estimate assumes a standard restaurant portion and moderate oil use; actual values may vary ±20%."
Do not state calorie/macro numbers as if they are precise measurements. Frame them as reasonable estimates based on visual assessment and typical nutritional data for similar foods.

Structured Output:
Return your analysis as valid JSON only, with no markdown formatting, no code fences, and no explanatory text outside the JSON object. Use exactly this schema:
{
"food_items": [
{
"name": "string",
"estimated_portion": "string",
"preparation_method": "string or null"
}
],
"calories": number,
"protein_g": number,
"carbs_g": number,
"fat_g": number,
"confidence": "high" | "medium" | "low",
"notes": "string",
"allergyAlert": "string or null",
"conditionAlert": "string or null"
}
Do not include any text before or after the JSON object. If you cannot identify the food with reasonable confidence, still return this schema with your best estimate and set "confidence" accordingly.${
      userClarification
        ? `\n\nUser Context/Clarification: "${userClarification}". Incorporate this clarification to update ingredients, portion estimates, preparation methods, and refine calories and macronutrients accordingly.`
        : ""
    }`;

    let mealRules = "";
    if (userProfile && (userProfile.conditions?.length > 0 || userProfile.allergies?.length > 0)) {
      const allConstraints = [...(userProfile.conditions || []), ...(userProfile.allergies || [])];
      const activeRules = [];
      for (const c of allConstraints) {
        const rule = CONDITION_RULES[c.toLowerCase()];
        if (rule) activeRules.push(`- ${c}: ${rule}`);
      }
      if (activeRules.length > 0) {
        mealRules = `\n\nCRITICAL CONSTRAINTS TO CHECK:\nThe user has the following health conditions and allergies: ${allConstraints.join(", ")}.\nEvaluate the detected food items against these rules:\n${activeRules.join("\n")}\nIf any food_items match an active allergy from the rule table, provide a serious warning in the 'allergyAlert' field. If the meal is flagged as high-sugar/high-sodium/high-fat based on the active conditions, provide a warning in the 'conditionAlert' field. If no constraints match, leave them null.`;
      }
    }

    const contents = {
      parts: [
        {
          inlineData: {
            mimeType: resolvedMimeType,
            data: base64Data,
          },
        },
        {
          text: mealPrompt + mealRules,
        },
      ],
    };

    let rawJsonText = "";
    // Supported multimodal models: gemini-3.1-flash-lite, gemini-3.6-flash, gemini-3.8-flash
    const modelsToTry = [
      "gemini-3.1-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.8-flash",
    ];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });
        rawJsonText = response.text || "";
        if (rawJsonText) break;
      } catch (err: any) {
        console.warn(`Meal scan model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!rawJsonText) {
      res.json({
        food_items: [
          {
            name: "Unidentified meal item",
            estimated_portion: "1 standard serving",
            preparation_method: null,
          },
        ],
        calories: 350,
        protein_g: 15,
        carbs_g: 40,
        fat_g: 12,
        confidence: "low",
        notes: "Vision processing service was unable to analyze this photo due to high server demand. Estimate assumes an average mixed plate; actual values may vary ±20%.",
      });
      return;
    }

    let cleanJson = rawJsonText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    try {
      const parsed = JSON.parse(cleanJson);
      const formattedResult = {
        food_items: Array.isArray(parsed.food_items)
          ? parsed.food_items.map((item: any) => ({
              name: String(item.name || "Food item"),
              estimated_portion: String(item.estimated_portion || "1 serving"),
              preparation_method: item.preparation_method ? String(item.preparation_method) : null,
            }))
          : [
              {
                name: "Analyzed Dish",
                estimated_portion: "1 serving",
                preparation_method: null,
              },
            ],
        calories: typeof parsed.calories === "number" ? Math.round(parsed.calories) : 0,
        protein_g: typeof parsed.protein_g === "number" ? Math.round(parsed.protein_g) : 0,
        carbs_g: typeof parsed.carbs_g === "number" ? Math.round(parsed.carbs_g) : 0,
        fat_g: typeof parsed.fat_g === "number" ? Math.round(parsed.fat_g) : 0,
        confidence: ["high", "medium", "low"].includes(parsed.confidence)
          ? parsed.confidence
          : "medium",
        notes: String(
          parsed.notes ||
            "Estimate assumes a standard restaurant portion and moderate oil use; actual values may vary ±20%."
        ),
        allergyAlert: parsed.allergyAlert ? String(parsed.allergyAlert) : undefined,
        conditionAlert: parsed.conditionAlert ? String(parsed.conditionAlert) : undefined,
      };

      res.json(formattedResult);
    } catch (parseErr) {
      console.error("JSON parsing error from Gemini output:", parseErr, rawJsonText);
      res.status(500).json({ error: "Failed to parse structured nutritional output." });
    }
  } catch (error: any) {
    console.error("Meal scan error:", error);
    res.status(500).json({ error: error.message || "Failed to scan meal." });
  }
});


app.post("/api/fitness-coach", async (req: Request, res: Response) => {
  try {
    const { messages, userProfile } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing or invalid 'messages' array." });
      return;
    }

    const ai = getGemini();

    let dynamicContext = "";
    if (userProfile && (userProfile.conditions?.length > 0 || userProfile.allergies?.length > 0)) {
      const allConstraints = [...(userProfile.conditions || []), ...(userProfile.allergies || [])];
      const activeRules = [];
      for (const c of allConstraints) {
        const rule = CONDITION_RULES[c.toLowerCase()];
        if (rule) activeRules.push(`- ${c}: ${rule}`);
      }
      if (activeRules.length > 0) {
        dynamicContext = `\n\nThe user has the following health conditions and allergies: ${allConstraints.join(", ")}.\nYou MUST apply these constraints to your response:\n${activeRules.join("\n")}\nIf your recommendation would normally conflict with any of these rules, do not give the generic version — instead modify the recommendation to comply with the constraint, or clearly flag why it's being adjusted.\nIMPORTANT: If you adjust the advice based on these rules, YOU MUST START your response with exactly this format on the very first line:\n[ADJUSTED for {condition or allergy name}: {short reason}]\n`;
      }
    }

    const fitnessCoachInstruction = `${HEALTH_BOUNDARY_RULE}
You are an expert fitness coach and personal trainer. Your goal is to provide tailored workout plans, exercise advice, and fitness motivation. Keep responses structured, encouraging, and focused on physical training. Do not provide medical diagnoses.
${dynamicContext}`;

    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite", // Fast lightweight model for chat
      contents,
      config: {
        systemInstruction: fitnessCoachInstruction,
        temperature: 0.6,
      },
    });

    res.json({ text: response.text || "" });
  } catch (error: any) {
    console.error("Fitness coach API Error:", error);
    res.status(500).json({ error: "Unable to process request." });
  }
});

// Vite middleware / static files
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp();
