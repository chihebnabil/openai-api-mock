import { deterministicVector, encodeBase64Float32 } from './utils/vectorUtils.js';
export const EMBEDDING_MODELS = {
  'text-embedding-ada-002': { dimensions: 1536, supportsDimensions: false },
  'text-embedding-3-small': { dimensions: 1536, supportsDimensions: true },
  'text-embedding-3-large': { dimensions: 3072, supportsDimensions: true },
};

const NON_EMBEDDING_MODEL_PATTERN = /^(gpt-|dall-e-|whisper|tts-|o1|text-moderation)/;

const MAX_INPUT_ARRAY_LENGTH = 2048;

function errorBody(message, code = null, param = null) {
  return { error: { message, type: 'invalid_request_error', param, code } };
}

/**
 * Estimate token count for an input
 * @param {string|number[]} input - String or token array
 * @returns {number} Estimated token count
 */
function estimateTokens(input) {
  if (typeof input === 'string') {
    return Math.max(1, Math.ceil(input.length / 4));
  }
  if (Array.isArray(input)) {
    return input.length;
  }
  return 1;
}

/**
 * Normalize the request input into a list of items
 * @param {*} input - Request input (string, token array, array of strings, or array of token arrays)
 * @returns {Array<{key: string, tokens: number}>} List of input items
 */
function toInputItems(input) {
  if (typeof input === 'string') {
    return [{ key: input, tokens: estimateTokens(input) }];
  }

  if (Array.isArray(input)) {
    if (input.length === 0 || typeof input[0] === 'number') {
      return [{ key: JSON.stringify(input), tokens: input.length }];
    }

    return input.map(item => {
      if (Array.isArray(item)) {
        return { key: JSON.stringify(item), tokens: item.length };
      }
      return { key: item, tokens: estimateTokens(item) };
    });
  }

  return [{ key: JSON.stringify(input), tokens: estimateTokens(input) }];
}

/**
 * Validate an embeddings request body against the OpenAI API contract
 * @param {Object} requestBody - Request body to validate
 * @returns {null|[number, Object]} Null when valid, otherwise [statusCode, errorBody]
 */
export function validateEmbeddingRequest(requestBody) {
  if (!requestBody.model || typeof requestBody.model !== 'string') {
    return [400, errorBody('you must provide a model parameter')];
  }

  const isKnownEmbeddingModel = Boolean(EMBEDDING_MODELS[requestBody.model]);
  const isKnownNonEmbeddingModel = NON_EMBEDDING_MODEL_PATTERN.test(requestBody.model);

  if (!isKnownEmbeddingModel && isKnownNonEmbeddingModel) {
    return [
      404,
      {
        error: {
          message: `The model '${requestBody.model}' does not exist or you do not have access to it.`,
          type: 'invalid_request_error',
          param: null,
          code: 'model_not_found',
        },
      },
    ];
  }

  const modelInfo = EMBEDDING_MODELS[requestBody.model] || {
    dimensions: 1536,
    supportsDimensions: true,
  };

  if (requestBody.input === undefined || requestBody.input === null) {
    return [
      400,
      errorBody("Missing required parameter: 'input'.", 'missing_required_parameter', 'input'),
    ];
  }

  const { input } = requestBody;

  if (typeof input === 'string' && input.length === 0) {
    return [400, errorBody("'$.input' is invalid. please use a non-empty string", null, 'input')];
  }

  if (Array.isArray(input) && input.length > MAX_INPUT_ARRAY_LENGTH) {
    return [
      400,
      errorBody(
        `Invalid 'input': array too long. Expected an array with maximum length ${MAX_INPUT_ARRAY_LENGTH}, but got an array with length ${input.length} instead.`,
        null,
        'input',
      ),
    ];
  }

  if (Array.isArray(input)) {
    if (input.length === 0) {
      return [
        400,
        errorBody(
          "Invalid 'input': empty array. Expected an array with minimum length 1, but got an empty array instead.",
          null,
          'input',
        ),
      ];
    }

    const isTokenArray = typeof input[0] === 'number';
    if (isTokenArray && input.some(item => typeof item !== 'number')) {
      return [
        400,
        errorBody("Invalid 'input': all items must be integers for token arrays.", null, 'input'),
      ];
    }

    if (!isTokenArray) {
      const isArrayOfTokenArrays = Array.isArray(input[0]);
      for (const item of input) {
        if (isArrayOfTokenArrays) {
          if (!Array.isArray(item) || item.some(token => typeof token !== 'number')) {
            return [
              400,
              errorBody("Invalid 'input': all items must be arrays of integers.", null, 'input'),
            ];
          }
        } else if (typeof item !== 'string') {
          return [400, errorBody("Invalid 'input': all items must be strings.", null, 'input')];
        } else if (item.length === 0) {
          return [
            400,
            errorBody("'$.input' is invalid. please use a non-empty string", null, 'input'),
          ];
        }
      }
    }
  }

  if (requestBody.dimensions !== undefined) {
    const dimensions = requestBody.dimensions;
    if (!modelInfo.supportsDimensions) {
      return [400, errorBody('Dimensions is not supported by this model.')];
    }
    if (
      typeof dimensions !== 'number' ||
      !Number.isInteger(dimensions) ||
      dimensions < 1 ||
      dimensions > modelInfo.dimensions
    ) {
      return [
        400,
        errorBody(
          `Invalid value for 'dimensions': must be an integer between 1 and ${modelInfo.dimensions} for this model.`,
          null,
          'dimensions',
        ),
      ];
    }
  }

  if (
    requestBody.encoding_format !== undefined &&
    requestBody.encoding_format !== 'float' &&
    requestBody.encoding_format !== 'base64'
  ) {
    return [
      400,
      errorBody(
        "Invalid value for 'encoding_format': must be either 'float' or 'base64'.",
        null,
        'encoding_format',
      ),
    ];
  }

  return null;
}

/**
 * Adapt a fixed EMBEDDING template to the request's encoding_format
 * @param {Object} requestBody - Validated request body
 * @param {Object} template - EMBEDDING response template
 * @returns {Object} Template with base64-encoded embedding when requested
 */
export function getFixedEmbeddingResponse(requestBody, template) {
  if (requestBody.encoding_format !== 'base64') {
    return template;
  }

  return {
    ...template,
    data: template.data.map(item => ({
      ...item,
      embedding: encodeBase64Float32(item.embedding),
    })),
  };
}

/**
 * Generate an embeddings response matching the OpenAI API contract
 * @param {Object} requestBody - Validated request body
 * @returns {Object} CreateEmbeddingResponse-shaped object
 */
export function getEmbeddingResponse(requestBody) {
  const modelInfo = EMBEDDING_MODELS[requestBody.model] || {
    dimensions: 1536,
    supportsDimensions: true,
  };
  const dimensions =
    requestBody.dimensions !== undefined && modelInfo.supportsDimensions
      ? requestBody.dimensions
      : modelInfo.dimensions;
  const encodingFormat = requestBody.encoding_format || 'float';

  const items = toInputItems(requestBody.input);

  const data = items.map((item, index) => {
    const vector = deterministicVector(
      `${requestBody.model}::${dimensions}::${item.key}`,
      dimensions,
    );
    return {
      object: 'embedding',
      index,
      embedding: encodingFormat === 'base64' ? encodeBase64Float32(vector) : vector,
    };
  });

  const totalTokens = items.reduce((sum, item) => sum + item.tokens, 0);

  return {
    object: 'list',
    data,
    model: requestBody.model,
    usage: {
      prompt_tokens: totalTokens,
      total_tokens: totalTokens,
    },
  };
}
