export interface MockOptions {
  /**
   * When true, randomly simulates API errors
   */
  includeErrors?: boolean;
  /**
   * Adds artificial delay to responses in milliseconds
   */
  latency?: number;
  /**
   * Logs incoming requests to console for debugging
   */
  logRequests?: boolean;
  /**
   * Seed value for consistent/deterministic responses
   */
  seed?: number | string;
  /**
   * Whether to use predefined fixed response templates
   */
  useFixedResponses?: boolean;
  /**
   * Base URL for the OpenAI API or OpenAI-compatible service
   * @default 'https://api.openai.com'
   */
  baseUrl?: string;
}

export interface MockControl {
  /**
   * Indicates if mocking is currently active
   */
  isActive: boolean;
  /**
   * Stops all active mocks
   */
  stopMocking: () => void;
  /**
   * Resets the faker seed to ensure consistent outputs for subsequent requests
   */
  setSeed: (seed: number | string) => void;
  /**
   * Resets faker to use random values (removes deterministic behavior)
   */
  resetSeed: () => void;
  /**
   * Get available response templates
   */
  getResponseTemplates: () => Record<string, any>;
  /**
   * Create a custom response template
   */
  createResponseTemplate: (
    templateType: string,
    overrides?: Record<string, any>
  ) => Record<string, any>;
  /**
   * Adds a custom endpoint mock
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - Endpoint path (will be appended to the configured base URL)
   * @param handler - Function to handle the request and return response
   */
  addCustomEndpoint: (
    method: string,
    path: string,
    handler: (uri: string, body: any) => [number, any] | Promise<[number, any]>
  ) => void;
}

/**
 * Sets up mocking for OpenAI API responses
 * @param force - If true, forces mocking regardless of environment. If false, only mocks in development
 * @param options - Configuration options for the mock behavior
 * @returns Object with control methods for the mock
 */
export function mockOpenAIResponse(force?: boolean, options?: MockOptions): MockControl;
