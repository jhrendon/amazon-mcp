export interface CSVParserConfig {
  delimiter?: string;
  hasHeaders?: boolean;
  quoteChar?: string;
  trimValues?: boolean;
}

export function parseCSV<T = Record<string, string>>(
  csvData: string,
  config?: CSVParserConfig
): T[] {
  const {
    delimiter = '\t',
    hasHeaders = true,
    trimValues = true,
  } = config ?? {};

  const lines = csvData.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return [];
  }

  const headerLine = hasHeaders ? lines[0] : null;
  const dataLines = hasHeaders ? lines.slice(1) : lines;

  const headers = headerLine
    ? parseCSVLine(headerLine, delimiter).map((h) => normalizeHeader(h))
    : [];

  const results: T[] = [];

  for (const line of dataLines) {
    const values = parseCSVLine(line, delimiter);

    if (values.length === 0) {
      continue;
    }

    const row: Record<string, string> = {};

    if (hasHeaders && headers.length > 0) {
      headers.forEach((header, index) => {
        let value = values[index] ?? '';
        if (trimValues) {
          value = value.trim();
        }
        row[header] = value;
      });
    } else {
      values.forEach((value, index) => {
        row[`col_${index}`] = trimValues ? value.trim() : value;
      });
    }

    results.push(row as T);
  }

  return results;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }

  values.push(current);
  return values;
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function parseCSVRow<T>(
  row: Record<string, string>,
  schema: Record<keyof T, 'string' | 'number' | 'boolean' | 'date'>
): T {
  const result: Record<string, unknown> = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = row[key];

    if (value === undefined || value === '') {
      result[key] = null;
      continue;
    }

    switch (type) {
      case 'number':
        result[key] = parseFloat(value) || 0;
        break;
      case 'boolean':
        result[key] =
          value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
        break;
      case 'date':
        result[key] = new Date(value);
        break;
      default:
        result[key] = value;
    }
  }

  return result as T;
}
