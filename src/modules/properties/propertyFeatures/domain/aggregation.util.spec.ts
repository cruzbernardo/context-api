import { PropertyType } from '../../enums';
import {
  majorityVoteBoolean,
  majorityVoteEnum,
  calculateAverage,
  aggregateAiOutputs,
  AiOutputForAggregation,
} from './aggregation.util';

describe('Aggregation Utilities', () => {
  describe('majorityVoteBoolean', () => {
    it('should return true when majority is true', () => {
      expect(majorityVoteBoolean([true, true, false], true)).toBe(true);
      expect(majorityVoteBoolean([true, true, true], false)).toBe(true);
      expect(majorityVoteBoolean([true, true, false, false, true], false)).toBe(
        true,
      );
    });

    it('should return false when majority is false', () => {
      expect(majorityVoteBoolean([false, false, true], true)).toBe(false);
      expect(majorityVoteBoolean([false, false, false], true)).toBe(false);
      expect(majorityVoteBoolean([true, false, false, false, true], true)).toBe(
        false,
      );
    });

    it('should use tiebreaker when counts are equal', () => {
      expect(majorityVoteBoolean([true, false], true)).toBe(true);
      expect(majorityVoteBoolean([true, false], false)).toBe(false);
      expect(majorityVoteBoolean([true, true, false, false], true)).toBe(true);
      expect(majorityVoteBoolean([true, true, false, false], false)).toBe(
        false,
      );
    });

    it('should return tiebreaker for empty array', () => {
      expect(majorityVoteBoolean([], true)).toBe(true);
      expect(majorityVoteBoolean([], false)).toBe(false);
    });

    it('should handle single value arrays', () => {
      expect(majorityVoteBoolean([true], false)).toBe(true);
      expect(majorityVoteBoolean([false], true)).toBe(false);
    });
  });

  describe('majorityVoteEnum', () => {
    it('should return the most common value', () => {
      expect(
        majorityVoteEnum(
          [PropertyType.OFFICE, PropertyType.OFFICE, PropertyType.RETAIL],
          PropertyType.WAREHOUSE,
        ),
      ).toBe(PropertyType.OFFICE);
    });

    it('should use tiebreaker when counts are equal', () => {
      expect(
        majorityVoteEnum(
          [PropertyType.OFFICE, PropertyType.RETAIL],
          PropertyType.OFFICE,
        ),
      ).toBe(PropertyType.OFFICE);

      expect(
        majorityVoteEnum(
          [PropertyType.OFFICE, PropertyType.RETAIL],
          PropertyType.RETAIL,
        ),
      ).toBe(PropertyType.RETAIL);
    });

    it('should return tiebreaker for empty array', () => {
      expect(majorityVoteEnum([], PropertyType.WAREHOUSE)).toBe(
        PropertyType.WAREHOUSE,
      );
    });

    it('should handle single value arrays', () => {
      expect(majorityVoteEnum([PropertyType.RETAIL], PropertyType.OFFICE)).toBe(
        PropertyType.RETAIL,
      );
    });

    it('should handle three-way tie with tiebreaker in winners', () => {
      expect(
        majorityVoteEnum(
          [PropertyType.OFFICE, PropertyType.RETAIL, PropertyType.WAREHOUSE],
          PropertyType.RETAIL,
        ),
      ).toBe(PropertyType.RETAIL);
    });

    it('should handle three-way tie with tiebreaker not in winners', () => {
      const result = majorityVoteEnum(
        [PropertyType.OFFICE, PropertyType.RETAIL, PropertyType.WAREHOUSE],
        'other' as PropertyType,
      );
      expect([
        PropertyType.OFFICE,
        PropertyType.RETAIL,
        PropertyType.WAREHOUSE,
      ]).toContain(result);
    });

    it('should handle multiple occurrences with clear winner', () => {
      expect(
        majorityVoteEnum(
          [
            PropertyType.OFFICE,
            PropertyType.OFFICE,
            PropertyType.OFFICE,
            PropertyType.RETAIL,
            PropertyType.WAREHOUSE,
          ],
          PropertyType.RETAIL,
        ),
      ).toBe(PropertyType.OFFICE);
    });
  });

  describe('calculateAverage', () => {
    it('should calculate average correctly', () => {
      expect(calculateAverage([10, 20, 30])).toBe(20);
      expect(calculateAverage([100, 200])).toBe(150);
      expect(calculateAverage([50])).toBe(50);
    });

    it('should round to nearest integer', () => {
      expect(calculateAverage([10, 20])).toBe(15);
      expect(calculateAverage([10, 11])).toBe(11); // 10.5 rounds to 11
      expect(calculateAverage([1, 2, 3])).toBe(2);
    });

    it('should return 0 for empty array', () => {
      expect(calculateAverage([])).toBe(0);
    });

    it('should handle single value', () => {
      expect(calculateAverage([42])).toBe(42);
    });

    it('should handle large numbers', () => {
      expect(calculateAverage([1000, 2000, 3000])).toBe(2000);
    });

    it('should handle zero values', () => {
      expect(calculateAverage([0, 0, 0])).toBe(0);
      expect(calculateAverage([0, 100])).toBe(50);
    });
  });

  describe('aggregateAiOutputs', () => {
    const createOutput = (
      nearSubway: boolean,
      needsRenovation: boolean,
      estimatedCapacityPeople: number,
      recommendedUse: PropertyType,
    ): AiOutputForAggregation => ({
      nearSubway,
      needsRenovation,
      estimatedCapacityPeople,
      recommendedUse,
    });

    it('should aggregate multiple outputs correctly', () => {
      const outputs: AiOutputForAggregation[] = [
        createOutput(true, false, 50, PropertyType.OFFICE),
        createOutput(true, false, 60, PropertyType.OFFICE),
        createOutput(false, true, 70, PropertyType.RETAIL),
      ];

      const result = aggregateAiOutputs(outputs);

      expect(result.nearSubway).toBe(true); // 2 true, 1 false
      expect(result.needsRenovation).toBe(false); // 1 true, 2 false
      expect(result.estimatedCapacityPeople).toBe(60); // avg of 50,60,70
      expect(result.recommendedUse).toBe(PropertyType.OFFICE); // 2 office, 1 retail
    });

    it('should use latest value as tiebreaker', () => {
      const outputs: AiOutputForAggregation[] = [
        createOutput(true, false, 50, PropertyType.OFFICE),
        createOutput(false, true, 60, PropertyType.RETAIL),
      ];

      const result = aggregateAiOutputs(outputs);

      // Tiebreaker is the latest (second) output
      expect(result.nearSubway).toBe(false);
      expect(result.needsRenovation).toBe(true);
      expect(result.recommendedUse).toBe(PropertyType.RETAIL);
    });

    it('should return defaults for empty array', () => {
      const result = aggregateAiOutputs([]);

      expect(result.nearSubway).toBe(false);
      expect(result.needsRenovation).toBe(false);
      expect(result.estimatedCapacityPeople).toBe(0);
      expect(result.recommendedUse).toBe(PropertyType.OFFICE);
    });

    it('should handle single output', () => {
      const output = createOutput(true, true, 100, PropertyType.WAREHOUSE);
      const result = aggregateAiOutputs([output]);

      expect(result.nearSubway).toBe(true);
      expect(result.needsRenovation).toBe(true);
      expect(result.estimatedCapacityPeople).toBe(100);
      expect(result.recommendedUse).toBe(PropertyType.WAREHOUSE);
    });

    it('should handle all same values', () => {
      const outputs: AiOutputForAggregation[] = [
        createOutput(true, true, 50, PropertyType.RETAIL),
        createOutput(true, true, 50, PropertyType.RETAIL),
        createOutput(true, true, 50, PropertyType.RETAIL),
      ];

      const result = aggregateAiOutputs(outputs);

      expect(result.nearSubway).toBe(true);
      expect(result.needsRenovation).toBe(true);
      expect(result.estimatedCapacityPeople).toBe(50);
      expect(result.recommendedUse).toBe(PropertyType.RETAIL);
    });

    it('should handle all different values with odd count', () => {
      const outputs: AiOutputForAggregation[] = [
        createOutput(true, false, 10, PropertyType.OFFICE),
        createOutput(false, true, 20, PropertyType.RETAIL),
        createOutput(true, false, 30, PropertyType.WAREHOUSE),
      ];

      const result = aggregateAiOutputs(outputs);

      expect(result.nearSubway).toBe(true); // 2 true, 1 false
      expect(result.needsRenovation).toBe(false); // 1 true, 2 false
      expect(result.estimatedCapacityPeople).toBe(20); // avg 10,20,30
      // recommendedUse: 3-way tie, tiebreaker is WAREHOUSE (latest)
      expect(result.recommendedUse).toBe(PropertyType.WAREHOUSE);
    });

    it('should calculate correct average for varying capacities', () => {
      const outputs: AiOutputForAggregation[] = [
        createOutput(true, false, 10, PropertyType.OFFICE),
        createOutput(true, false, 20, PropertyType.OFFICE),
        createOutput(true, false, 30, PropertyType.OFFICE),
        createOutput(true, false, 40, PropertyType.OFFICE),
      ];

      const result = aggregateAiOutputs(outputs);

      expect(result.estimatedCapacityPeople).toBe(25); // (10+20+30+40)/4 = 25
    });

    it('should handle large number of outputs', () => {
      const outputs: AiOutputForAggregation[] = Array(100)
        .fill(null)
        .map((_, i) =>
          createOutput(
            i < 60, // 60 true, 40 false
            i >= 60, // 40 true, 60 false
            i + 1, // 1 to 100
            i < 50 ? PropertyType.OFFICE : PropertyType.RETAIL,
          ),
        );

      const result = aggregateAiOutputs(outputs);

      expect(result.nearSubway).toBe(true); // 60 > 40
      expect(result.needsRenovation).toBe(false); // 60 > 40
      expect(result.estimatedCapacityPeople).toBe(51); // avg of 1-100 is 50.5, rounds to 51
      expect(result.recommendedUse).toBe(PropertyType.RETAIL); // 50 vs 50, tiebreaker is RETAIL (latest)
    });
  });

  describe('Edge Cases', () => {
    it('should handle boolean arrays with all true', () => {
      expect(majorityVoteBoolean([true, true, true, true], false)).toBe(true);
    });

    it('should handle boolean arrays with all false', () => {
      expect(majorityVoteBoolean([false, false, false], true)).toBe(false);
    });

    it('should handle enum arrays with all same value', () => {
      expect(
        majorityVoteEnum(
          [
            PropertyType.WAREHOUSE,
            PropertyType.WAREHOUSE,
            PropertyType.WAREHOUSE,
          ],
          PropertyType.OFFICE,
        ),
      ).toBe(PropertyType.WAREHOUSE);
    });

    it('should handle average of negative numbers (edge case)', () => {
      // While capacity shouldn't be negative, the function should still work
      expect(calculateAverage([-10, 10])).toBe(0);
    });

    it('should handle very large average values', () => {
      expect(calculateAverage([1000000, 2000000, 3000000])).toBe(2000000);
    });
  });
});
