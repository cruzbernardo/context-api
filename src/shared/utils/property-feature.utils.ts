import { PropertyType } from 'src/modules/properties/enums';
import { LlmAnalysisResult } from 'src/modules/llm/interfaces';

export function parsePropertyType(value: unknown): PropertyType | undefined {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase();
  const validTypes = Object.values(PropertyType);
  return validTypes.includes(normalized as PropertyType)
    ? (normalized as PropertyType)
    : undefined;
}

export function parsePropertyFeatureResponse(
  content: string,
): LlmAnalysisResult {
  const parsed = JSON.parse(content);
  return {
    nearSubway:
      parsed.nearSubway === null ? undefined : Boolean(parsed.nearSubway),
    needsRenovation:
      parsed.needsRenovation === null
        ? undefined
        : Boolean(parsed.needsRenovation),
    estimatedCapacityPeople: Number(parsed.estimatedCapacityPeople) || 0,
    recommendedUse: parsePropertyType(parsed.recommendedUse),
  };
}
