import { UrgencyLevel } from '../types';

export const EMERGENCY_WARNING_TEXT =
  '⚠️ EMERGENCY: These symptoms may require immediate medical attention. Please call emergency services or go to the nearest emergency room now.';

export const REQUIRED_DISCLAIMER =
  '⚕️ This is not a medical diagnosis. Please consult a healthcare professional.';

/**
 * Detect emergency escalation triggers BEFORE normal urgency classification.
 * Matches the specified emergency situations:
 * 1. Chest pain combined with shortness of breath
 * 2. Sudden confusion or difficulty speaking
 * 3. Severe allergic reaction involving swelling or difficulty breathing
 * 4. Rapidly spreading hives together with concerning allergic symptoms
 * 5. Signs suggestive of stroke such as facial drooping, arm weakness, or slurred speech
 * 6. Uncontrolled bleeding
 * 7. Suicidal thoughts or self-harm intent
 */
export function detectEmergencyTrigger(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();

  // 1. Chest pain combined with shortness of breath
  const hasChestPain =
    lower.includes('chest pain') ||
    lower.includes('pain in my chest') ||
    lower.includes('chest pressure') ||
    lower.includes('pressure in my chest') ||
    lower.includes('chest tightness') ||
    lower.includes('tightness in my chest') ||
    lower.includes('crushing chest');

  const hasShortnessOfBreath =
    lower.includes('shortness of breath') ||
    lower.includes('trouble breathing') ||
    lower.includes('difficulty breathing') ||
    lower.includes('hard to breathe') ||
    lower.includes("can't breathe") ||
    lower.includes('cannot breathe') ||
    lower.includes('gasping for air') ||
    lower.includes('having trouble breathing') ||
    lower.includes('breathless');

  if (hasChestPain && hasShortnessOfBreath) return true;

  // 2. Sudden confusion or difficulty speaking
  const hasConfusion =
    lower.includes('confusion') ||
    lower.includes('confused') ||
    lower.includes('disoriented');
  const hasSudden =
    lower.includes('sudden') ||
    lower.includes('suddenly') ||
    lower.includes('acute');
  const hasSpeechDifficulty =
    lower.includes('difficulty speaking') ||
    lower.includes('trouble speaking') ||
    lower.includes("can't speak") ||
    lower.includes('cannot speak') ||
    lower.includes('unable to speak') ||
    lower.includes('slurred speech') ||
    lower.includes('slurring');

  if ((hasConfusion && hasSudden) || hasSpeechDifficulty) return true;

  // 3. Severe allergic reaction involving swelling or difficulty breathing
  const hasAllergy =
    lower.includes('severe allergic') ||
    lower.includes('allergic reaction') ||
    lower.includes('anaphylaxis') ||
    lower.includes('anaphylactic');
  const hasSwellingOrBreathing =
    lower.includes('swelling') ||
    lower.includes('swollen') ||
    lower.includes('throat') ||
    lower.includes('tongue') ||
    lower.includes('lip') ||
    hasShortnessOfBreath;

  if (
    (hasAllergy && hasSwellingOrBreathing) ||
    lower.includes('anaphylaxis') ||
    lower.includes('anaphylactic shock')
  ) {
    return true;
  }

  // 4. Rapidly spreading hives together with concerning allergic symptoms
  const hasHives =
    lower.includes('hives') ||
    lower.includes('urticaria') ||
    lower.includes('welts');
  const hasSpreading =
    lower.includes('spreading') ||
    lower.includes('rapid') ||
    lower.includes('fast');

  if (hasHives && (hasSpreading || hasAllergy || hasSwellingOrBreathing)) {
    return true;
  }

  // 5. Signs suggestive of stroke such as facial drooping, arm weakness, or slurred speech
  const hasStrokeSigns =
    lower.includes('facial drooping') ||
    lower.includes('face drooping') ||
    lower.includes('drooping face') ||
    lower.includes('arm weakness') ||
    lower.includes('weakness in arm') ||
    lower.includes('weak arm') ||
    lower.includes('stroke') ||
    lower.includes('slurred speech');

  if (hasStrokeSigns) return true;

  // 6. Uncontrolled bleeding
  const hasBleeding =
    lower.includes('uncontrolled bleeding') ||
    lower.includes('bleeding heavily') ||
    lower.includes("won't stop bleeding") ||
    lower.includes('heavy bleeding') ||
    lower.includes('cannot stop bleeding') ||
    lower.includes('bleeding uncontrollably');

  if (hasBleeding) return true;

  // 7. Suicidal thoughts or self-harm intent
  const hasSuicidal =
    lower.includes('suicid') ||
    lower.includes('kill myself') ||
    lower.includes('end my life') ||
    lower.includes('want to die') ||
    lower.includes('self-harm') ||
    lower.includes('harm myself') ||
    lower.includes('hurt myself');

  if (hasSuicidal) return true;

  return false;
}

/**
 * Generates the standardized immediate EMERGENCY response without asking clarifying questions.
 */
export function buildEmergencyResponse(): string {
  return `Urgency: EMERGENCY\n${EMERGENCY_WARNING_TEXT}\n\nThese symptoms can sometimes be associated with an acute medical emergency, but only a healthcare professional can confirm a diagnosis. Do not delay or attempt self-treatment—please call emergency services (such as 911 or your local emergency number) or proceed to the nearest emergency facility immediately.\n\n${REQUIRED_DISCLAIMER}`;
}

/**
 * Extracts the urgency classification and removes the raw "Urgency: X" line from the text.
 */
export function parseUrgency(rawText: string): {
  urgency: UrgencyLevel;
  cleanText: string;
} {
  if (!rawText) return { urgency: 'LOW', cleanText: '' };

  let urgency: UrgencyLevel = 'MEDIUM';
  let cleanText = rawText.trim();

  // Look for Urgency: LOW | MEDIUM | HIGH | EMERGENCY (with optional markdown bold)
  const urgencyMatch = cleanText.match(
    /^(?:[\*\#\s]*)(?:Urgency|Classification)\s*:\s*(LOW|MEDIUM|HIGH|EMERGENCY)(?:[\*\#\s]*)/i
  );

  if (urgencyMatch) {
    const matched = urgencyMatch[1].toUpperCase() as UrgencyLevel;
    urgency = matched;
    // Remove the leading urgency line
    cleanText = cleanText.replace(
      /^(?:[\*\#\s]*)(?:Urgency|Classification)\s*:\s*(?:LOW|MEDIUM|HIGH|EMERGENCY)(?:[\*\#\s]*)\n*/i,
      ''
    ).trim();
  } else {
    // If not at the very top, search anywhere in the text
    const fallbackMatch = cleanText.match(
      /(?:Urgency|Classification)\s*:\s*(LOW|MEDIUM|HIGH|EMERGENCY)|\b\*\*(LOW|MEDIUM|HIGH|EMERGENCY)(?::|\*\*)\b/i
    );
    if (fallbackMatch) {
      urgency = (fallbackMatch[1] || fallbackMatch[2]).toUpperCase() as UrgencyLevel;
      cleanText = cleanText.replace(
        /(?:\*{0,2})(?:Urgency|Classification)\s*:\s*(?:LOW|MEDIUM|HIGH|EMERGENCY)(?:\*{0,2})\n*/i,
        ''
      ).trim();
    } else if (cleanText.includes(EMERGENCY_WARNING_TEXT) || cleanText.includes('EMERGENCY')) {
      urgency = 'EMERGENCY';
    }
  }

  return { urgency, cleanText };
}

/**
 * Frontend Disclaimer Safety Net
 * If the response does NOT contain "not a medical diagnosis.",
 * automatically append "⚕️ This is not a medical diagnosis. Please consult a healthcare professional."
 */
export function ensureDisclaimer(text: string): string {
  const trimmed = text.trim();
  if (/not a medical diagnosis\./i.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}\n\n${REQUIRED_DISCLAIMER}`;
}

/**
 * Count clarifying questions asked by Gemini in a response text.
 * Detects questions ending with '?' or question phrases.
 */
export function countClarifyingQuestions(text: string): number {
  if (!text) return 0;
  // Remove the disclaimer line if present so we don't accidentally check it
  const withoutDisclaimer = text.replace(/⚕️.*$/i, '').trim();

  // Find all question marks in the body
  const questionMatches = withoutDisclaimer.match(/\?/g);
  return questionMatches ? questionMatches.length : 0;
}

/**
 * Detect whether this response is in the cross-questioning phase or final solution phase.
 */
export function detectPhase(
  text: string,
  isEmergency: boolean,
  currentQuestionCount: number
): 'cross-questioning' | 'solution' | 'emergency' {
  if (isEmergency) return 'emergency';

  const lower = text.toLowerCase();
  const hasQuestions = text.includes('?') || lower.includes('cross-question') || lower.includes('clarify:');
  const hasExplicitSolution =
    lower.includes('holistic solution') ||
    lower.includes('actionable steps') ||
    lower.includes('home remedies') ||
    lower.includes('care plan') ||
    lower.includes('lifestyle recommendations') ||
    lower.includes('solution:');

  if (hasExplicitSolution && (!hasQuestions || currentQuestionCount >= 3)) {
    return 'solution';
  }

  if (hasQuestions && currentQuestionCount < 3) {
    return 'cross-questioning';
  }

  return 'solution';
}

/**
 * Generates quick context-aware answer suggestions for cross-questioning.
 */
export function generateSuggestedAnswers(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();

  // If already at solution or emergency, no questioning chips needed
  if (lower.includes('⚠️ emergency') || lower.includes('holistic solution &')) {
    return [];
  }

  // Severity / 1-10
  if (
    lower.includes('scale') ||
    lower.includes('1-10') ||
    lower.includes('1 to 10') ||
    lower.includes('intensity') ||
    lower.includes('severity') ||
    lower.includes('mild, moderate')
  ) {
    return ['Mild (1-3/10)', 'Moderate (4-6/10)', 'Severe (7-10/10)', 'Give Solution Now'];
  }

  // Duration / onset
  if (
    lower.includes('how long') ||
    lower.includes('duration') ||
    lower.includes('when did') ||
    lower.includes('started') ||
    lower.includes('days') ||
    lower.includes('hours')
  ) {
    return ['Just started today', '1–2 days ago', 'About a week', 'Give Solution Now'];
  }

  // Co-occurring / other symptoms
  if (
    lower.includes('other symptoms') ||
    lower.includes('fever') ||
    lower.includes('nausea') ||
    lower.includes('alongside') ||
    lower.includes('associated') ||
    lower.includes('experiencing any other')
  ) {
    return ['No other symptoms', 'Mild fatigue', 'Slight fever', 'Give Solution Now'];
  }

  // Pain type / description
  if (
    lower.includes('throbbing') ||
    lower.includes('sharp') ||
    lower.includes('dull') ||
    lower.includes('describe the') ||
    lower.includes('nature of the')
  ) {
    return ['Dull & constant', 'Throbbing / pulsing', 'Sharp ache', 'Give Solution Now'];
  }

  // Aggravating or relieving factors / triggers
  if (
    lower.includes('triggers') ||
    lower.includes('worse') ||
    lower.includes('better') ||
    lower.includes('reliev') ||
    lower.includes('aggravat')
  ) {
    return ['Worse with screen time', 'Worse when moving', 'Rest helps slightly', 'Give Solution Now'];
  }

  // Default if question is asked
  if (text.includes('?')) {
    return ['Yes', 'No', 'Not sure', 'Give Solution Now'];
  }

  return [];
}

/**
 * Checks if the user is introducing a substantially new/different symptom report,
 * rather than clarifying the current one.
 */
export function isNewSymptomReport(currentMessage: string, previousUserMessages: string[]): boolean {
  if (previousUserMessages.length === 0) return true;

  const lower = currentMessage.toLowerCase();
  
  // Explicit new symptom signals
  if (
    lower.includes('new symptom') ||
    lower.includes('different symptom') ||
    lower.includes('different issue') ||
    lower.includes('something else') ||
    lower.includes('unrelated') ||
    lower.includes('unrelated question') ||
    lower.includes('another issue') ||
    lower.includes('start over') ||
    lower.includes('different problem')
  ) {
    return true;
  }

  // If user is simply replying with duration/severity/answers, it is NOT a new symptom
  const isClarifyingAnswer =
    /^\s*(yes|no|none|mild|moderate|severe|1|2|3|4|5|6|7|8|9|10|\d+\s*(days?|weeks?|hours?|months?)|don'?t know|not sure|about \d+)\b/i.test(
      lower
    ) || lower.length < 25;

  if (isClarifyingAnswer) {
    return false;
  }

  // Body region switches: e.g. headache vs ankle vs stomach
  const anatomicalClusters = [
    ['headache', 'migraine', 'head pain', 'temple', 'scalp'],
    ['cough', 'throat', 'chest', 'breathing', 'lungs', 'congestion'],
    ['stomach', 'abdomen', 'nausea', 'vomit', 'diarrhea', 'cramp', 'belly'],
    ['ankle', 'knee', 'leg', 'foot', 'foot pain', 'joint', 'sprain'],
    ['back', 'spine', 'lumbar', 'sciatica'],
    ['skin', 'rash', 'hives', 'itch', 'eczema'],
    ['eye', 'vision', 'ear', 'hearing'],
  ];

  const lastUserText = previousUserMessages[previousUserMessages.length - 1].toLowerCase();

  for (const cluster of anatomicalClusters) {
    const matchesCurrent = cluster.some((k) => lower.includes(k));
    const matchesLast = cluster.some((k) => lastUserText.includes(k));

    if (matchesCurrent && !matchesLast) {
      // Current message contains a distinct symptom cluster not in the prior message
      // and doesn't mention the prior cluster
      const priorCluster = anatomicalClusters.find((c) => c.some((k) => lastUserText.includes(k)));
      if (priorCluster && !priorCluster.some((k) => lower.includes(k))) {
        return true;
      }
    }
  }

  return false;
}
