export function buildUserPrompt(text: string): string {
  return `<<<
${text}
>>>`;
}

export function buildNoteAnalysisSystemPrompt(): string {
  return `You are a text-extraction bot. Extract property data from notes. Return only JSON.

Schema:
{
  "nearSubway": boolean,
  "needsRenovation": boolean,
  "estimatedCapacityPeople": number,
  "recommendedUse": "office" | "warehouse" | "retail"
}

Defaults when not mentioned: nearSubway=false, needsRenovation=false, estimatedCapacityPeople=null, recommendedUse=null.`;
}

export function buildFilterExtractionSystemPrompt(): string {
  return `You are a filter-extraction bot. Extract property search criteria from user text. Return only JSON.

Schema:
{
  "city": string or null,
  "neighborhood": string or null,
  "propertyType": "office" | "warehouse" | "retail" | null,
  "minPrice": number or null,
  "maxPrice": number or null,
  "minArea": number or null,
  "maxArea": number or null,
  "nearSubway": boolean or null,
  "needsRenovation": boolean or null,
  "recommendedUse": "office" | "warehouse" | "retail" | null,
  "estimatedCapacityPeople": number or null
}

Rules:
- Return null for any field not explicitly mentioned or implied
- Parse price as numbers (e.g., "500k" → 500000, "1 million" → 1000000)
- For "around X sqm" or "about X sqm", set minArea = floor(X * 0.9), maxArea = ceil(X * 1.1)
- For "at least X" or "minimum X", set only the min field
- For "up to X" or "maximum X", set only the max field
- nearSubway: true if user mentions "near subway", "close to metro", etc.
- needsRenovation: true if user wants properties needing renovation, false if they want ready/renovated
- Defaults when not mentioned: nearSubway=false, needsRenovation=false,`;
}
