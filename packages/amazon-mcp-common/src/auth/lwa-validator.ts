import axios from 'axios';

export interface LWAValidatorConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  tokenEndpoint?: string;
}

export interface LWAValidationResult {
  valid: boolean;
  error?: string;
}

export class LWAValidator {
  private readonly tokenEndpoint: string;

  constructor(private readonly config: LWAValidatorConfig) {
    this.tokenEndpoint = config.tokenEndpoint ?? 'https://api.amazon.com/auth/o2/token';
  }

  async validateCredentials(): Promise<LWAValidationResult> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.config.refreshToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    try {
      await axios.post(this.tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return { valid: true };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as
          | { error?: string; error_description?: string }
          | undefined;

        if (data?.error_description) {
          const code = data.error ? ` (${data.error})` : '';
          return { valid: false, error: `${data.error_description}${code}` };
        }

        if (data?.error) {
          return { valid: false, error: data.error };
        }

        if (error.response?.status) {
          return { valid: false, error: `HTTP ${error.response.status}: ${error.message}` };
        }

        return { valid: false, error: error.message };
      }

      if (error instanceof Error) {
        return { valid: false, error: error.message };
      }

      return { valid: false, error: String(error) };
    }
  }
}
