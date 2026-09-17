import type { GeminiKeyConfig, TravelDocumentData, ExtractionLog } from '../types/document';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface ExtractionResult {
  data: TravelDocumentData;
  keyUsedIndex: number;
  keyUsedLabel: string;
  logs: ExtractionLog[];
}

export function cleanApiKey(key: string): string {
  if (!key) return '';
  return key.trim().replace(/^["']|["']$/g, '').trim();
}

export const RECOMMENDED_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
];

export function getCandidateModels(preferredModel: string): string[] {
  const cleanPref = preferredModel.replace(/^models\//, '').trim();
  const candidates = [cleanPref, ...RECOMMENDED_MODELS];
  return Array.from(new Set(candidates));
}

export function isQuotaExceededError(status: number, message: string): boolean {
  if (status === 429) return true;
  const lower = message.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('exceeded your current quota') ||
    lower.includes('too many requests')
  );
}

/**
 * Robustly parses JSON from LLM response, handling markdown fences, leading/trailing text, and nested wrappers.
 */
export function parseGeminiJsonResponse(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from model');
  }

  const trimmed = rawText.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue to fallback
  }

  // 2. Extract from markdown code fence (```json ... ``` or ``` ...)
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Extract between outer braces { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const braceContent = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(braceContent);
    } catch {
      // continue
    }
  }

  throw new Error(`Failed to extract valid JSON from response: ${trimmed.slice(0, 120)}`);
}

/**
 * Extracts document details using Gemini Vision API with multi-model & multi-key failover.
 */
export async function extractDocumentWithFailover(
  base64ImageWithHeader: string,
  keys: GeminiKeyConfig[],
  model: string = 'gemini-3.1-flash-lite',
  onKeyStatusChange?: (updatedKeys: GeminiKeyConfig[], log: ExtractionLog) => void
): Promise<ExtractionResult> {
  const validKeys = keys.filter((k) => k.key && cleanApiKey(k.key).length > 0);

  if (validKeys.length === 0) {
    throw new Error('Please enter at least one Gemini API key in Settings (gear icon on top right).');
  }

  // Extract base64
  const match = base64ImageWithHeader.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  let mimeType = 'image/jpeg';
  let base64Data = base64ImageWithHeader;

  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  } else if (base64ImageWithHeader.includes(',')) {
    const parts = base64ImageWithHeader.split(',');
    base64Data = parts[1];
  }

  const systemPrompt = `You are an expert passport and visa document OCR extractor.
Read the provided document image (e.g. Visa, Umrah Visa, Tourist Visa, Passport).
Extract all visible details into a strict JSON object with these exact keys:

{
  "visaNumber": "string (Visa number if present, else empty)",
  "dateOfIssue": "string (Date of issue, Format: YYYY-MM-DD or as printed)",
  "validUntil": "string (Expiry date / valid until, Format: YYYY-MM-DD or as printed)",
  "durationOfStay": "string (Permitted duration of stay e.g. 30 DAYS, 90 DAYS)",
  "passportNumber": "string (Passport number)",
  "placeOfIssue": "string (City or Country of issue)",
  "name": "string (Full name of document holder)",
  "dateOfBirth": "string (Date of birth)",
  "nationality": "string (Nationality / Citizenship)",
  "typeOfVisa": "string (Type of visa e.g. UMRAH, TOURIST, VISIT, RESIDENCE)",
  "umrahOperator": "string (Saudi Company / Umrah Operator / Sponsor name if present, else empty)",
  "externalAgent": "string (External travel agent / agency if present, else empty)"
}

Output ONLY the raw JSON object. Do not include markdown or explanations.`;

  const logs: ExtractionLog[] = [];
  let currentKeysState = [...keys];
  const modelCandidates = getCandidateModels(model);

  // Loop through available keys
  for (let keyIdx = 0; keyIdx < validKeys.length; keyIdx++) {
    const keyConfig = validKeys[keyIdx];
    const keyIndex = keys.findIndex((k) => k.id === keyConfig.id);
    const sanitizedKey = cleanApiKey(keyConfig.key);

    currentKeysState = currentKeysState.map((k) =>
      k.id === keyConfig.id ? { ...k, status: 'active', lastUsed: Date.now() } : k
    );

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    let keySucceeded = false;
    let successfulData: TravelDocumentData | null = null;
    let successfulModel = '';

    // Loop through candidate models for this key (handles 404 or 429 per-model quota)
    for (const candidateModel of modelCandidates) {
      try {
        const res = await fetch(
          `${GEMINI_API_BASE}/${candidateModel}:generateContent?key=${encodeURIComponent(sanitizedKey)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': sanitizedKey,
            },
            body: JSON.stringify(requestPayload),
          }
        );

        if (res.status === 404) {
          // Model not found on this tier, try next candidate model
          continue;
        }

        if (res.status === 429) {
          // Quota limit hit on this specific model, try next candidate model (e.g. gemini-3.1-flash-lite)
          continue;
        }

        if (!res.ok) {
          // Non-quota error, try next model or break
          continue;
        }

        const resultJson = await res.json();
        const rawText = resultJson?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          continue;
        }

        // Robust parse handling all shapes & markdown fences
        const parsedRaw = parseGeminiJsonResponse(rawText);
        const flatParsed: any = parsedRaw.visa_details || parsedRaw.details || parsedRaw.document || parsedRaw;

        successfulData = {
          visaNumber: flatParsed.visaNumber || flatParsed.visa_number || flatParsed.visaNo || '',
          dateOfIssue: flatParsed.dateOfIssue || flatParsed.issue_date || flatParsed.date_of_issue || '',
          validUntil: flatParsed.validUntil || flatParsed.expiry_date || flatParsed.valid_until || flatParsed.expiryDate || '',
          durationOfStay: flatParsed.durationOfStay || flatParsed.duration || flatParsed.duration_of_stay || '',
          passportNumber: flatParsed.passportNumber || flatParsed.passport_number || flatParsed.passportNo || '',
          placeOfIssue: flatParsed.placeOfIssue || flatParsed.place_of_issue || flatParsed.issue_place || '',
          name: flatParsed.name || flatParsed.full_name || flatParsed.fullName || flatParsed.applicant_name || '',
          dateOfBirth: flatParsed.dateOfBirth || flatParsed.date_of_birth || flatParsed.dob || '',
          nationality: flatParsed.nationality || flatParsed.citizenship || '',
          typeOfVisa: flatParsed.typeOfVisa || flatParsed.visa_type || flatParsed.visaType || '',
          umrahOperator: flatParsed.umrahOperator || flatParsed.umrah_operator || flatParsed.saudi_company || flatParsed.company || '',
          externalAgent: flatParsed.externalAgent || flatParsed.external_agent || flatParsed.agent || '',
          applicantPhotoUrl: base64ImageWithHeader,
          barcode: (flatParsed.visaNumber || flatParsed.visa_number) ? `VISA-${flatParsed.visaNumber || flatParsed.visa_number}` : '',
          notes: '',
        };

        successfulModel = candidateModel;
        keySucceeded = true;
        break;
      } catch {
        // Continue to next model candidate if parse or network fails
      }
    }

    if (keySucceeded && successfulData) {
      const successLog: ExtractionLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        keyUsedLabel: keyConfig.label,
        keyIndex: keyConfig.id,
        status: 'success',
        message: `Extracted using ${keyConfig.label}`,
      };
      logs.push(successLog);

      if (onKeyStatusChange) {
        onKeyStatusChange(currentKeysState, successLog);
      }

      return {
        data: successfulData,
        keyUsedIndex: keyIndex,
        keyUsedLabel: `${keyConfig.label} (${successfulModel})`,
        logs,
      };
    }

    // If this key failed on all candidate models (quota exhausted)
    const hasNextKey = keyIdx + 1 < validKeys.length;
    const failoverLog: ExtractionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      keyUsedLabel: keyConfig.label,
      keyIndex: keyConfig.id,
      status: 'quota_failover',
      message: hasNextKey
        ? `⚡ ${keyConfig.label} quota exceeded. Auto-shifted to ${validKeys[keyIdx + 1].label}.`
        : `❌ ${keyConfig.label} quota exhausted.`,
    };
    logs.push(failoverLog);

    currentKeysState = currentKeysState.map((k) =>
      k.id === keyConfig.id ? { ...k, status: 'quota_exhausted', errorCount: k.errorCount + 1 } : k
    );

    if (onKeyStatusChange) {
      onKeyStatusChange(currentKeysState, failoverLog);
    }

    if (hasNextKey) {
      // Proceed to next key in loop!
      continue;
    }
  }

  throw new Error('Quota exceeded on configured Gemini API key. Please add another key in Settings (⚙️) or wait a moment.');
}

/**
 * Tests an individual Gemini API key.
 */
export async function testGeminiKey(
  apiKey: string,
  model: string = 'gemini-3.1-flash-lite'
): Promise<{ success: boolean; status: number; message: string }> {
  const cleanKey = cleanApiKey(apiKey);
  if (!cleanKey) {
    return { success: false, status: 0, message: 'API key cannot be empty' };
  }

  // 1. Try listModels
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`,
      {
        method: 'GET',
        headers: { 'x-goog-api-key': cleanKey },
      }
    );

    if (listRes.ok) {
      return { success: true, status: 200, message: '✓ Key Active & Verified' };
    }
    if (listRes.status === 429) {
      return { success: false, status: 429, message: 'Quota Exhausted (429)' };
    }
  } catch {
    // continue
  }

  // 2. Try candidate models
  const candidates = getCandidateModels(model);
  for (const m of candidates) {
    try {
      const res = await fetch(
        `${GEMINI_API_BASE}/${m}:generateContent?key=${encodeURIComponent(cleanKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': cleanKey,
          },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'OK' }] }] }),
        }
      );

      if (res.ok) {
        return { success: true, status: 200, message: `✓ Key Active (${m})` };
      }

      if (res.status === 429) {
        return { success: false, status: 429, message: 'Quota Exhausted (429)' };
      }
    } catch {
      // continue
    }
  }

  return { success: false, status: 400, message: 'Key verification failed. Please check key.' };
}
