import { API_CONFIG } from "./config.ts";
import type { PriceRequestParams, PriceResponse } from "./types.ts";

export class EnergyChartsClient {
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;

  constructor(
    baseUrl = API_CONFIG.BASE_URL,
    maxRetries = 3,
    timeout = 10000,
  ) {
    this.baseUrl = baseUrl;
    this.maxRetries = maxRetries;
    this.timeout = timeout;
  }

  /**
   * Generic method to fetch data from any API endpoint with retry logic
   * @param endpoint API endpoint path
   * @param params Request parameters
   * @returns Promise with API response
   */
  async fetchFromEndpoint<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`Fetching data from ${url} (Attempt ${attempt})`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! Status: ${response.status}, Message: ${errorText}`,
          );
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry if we've reached max attempts or if it's an abort error
        if (
          attempt >= this.maxRetries ||
          lastError.name === "AbortError"
        ) {
          throw lastError;
        }

        // Exponential backoff
        const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
        console.warn(
          `Attempt ${attempt} failed, retrying in ${delay}ms: ${lastError.message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This shouldn't be reached due to the throw in the loop, but TypeScript needs it
    throw lastError || new Error("Unknown error occurred");
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params: Record<string, unknown>): URL {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === "boolean") {
          // Handle boolean values correctly
          url.searchParams.append(key, value.toString().toLowerCase());
        } else if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(","));
        } else {
          url.searchParams.append(key, value?.toString() || "");
        }
      }
    });

    return url;
  }

  /**
   * Get energy prices for a specific bidding zone
   */
  async getPrices(params: PriceRequestParams = {}): Promise<PriceResponse> {
    return await this.fetchFromEndpoint<PriceResponse>(`price`, {
      bzn: params.bzn || "DE-LU",
      start: params.start,
      end: params.end,
    });
  }
}

// Export singleton instance
export const energychartsClient: EnergyChartsClient = new EnergyChartsClient();
