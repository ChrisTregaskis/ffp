import { describe, it, expect } from 'vitest';

import { sortBy } from '../../src/lib/sort.utils';

interface TestItem {
  id: number;
  name: string;
  priority: number;
  createdAt: Date;
  active: boolean;
  score: number | null;
}

describe('sortBy', () => {
  const baseDate = new Date('2025-01-01');
  const laterDate = new Date('2025-01-02');
  const latestDate = new Date('2025-01-03');

  const testItems: TestItem[] = [
    { id: 1, name: 'Charlie', priority: 3, createdAt: laterDate, active: true, score: 85 },
    { id: 2, name: 'Alice', priority: 1, createdAt: latestDate, active: false, score: 90 },
    { id: 3, name: 'Bob', priority: 1, createdAt: baseDate, active: true, score: null },
    { id: 4, name: 'Diana', priority: 2, createdAt: baseDate, active: false, score: 75 },
  ];

  describe('single field sorting', () => {
    it('sorts by number field ascending', () => {
      const sorted = sortBy(testItems, ['priority']);

      expect(sorted.map((i) => i.id)).toEqual([2, 3, 4, 1]);
    });

    it('sorts by string field ascending', () => {
      const sorted = sortBy(testItems, ['name']);

      expect(sorted.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana']);
    });

    it('sorts by Date field ascending', () => {
      const sorted = sortBy(testItems, ['createdAt']);

      expect(sorted.map((i) => i.id)).toEqual([3, 4, 1, 2]);
    });

    it('sorts by boolean field ascending (false before true)', () => {
      const sorted = sortBy(testItems, ['active']);

      expect(sorted.map((i) => i.id)).toEqual([2, 4, 1, 3]);
    });

    it('sorts descending when direction specified', () => {
      const sorted = sortBy(testItems, [{ field: 'priority', direction: 'desc' }]);

      expect(sorted.map((i) => i.id)).toEqual([1, 4, 2, 3]);
    });

    it('handles null values by pushing to end', () => {
      const sorted = sortBy(testItems, ['score']);

      // Non-null values sorted ascending, null at end
      expect(sorted.map((i) => i.score)).toEqual([75, 85, 90, null]);
    });
  });

  describe('two field sorting', () => {
    it('sorts by primary then secondary field', () => {
      const sorted = sortBy(testItems, ['priority', 'createdAt']);

      // Priority 1: id 3 (baseDate) then id 2 (latestDate)
      // Priority 2: id 4
      // Priority 3: id 1
      expect(sorted.map((i) => i.id)).toEqual([3, 2, 4, 1]);
    });

    it('supports mixed field name and criterion object', () => {
      const sorted = sortBy(testItems, ['priority', { field: 'createdAt', direction: 'desc' }]);

      // Priority 1: id 2 (latestDate) then id 3 (baseDate) - reversed because desc
      // Priority 2: id 4
      // Priority 3: id 1
      expect(sorted.map((i) => i.id)).toEqual([2, 3, 4, 1]);
    });

    it('supports both fields as criterion objects', () => {
      const sorted = sortBy(testItems, [
        { field: 'priority', direction: 'desc' },
        { field: 'name', direction: 'asc' },
      ]);

      // Priority 3 first (desc), then 2, then 1
      // Within priority 1: Alice, Bob (name asc)
      expect(sorted.map((i) => i.id)).toEqual([1, 4, 2, 3]);
    });
  });

  describe('immutability', () => {
    it('does not mutate the original array', () => {
      const original = [...testItems];
      const originalOrder = original.map((i) => i.id);

      sortBy(original, ['priority']);

      expect(original.map((i) => i.id)).toEqual(originalOrder);
    });

    it('returns a new array instance', () => {
      const sorted = sortBy(testItems, ['priority']);

      expect(sorted).not.toBe(testItems);
    });
  });

  describe('edge cases', () => {
    it('handles empty array', () => {
      const sorted = sortBy([] as TestItem[], ['priority']);

      expect(sorted).toEqual([]);
    });

    it('handles single item array', () => {
      const single = [testItems[0]];
      const sorted = sortBy(single, ['priority']);

      expect(sorted).toEqual(single);
      expect(sorted).not.toBe(single);
    });

    it('handles array with all same values for sort field', () => {
      const sameValues = [
        { id: 1, value: 5 },
        { id: 2, value: 5 },
        { id: 3, value: 5 },
      ];

      const sorted = sortBy(sameValues, ['value']);

      // Order preserved when all values equal (stable sort behaviour may vary)
      expect(sorted.length).toBe(3);
      expect(sorted.every((i) => i.value === 5)).toBe(true);
    });
  });

  describe('string comparison', () => {
    it('sorts strings case-insensitively', () => {
      const items = [
        { id: 1, name: 'banana' },
        { id: 2, name: 'Apple' },
        { id: 3, name: 'cherry' },
      ];

      const sorted = sortBy(items, ['name']);

      expect(sorted.map((i) => i.name)).toEqual(['Apple', 'banana', 'cherry']);
    });
  });
});
