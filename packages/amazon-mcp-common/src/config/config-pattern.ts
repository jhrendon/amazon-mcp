import type { z } from 'zod';

export type ConfigSchema<T> = z.ZodSchema<T>;

export function createConfigLoader<T>(schema: ConfigSchema<T>): () => T {
  let cachedConfig: T | null = null;

  return (): T => {
    if (cachedConfig) {
      return cachedConfig;
    }

    const result = schema.safeParse(process.env);

    if (!result.success) {
      const errors = result.error.errors.map(
        (e) => `  - ${e.path.join('.')}: ${e.message}`
      );
      throw new Error(
        `Configuration validation failed:\n${errors.join('\n')}\n\n` +
          'Please ensure all required environment variables are set.\n' +
          'See .env.example for reference.'
      );
    }

    cachedConfig = result.data;
    return cachedConfig;
  };
}
