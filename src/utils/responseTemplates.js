/**
 * Predefined response templates for consistent testing
 */

export const RESPONSE_TEMPLATES = {
  SIMPLE_CHAT: {
    choices: [
      {
        finish_reason: 'stop',
        index: 0,
        message: {
          content: 'This is a consistent test response.',
          role: 'assistant',
        },
        logprobs: null,
      },
    ],
    created: 1640995200,
    id: 'chatcmpl-test123456789',
    model: 'gpt-3.5-mock',
    object: 'chat.completion',
    usage: {
      completion_tokens: 10,
      prompt_tokens: 20,
      total_tokens: 30,
    },
  },

  FUNCTION_CALL: {
    id: 'chatcmpl-test123456789',
    object: 'chat.completion',
    created: 1640995200,
    model: 'gpt-3.5-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          function_call: {
            name: 'test_function',
            arguments: '{"param1": "test_value", "param2": 42}',
          },
        },
        finish_reason: 'function_call',
      },
    ],
    usage: {
      prompt_tokens: 81,
      completion_tokens: 19,
      total_tokens: 100,
    },
  },

  TOOL_CALL: {
    id: 'chatcmpl-test123456789',
    object: 'chat.completion',
    created: 1640995200,
    model: 'gpt-3.5-mock',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [
            {
              id: 'call_test123456789',
              type: 'function',
              function: {
                name: 'test_function',
                arguments: '{"param1": "test_value", "param2": 42}',
              },
            },
          ],
        },
        finish_reason: 'tool_calls',
      },
    ],
    usage: {
      prompt_tokens: 81,
      completion_tokens: 19,
      total_tokens: 100,
    },
  },

  IMAGE_GENERATION: {
    created: 1640995200,
    data: [
      {
        url: 'https://example.com/test-image.png',
      },
    ],
  },
};

/**
 * Create a response template with custom values
 * @param {string} templateType - Type of template to use
 * @param {Object} overrides - Values to override in the template
 * @returns {Object} Response template with overrides applied
 */
export function createResponseTemplate(templateType, overrides = {}) {
  const template = RESPONSE_TEMPLATES[templateType];
  if (!template) {
    throw new Error(`Unknown template type: ${templateType}`);
  }

  return deepMerge(template, overrides);
}

/**
 * Deep merge utility function
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}
