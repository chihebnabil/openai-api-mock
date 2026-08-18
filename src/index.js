import nock from 'nock';
import { faker } from '@faker-js/faker';
import { getChatResponce } from './chat.js';
import { createChatStream } from './chat.stream.js';
import { getImageResponce } from './image.js';
import {
  getEmbeddingResponse,
  getFixedEmbeddingResponse,
  validateEmbeddingRequest,
} from './embeddings.js';
import { createResponseTemplate, RESPONSE_TEMPLATES } from './utils/responseTemplates.js';

const OPEN_AI_BASE_URL = 'https://api.openai.com';
const CHAT_COMPLETIONS_ENDPOINT = '/v1/chat/completions';
const IMAGE_GENERATIONS_ENDPOINT = '/v1/images/generations';
const EMBEDDINGS_ENDPOINT = '/v1/embeddings';
// For custom base URLs, paths don't include /v1 prefix
const CHAT_COMPLETIONS_ENDPOINT_NO_PREFIX = '/chat/completions';
const IMAGE_GENERATIONS_ENDPOINT_NO_PREFIX = '/images/generations';
const EMBEDDINGS_ENDPOINT_NO_PREFIX = '/embeddings';
const customScopes = []; // Track custom scopes
/**
 * Mock OpenAI API responses
 * @param {boolean} force - Force mocking regardless of environment
 * @param {Object} options - Additional configuration options
 * @param {boolean} options.includeErrors - Whether to include error scenarios in mocking
 * @param {number} options.latency - Artificial latency in ms to simulate network delay
 * @param {boolean} options.logRequests - Whether to log incoming requests
 * @param {number|string} options.seed - Seed value for consistent/deterministic responses
 * @param {boolean} options.useFixedResponses - Whether to use predefined fixed response templates
 * @param {string} options.baseUrl - Base URL for the OpenAI API or OpenAI-compatible service
 * @returns {Object} An object with control methods for the mocks
 */
export function mockOpenAIResponse(force = false, options = {}) {
  const {
    includeErrors = false,
    latency = 0,
    logRequests = false,
    seed = null,
    useFixedResponses = false,
    baseUrl = OPEN_AI_BASE_URL,
  } = options;

  // Set seed for consistent outputs if provided
  if (seed !== null) {
    faker.seed(seed);
    if (logRequests) {
      console.log(`[openai-api-mock] Using seed for consistent outputs: ${seed}`);
    }
  }

  const env = process.env.NODE_ENV || 'development';

  // Only proceed if in development or forced
  if (env !== 'development' && !force) {
    return { isActive: false, stopMocking };
  }

  // Log the base URL being used for mocking
  if (logRequests) {
    console.log(`[openai-api-mock] Mocking requests to: ${baseUrl}`);
  }

  // Determine correct endpoints based on base URL
  const isDefaultBaseUrl = baseUrl === OPEN_AI_BASE_URL;
  const chatEndpoint = isDefaultBaseUrl
    ? CHAT_COMPLETIONS_ENDPOINT
    : CHAT_COMPLETIONS_ENDPOINT_NO_PREFIX;
  const imageEndpoint = isDefaultBaseUrl
    ? IMAGE_GENERATIONS_ENDPOINT
    : IMAGE_GENERATIONS_ENDPOINT_NO_PREFIX;
  const embeddingsEndpoint = isDefaultBaseUrl ? EMBEDDINGS_ENDPOINT : EMBEDDINGS_ENDPOINT_NO_PREFIX;

  // Mock chat completions endpoint
  nock(baseUrl)
    .post(chatEndpoint)
    .delay(latency) // Add delay to the interceptor
    .reply(function (uri, requestBody) {
      if (logRequests) {
        console.log(`[openai-api-mock] Chat request:`, JSON.stringify(requestBody, null, 2));
      }

      try {
        // Validate minimal required fields
        if (!requestBody.model || !requestBody.messages || !Array.isArray(requestBody.messages)) {
          return [400, { error: { message: 'Invalid request. Missing required fields.' } }];
        }

        // Simulate random errors if enabled
        if (includeErrors && Math.random() < 0.05) {
          return [429, { error: { message: 'Rate limit exceeded' } }];
        }

        const isSteaming = requestBody.stream === true;

        if (isSteaming) {
          const stream = createChatStream(requestBody);
          return [200, stream];
        }

        // Use fixed responses if enabled
        if (useFixedResponses) {
          if (requestBody.tools) {
            return [200, createResponseTemplate('TOOL_CALL')];
          } else if (requestBody.functions) {
            return [200, createResponseTemplate('FUNCTION_CALL')];
          } else {
            return [200, createResponseTemplate('SIMPLE_CHAT')];
          }
        }

        return [200, getChatResponce(requestBody)];
      } catch (error) {
        console.error('[openai-api-mock] Error processing chat request:', error);
        return [500, { error: { message: 'Internal server error in mock' } }];
      }
    })
    .persist(); // Allow multiple requests

  // Mock image generations endpoint
  nock(baseUrl)
    .post(imageEndpoint)
    .delay(latency) // Add delay to the interceptor
    .reply(function (uri, requestBody) {
      if (logRequests) {
        console.log(`[openai-api-mock] Image request:`, JSON.stringify(requestBody, null, 2));
      }

      try {
        // Validate minimal required fields
        if (!requestBody.prompt) {
          return [400, { error: { message: 'Invalid request. Missing prompt.' } }];
        }

        // Simulate random errors if enabled
        if (includeErrors && Math.random() < 0.05) {
          return [
            400,
            { error: { message: 'Your request was rejected as a result of our safety system.' } },
          ];
        }

        // Use fixed responses if enabled
        if (useFixedResponses) {
          return [200, createResponseTemplate('IMAGE_GENERATION')];
        }

        return [200, getImageResponce(requestBody)];
      } catch (error) {
        console.error('[openai-api-mock] Error processing image request:', error);
        return [500, { error: { message: 'Internal server error in mock' } }];
      }
    })
    .persist(); // Allow multiple requests

  // Mock embeddings endpoint
  nock(baseUrl)
    .post(embeddingsEndpoint)
    .delay(latency) // Add delay to the interceptor
    .reply(function (uri, requestBody) {
      if (logRequests) {
        console.log(`[openai-api-mock] Embeddings request:`, JSON.stringify(requestBody, null, 2));
      }

      try {
        // Validate request against the OpenAI API contract
        const validationError = validateEmbeddingRequest(requestBody);
        if (validationError) {
          return validationError;
        }

        // Simulate random errors if enabled
        if (includeErrors && Math.random() < 0.05) {
          return [429, { error: { message: 'Rate limit exceeded' } }];
        }

        // Use fixed responses if enabled
        if (useFixedResponses) {
          return [200, getFixedEmbeddingResponse(requestBody, createResponseTemplate('EMBEDDING'))];
        }

        return [200, getEmbeddingResponse(requestBody)];
      } catch (error) {
        console.error('[openai-api-mock] Error processing embeddings request:', error);
        return [500, { error: { message: 'Internal server error in mock' } }];
      }
    })
    .persist(); // Allow multiple requests

  // Enable other network connections (block only the configured base URL)
  const baseUrlHost = new URL(baseUrl).hostname;
  nock.enableNetConnect(host => host !== baseUrlHost);

  return {
    isActive: true,
    stopMocking,

    /**
     * Resets the faker seed to ensure consistent outputs for subsequent requests
     * @param {number|string} newSeed - New seed value to use
     */
    setSeed(newSeed) {
      faker.seed(newSeed);
      if (logRequests) {
        console.log(`[openai-api-mock] Seed updated to: ${newSeed}`);
      }
    },

    /**
     * Resets faker to use random values (removes deterministic behavior)
     */
    resetSeed() {
      faker.seed();
      if (logRequests) {
        console.log(`[openai-api-mock] Seed reset - using random values`);
      }
    },

    /**
     * Get available response templates
     * @returns {Object} Available response templates
     */
    getResponseTemplates() {
      return RESPONSE_TEMPLATES;
    },

    /**
     * Create a custom response template
     * @param {string} templateType - Type of template to use
     * @param {Object} overrides - Values to override in the template
     * @returns {Object} Response template with overrides applied
     */
    createResponseTemplate,

    /**
     * Adds a custom endpoint mock
     * @param {string} method - HTTP method (e.g., 'GET', 'POST')
     * @param {string} path - Endpoint path (e.g., '/v1/custom')
     * @param {Function} handler - Function returning [statusCode, responseBody]
     */
    addCustomEndpoint(method, path, handler) {
      const methodLower = method.toLowerCase();
      const scope = nock(baseUrl)[methodLower](path).reply(handler).persist(); // Keep the mock active indefinitely
      customScopes.push(scope);
    },
  };
}

export function stopMocking() {
  nock.cleanAll();
  customScopes.length = 0; // Clear the custom scopes array
}
