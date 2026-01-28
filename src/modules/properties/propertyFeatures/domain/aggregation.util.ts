import { PropertyType } from '../../enums';

export interface AiOutputForAggregation {
  nearSubway: boolean;
  needsRenovation: boolean;
  estimatedCapacityPeople: number;
  recommendedUse: PropertyType;
}

export interface AggregatedFeature {
  nearSubway: boolean;
  needsRenovation: boolean;
  estimatedCapacityPeople: number;
  recommendedUse: PropertyType;
}

/**
 * Majority vote for boolean values.
 * When tied, uses the tiebreaker value (latest note's value).
 */
export function majorityVoteBoolean(
  values: boolean[],
  tiebreaker: boolean,
): boolean {
  if (values.length === 0) return tiebreaker;

  const trueCount = values.filter((v) => v === true).length;
  const falseCount = values.length - trueCount;

  if (trueCount > falseCount) return true;
  if (falseCount > trueCount) return false;

  return tiebreaker;
}

/**
 * Majority vote for enum values.
 * Counts occurrences and returns the most common.
 * When tied, uses the tiebreaker value (latest note's value).
 */
export function majorityVoteEnum<T extends string>(
  values: T[],
  tiebreaker: T,
): T {
  if (values.length === 0) return tiebreaker;

  const counts = new Map<T, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  let maxCount = 0;
  let winners: T[] = [];

  for (const [value, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      winners = [value];
    } else if (count === maxCount) {
      winners.push(value);
    }
  }

  if (winners.length === 1) {
    return winners[0];
  }

  if (winners.includes(tiebreaker)) {
    return tiebreaker;
  }

  return winners[0];
}

/**
 * Calculate average of numeric values.
 * Returns 0 if no values.
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;

  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
}

/**
 * Aggregates multiple AI outputs into a single PropertyFeature.
 * Uses majority voting for booleans and enums, average for numbers.
 * The outputs should be ordered by creation date (oldest first).
 */
export function aggregateAiOutputs(
  outputs: AiOutputForAggregation[],
): AggregatedFeature {
  if (outputs.length === 0) {
    return {
      nearSubway: false,
      needsRenovation: false,
      estimatedCapacityPeople: 0,
      recommendedUse: PropertyType.OFFICE,
    };
  }

  const latestOutput = outputs[outputs.length - 1];

  return {
    nearSubway: majorityVoteBoolean(
      outputs.map((o) => o.nearSubway),
      latestOutput.nearSubway,
    ),
    needsRenovation: majorityVoteBoolean(
      outputs.map((o) => o.needsRenovation),
      latestOutput.needsRenovation,
    ),
    estimatedCapacityPeople: calculateAverage(
      outputs.map((o) => o.estimatedCapacityPeople),
    ),
    recommendedUse: majorityVoteEnum(
      outputs.map((o) => o.recommendedUse),
      latestOutput.recommendedUse,
    ),
  };
}
