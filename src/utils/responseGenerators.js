import { faker } from '@faker-js/faker';
import { generateFunctionCallArguments, generateToolCallArguments } from './fakeDataGenerators.js';

export function createDefaultResponse(created, requestBody = {}) {
  const model = requestBody.model ? `${requestBody.model}-mock` : 'gpt-3.5-mock';

  return {
    choices: [
      {
        finish_reason: 'stop',
        index: 0,
        message: {
          content: faker.lorem.words(5),
          role: 'assistant',
        },
        logprobs: null,
      },
    ],
    created: created,
    id: `chatcmpl-${faker.string.alphanumeric(30)}`,
    model: model,
    object: 'chat.completion',
    usage: {
      completion_tokens: 17,
      prompt_tokens: 57,
      total_tokens: 74,
    },
  };
}

export function createFunctionCallingResponse(requestBody, created) {
  const isTool = Boolean(requestBody.tools);
  const functionOrToolCallObject = isTool
    ? [createToolCallObject(requestBody)]
    : createFunctionCallObject(requestBody);
  const functionOrToolCall = isTool ? 'tool_calls' : 'function_call';
  const model = requestBody.model ? `${requestBody.model}-mock` : 'gpt-3.5-mock';

  return {
    id: `chatcmpl-${faker.string.alphanumeric(30)}`,
    object: 'chat.completion',
    created: created,
    model: model,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: null,
          [functionOrToolCall]: functionOrToolCallObject,
        },
        finish_reason: functionOrToolCall,
      },
    ],
    usage: {
      prompt_tokens: 81,
      completion_tokens: 19,
      total_tokens: 100,
    },
  };
}

export function createToolCallObject(requestBody) {
  return {
    id: `call-${faker.string.alphanumeric(30)}`,
    type: 'function',
    function: {
      name: `${requestBody.tools[0].function.name}`,
      arguments: `${generateToolCallArguments(requestBody)}`,
    },
  };
}

export function createFunctionCallObject(requestBody) {
  return {
    name: `${requestBody.functions[0].name}`,
    arguments: `${generateFunctionCallArguments(requestBody)}`,
  };
}

export function getSteamChatObject(requestBody = {}) {
  const created = Math.floor(Date.now() / 1000);
  const model = requestBody.model ? `${requestBody.model}-mock` : 'gpt-3.5-mock';

  let lorem = faker.lorem.paragraph();
  const loremArray = lorem.split(' ');

  let ob = {
    id: `chatcmpl-${faker.string.alphanumeric(30)}`,
    object: 'chat.completion.chunk',
    created: created,
    model: model,
    system_fingerprint: null,
    choices: [
      {
        index: 0,
        delta: {
          content: loremArray[0],
        },
        logprobs: null,
        finish_reason: null,
      },
    ],
  };

  return JSON.stringify(ob);
}
