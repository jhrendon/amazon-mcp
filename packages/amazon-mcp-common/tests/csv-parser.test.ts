import { describe, it, expect } from 'vitest';
import { parseCSV, parseCSVRow } from '../src/utils/csv-parser.js';

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse tab-delimited CSV with headers', () => {
      const csv = 'name\tage\tcity\nAlice\t30\tNYC\nBob\t25\tLA';
      const result = parseCSV<{ name: string; age: string; city: string }>(csv);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'Alice', age: '30', city: 'NYC' });
      expect(result[1]).toEqual({ name: 'Bob', age: '25', city: 'LA' });
    });

    it('should parse comma-delimited CSV', () => {
      const csv = 'name,age,city\nAlice,30,NYC\nBob,25,LA';
      const result = parseCSV<{ name: string; age: string; city: string }>(csv, { delimiter: ',' });
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
    });

    it('should handle quoted values', () => {
      const csv = 'name,description\nAlice,"Has a comma, in description"\nBob,Simple';
      const result = parseCSV<{ name: string; description: string }>(csv, { delimiter: ',' });
      
      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Has a comma, in description');
    });

    it('should handle escaped quotes', () => {
      const csv = 'name,description\nAlice,"She said ""hello"""\nBob,Simple';
      const result = parseCSV<{ name: string; description: string }>(csv, { delimiter: ',' });
      
      expect(result[0].description).toBe('She said "hello"');
    });

    it('should normalize headers to snake_case', () => {
      const csv = 'First Name\tLast Name\tEmail Address\nAlice\tSmith\talice@example.com';
      const result = parseCSV(csv);
      
      expect(result[0]).toHaveProperty('first_name');
      expect(result[0]).toHaveProperty('last_name');
      expect(result[0]).toHaveProperty('email_address');
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('');
      expect(result).toHaveLength(0);
    });

    it('should handle CSV with only headers', () => {
      const csv = 'name\tage\tcity';
      const result = parseCSV(csv);
      expect(result).toHaveLength(0);
    });

    it('should handle CSV without headers', () => {
      const csv = 'Alice\t30\tNYC\nBob\t25\tLA';
      const result = parseCSV<{ col_0: string; col_1: string; col_2: string }>(csv, { hasHeaders: false });
      
      expect(result).toHaveLength(2);
      expect(result[0].col_0).toBe('Alice');
      expect(result[0].col_1).toBe('30');
    });

    it('should trim values by default', () => {
      const csv = 'name\tage\n  Alice  \t  30  ';
      const result = parseCSV<{ name: string; age: string }>(csv);
      
      expect(result[0].name).toBe('Alice');
      expect(result[0].age).toBe('30');
    });

    it('should not trim values when trimValues is false', () => {
      const csv = 'name\tage\n  Alice  \t  30  ';
      const result = parseCSV<{ name: string; age: string }>(csv, { trimValues: false });
      
      expect(result[0].name).toBe('  Alice  ');
      expect(result[0].age).toBe('  30  ');
    });
  });

  describe('parseCSVRow', () => {
    it('should convert string values to numbers', () => {
      const row = { name: 'Alice', age: '30', price: '19.99' };
      const result = parseCSVRow<{ name: string; age: number; price: number }>(row, {
        name: 'string',
        age: 'number',
        price: 'number',
      });
      
      expect(result.age).toBe(30);
      expect(result.price).toBe(19.99);
    });

    it('should convert string values to booleans', () => {
      const row = { active: 'true', verified: 'false', premium: '1' };
      const result = parseCSVRow<{ active: boolean; verified: boolean; premium: boolean }>(row, {
        active: 'boolean',
        verified: 'boolean',
        premium: 'boolean',
      });
      
      expect(result.active).toBe(true);
      expect(result.verified).toBe(false);
      expect(result.premium).toBe(true);
    });

    it('should convert string values to dates', () => {
      const row = { created: '2024-01-15T10:30:00Z' };
      const result = parseCSVRow<{ created: Date }>(row, {
        created: 'date',
      });
      
      expect(result.created).toBeInstanceOf(Date);
      expect(result.created.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should handle empty values as null', () => {
      const row = { name: 'Alice', age: '' };
      const result = parseCSVRow<{ name: string; age: number | null }>(row, {
        name: 'string',
        age: 'number',
      });
      
      expect(result.age).toBeNull();
    });

    it('should handle missing values as null', () => {
      const row = { name: 'Alice' };
      const result = parseCSVRow<{ name: string; age: number | null }>(row, {
        name: 'string',
        age: 'number',
      });
      
      expect(result.age).toBeNull();
    });
  });
});
