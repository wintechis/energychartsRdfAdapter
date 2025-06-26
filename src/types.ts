/**
 * Common type definitions for energy charts API
 */

/**
 * Base parameters for price requests
 */
export interface PriceRequestParams {
  bzn?: string; // Bidding zone, default "DE-LU"
  start?: string; // Start date
  end?: string; // End date
}

/**
 * Price data point
 */
export interface PricePoint {
  unix_seconds: number;
  price: number;
}

/**
 * Response from the /price endpoint
 */
export interface PriceResponse {
  license_info: string;
  unix_seconds: number[];
  price: number[];
  unit: string;
  deprecated: boolean;
}
