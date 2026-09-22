import type { GeminiKeyConfig, TravelDocumentData, ExtractionLog } from '../types/document';

// Production Gemini API key hardcoded so the application can parse documents out-of-the-box from any location/device
const ENCODED_GEMINI_KEY = 'QVEuQWI4Uk42SmhwN3E0bDB6bHNnMjBaUjdSTGI1cTE3V1pvcXVWZTBJVzBQSG9CSHV3V0E=';
export const HARDCODED_GEMINI_KEY = typeof atob !== 'undefined'
  ? atob(ENCODED_GEMINI_KEY)
  : (typeof Buffer !== 'undefined' ? Buffer.from(ENCODED_GEMINI_KEY, 'base64').toString('utf-8') : '');

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export interface ExtractionResult {
  data: TravelDocumentData;
  keyUsedIndex: number;
  keyUsedLabel: string;
  logs: ExtractionLog[];
}

export function cleanApiKey(key?: string): string {
  if (!key) return '';
  return key.trim().replace(/^["']|["']$/g, '').trim();
}

export const RECOMMENDED_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
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
 * Automatically converts SVG data URLs or SVG markup to high-resolution PNG data URLs
 * because Gemini Vision API inline_data rejects image/svg+xml with 400 INVALID_ARGUMENT.
 */
/**
 * Automatically converts SVG data URLs or SVG markup to high-resolution PNG data URLs
 * because Gemini Vision API inline_data rejects image/svg+xml with 400 INVALID_ARGUMENT.
 */
export async function convertSvgToPngDataUrl(svgDataUrl: string): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return svgDataUrl;
  }

  const isSvg = svgDataUrl.startsWith('data:image/svg+xml') || svgDataUrl.trim().startsWith('<svg') || svgDataUrl.includes('<svg');
  if (!isSvg) {
    return svgDataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = (img.naturalWidth && img.naturalWidth > 0) ? img.naturalWidth : 1200;
          const height = (img.naturalHeight && img.naturalHeight > 0) ? img.naturalHeight : 800;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(svgDataUrl);
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const pngData = canvas.toDataURL('image/png', 0.95);
          resolve(pngData);
        } catch {
          resolve(svgDataUrl);
        }
      };

      img.onerror = () => {
        resolve(svgDataUrl);
      };

      let src = svgDataUrl;
      if (svgDataUrl.trim().startsWith('<svg')) {
        src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgDataUrl)}`;
      }
      img.src = src;
    } catch {
      resolve(svgDataUrl);
    }
  });
}

function cleanJsonString(str: string): string {
  return str
    .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
    .replace(/^\uFEFF/, '')        // strip BOM if present
    .trim();
}

/**
 * Robustly parses JSON from LLM response, handling markdown fences, leading/trailing text, arrays, and nested wrappers.
 */
export function parseGeminiJsonResponse(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from model');
  }

  const trimmed = rawText.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(cleanJsonString(trimmed));
  } catch {
    // continue to fallback
  }

  // 2. Extract from markdown code fence (```json ... ``` or ``` ...)
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(cleanJsonString(fenceMatch[1]));
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
      return JSON.parse(cleanJsonString(braceContent));
    } catch {
      // continue
    }
  }

  // 4. Extract between outer brackets [ { ... } ]
  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const arr = JSON.parse(cleanJsonString(trimmed.slice(firstBracket, lastBracket + 1)));
      if (Array.isArray(arr) && arr.length > 0) {
        return arr[0];
      }
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
  keys: GeminiKeyConfig[] = [],
  model: string = 'gemini-3.1-flash-lite',
  onKeyStatusChange?: (updatedKeys: GeminiKeyConfig[], log: ExtractionLog) => void
): Promise<ExtractionResult> {
  let validKeys = (keys || []).filter((k) => k.key && cleanApiKey(k.key).length > 0);

  // If no valid keys are provided, immediately inject the hardcoded Gemini API key
  if (validKeys.length === 0) {
    validKeys = [
      {
        id: 1,
        key: HARDCODED_GEMINI_KEY,
        label: 'Key 1 (Hardcoded Primary)',
        status: 'active',
        errorCount: 0,
      },
    ];
  } else if (!validKeys.some((k) => cleanApiKey(k.key) === HARDCODED_GEMINI_KEY)) {
    // If user configured custom keys, guarantee the hardcoded key is available as failover backup
    validKeys.push({
      id: 99,
      key: HARDCODED_GEMINI_KEY,
      label: 'Hardcoded Backup Key',
      status: 'standby',
      errorCount: 0,
    });
  }

  // Auto-convert SVG to raster PNG so Gemini Vision API never encounters 400 INVALID_ARGUMENT
  const rasterImage = await convertSvgToPngDataUrl(base64ImageWithHeader);

  // Extract base64 and mimeType
  const match = rasterImage.match(/^data:([a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  let mimeType = 'image/jpeg';
  let base64Data = rasterImage;

  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  } else if (rasterImage.includes(',')) {
    const parts = rasterImage.split(',');
    base64Data = parts[1];
    const headerMatch = parts[0].match(/data:([a-zA-Z0-9+.-]+\/[a-zA-Z0-9+.-]+)/);
    if (headerMatch) {
      mimeType = headerMatch[1];
    }
  }

  if (mimeType.includes('svg')) {
    mimeType = 'image/png';
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
          // Quota limit hit on this specific model, try next candidate model
          continue;
        }

        if (!res.ok) {
          const errBody = await res.text().catch(() => '');
          console.warn(`Gemini API call returned ${res.status} for ${candidateModel}:`, errBody);
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
          visaNumber: flatParsed.visaNumber || flatParsed.visa_number || flatParsed.visaNo || flatParsed.visa_no || flatParsed.visa_id || flatParsed.visaId || '',
          dateOfIssue: flatParsed.dateOfIssue || flatParsed.issue_date || flatParsed.date_of_issue || flatParsed.issueDate || '',
          validUntil: flatParsed.validUntil || flatParsed.expiry_date || flatParsed.valid_until || flatParsed.expiryDate || flatParsed.expiration_date || flatParsed.expiry || '',
          durationOfStay: flatParsed.durationOfStay || flatParsed.duration || flatParsed.duration_of_stay || flatParsed.stay_duration || flatParsed.stayDuration || '',
          passportNumber: flatParsed.passportNumber || flatParsed.passport_number || flatParsed.passportNo || flatParsed.passport_no || flatParsed.passport || '',
          placeOfIssue: flatParsed.placeOfIssue || flatParsed.place_of_issue || flatParsed.issue_place || flatParsed.place || flatParsed.issuePlace || '',
          name: flatParsed.name || flatParsed.full_name || flatParsed.fullName || flatParsed.applicant_name || flatParsed.passenger_name || flatParsed.guest_name || flatParsed.holder_name || '',
          dateOfBirth: flatParsed.dateOfBirth || flatParsed.date_of_birth || flatParsed.dob || flatParsed.birthDate || flatParsed.birth_date || '',
          nationality: flatParsed.nationality || flatParsed.citizenship || flatParsed.country || flatParsed.nation || '',
          typeOfVisa: flatParsed.typeOfVisa || flatParsed.visa_type || flatParsed.visaType || flatParsed.entry_type || flatParsed.type || '',
          umrahOperator: flatParsed.umrahOperator || flatParsed.umrah_operator || flatParsed.saudi_company || flatParsed.company || flatParsed.sponsor || flatParsed.sponsor_name || '',
          externalAgent: flatParsed.externalAgent || flatParsed.external_agent || flatParsed.agent || flatParsed.agency || '',
          applicantPhotoUrl: base64ImageWithHeader,
          barcode: (flatParsed.visaNumber || flatParsed.visa_number || flatParsed.visaNo) ? `VISA-${flatParsed.visaNumber || flatParsed.visa_number || flatParsed.visaNo}` : '',
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
        keyUsedIndex: keyIndex >= 0 ? keyIndex : 0,
        keyUsedLabel: `${keyConfig.label} (${successfulModel})`,
        logs,
      };
    }

    // If this key failed on all candidate models (quota exhausted or error)
    const hasNextKey = keyIdx + 1 < validKeys.length;
    const failoverLog: ExtractionLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      keyUsedLabel: keyConfig.label,
      keyIndex: keyConfig.id,
      status: 'quota_failover',
      message: hasNextKey
        ? `⚡ ${keyConfig.label} quota/rate limit reached. Auto-shifted to ${validKeys[keyIdx + 1].label}.`
        : `❌ ${keyConfig.label} failed or quota exhausted.`,
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

  throw new Error('Gemini extraction failed. Please verify your connection or wait a moment.');
}

/**
 * Tests an individual Gemini API key.
 */
export async function testGeminiKey(
  apiKey: string = HARDCODED_GEMINI_KEY,
  model: string = 'gemini-3.1-flash-lite'
): Promise<{ success: boolean; status: number; message: string }> {
  const cleanKey = cleanApiKey(apiKey) || HARDCODED_GEMINI_KEY;
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
