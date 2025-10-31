# Consistency Examples for OpenAI API Mock

This document demonstrates the various mechanisms available for achieving consistent, deterministic outputs when using the OpenAI API Mock library.

## Table of Contents

1. [Seed-based Consistency](#seed-based-consistency)
2. [Fixed Response Templates](#fixed-response-templates)
3. [Runtime Seed Management](#runtime-seed-management)
4. [Custom Response Templates](#custom-response-templates)

## Seed-based Consistency

Use seeds to ensure deterministic responses across test runs. This is particularly useful for regression testing and reproducible behavior.

### Basic Seed Usage

```javascript
import { mockOpenAIResponse } from 'openai-api-mock';
import OpenAI from 'openai';

// Set up mock with a fixed seed
const mockControl = mockOpenAIResponse(true, {
  seed: 12345,
  logRequests: true,
});

const openai = new OpenAI({ apiKey: 'test-key' });

// Multiple calls will return identical responses
const response1 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});

const response2 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});

// response1 and response2 will be identical
console.log('Responses are identical:', JSON.stringify(response1) === JSON.stringify(response2));

mockControl.stopMocking();
```

### Using Different Seeds

```javascript
// Test with seed A
const mockA = mockOpenAIResponse(true, { seed: 12345 });
const responseA = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});
mockA.stopMocking();

// Test with seed B
const mockB = mockOpenAIResponse(true, { seed: 54321 });
const responseB = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});
mockB.stopMocking();

// Responses will be different
console.log('Responses are different:', JSON.stringify(responseA) !== JSON.stringify(responseB));
```

## Fixed Response Templates

For maximum consistency, use predefined response templates that return exactly the same response every time.

### Using Fixed Templates

```javascript
// Enable fixed responses
const mockControl = mockOpenAIResponse(true, {
  useFixedResponses: true,
  logRequests: true,
});

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Any message here' }],
});

// Will always return:
// {
//   "choices": [{
//     "finish_reason": "stop",
//     "index": 0,
//     "message": {
//       "content": "This is a consistent test response.",
//       "role": "assistant"
//     },
//     "logprobs": null
//   }],
//   "created": 1640995200,
//   "id": "chatcmpl-test123456789",
//   "model": "gpt-3.5-mock",
//   "object": "chat.completion",
//   "usage": {
//     "completion_tokens": 10,
//     "prompt_tokens": 20,
//     "total_tokens": 30
//   }
// }
```

### Function Call Templates

```javascript
const mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Get weather' }],
  functions: [
    {
      name: 'get_weather',
      description: 'Get weather information',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
        },
      },
    },
  ],
});

// Returns consistent function call response
console.log(response.choices[0].message.function_call);
// {
//   "name": "test_function",
//   "arguments": "{\"param1\": \"test_value\", \"param2\": 42}"
// }
```

### Image Generation Templates

```javascript
const mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

const response = await openai.images.generate({
  prompt: 'A sunset over mountains',
});

// Always returns the same image URL
console.log(response.data[0].url); // "https://example.com/test-image.png"
```

## Runtime Seed Management

Change seeds during runtime to test different scenarios while keeping the mock active.

```javascript
const mockControl = mockOpenAIResponse(true, { logRequests: true });

// Set initial seed
mockControl.setSeed(12345);
const response1 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});

// Change seed for different behavior
mockControl.setSeed(54321);
const response2 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});

// Reset to random responses
mockControl.resetSeed();
const response3 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});

mockControl.stopMocking();
```

## Custom Response Templates

Create and use custom response templates for specific testing scenarios.

```javascript
const mockControl = mockOpenAIResponse(true);

// Get available templates
const templates = mockControl.getResponseTemplates();
console.log('Available templates:', Object.keys(templates));
// ["SIMPLE_CHAT", "FUNCTION_CALL", "TOOL_CALL", "IMAGE_GENERATION"]

// Create a custom template based on existing one
const customTemplate = mockControl.createResponseTemplate('SIMPLE_CHAT', {
  choices: [
    {
      message: {
        content: 'This is my custom response content!',
      },
    },
  ],
  model: 'gpt-4-custom-mock',
  usage: {
    completion_tokens: 50,
    prompt_tokens: 100,
    total_tokens: 150,
  },
});

console.log('Custom template:', customTemplate);
// The response will have the custom content but retain other template properties
```

// Example 1: Set seed during initialization
const mockControl = mockOpenAIResponse(true, {
seed: 12345,
logRequests: true
});

const openai = new OpenAI({ apiKey: 'test-key' });

// These calls will produce identical responses
const response1 = await openai.chat.completions.create({
model: 'gpt-3.5-turbo',
messages: [{ role: 'user', content: 'Hello' }]
});

const response2 = await openai.chat.completions.create({
model: 'gpt-3.5-turbo',
messages: [{ role: 'user', content: 'Hello' }]
});

console.log(response1.choices[0].message.content === response2.choices[0].message.content); // true

// Example 2: Change seed at runtime
mockControl.setSeed(54321);

const response3 = await openai.chat.completions.create({
model: 'gpt-3.5-turbo',
messages: [{ role: 'user', content: 'Hello' }]
});

console.log(response1.choices[0].message.content === response3.choices[0].message.content); // false

// Example 3: Reset to random behavior
mockControl.resetSeed();

const response4 = await openai.chat.completions.create({
model: 'gpt-3.5-turbo',
messages: [{ role: 'user', content: 'Hello' }]
});

// response4 will be random

mockControl.stopMocking();

````

## Using Fixed Response Templates

```javascript
import { mockOpenAIResponse } from 'openai-api-mock';
import OpenAI from 'openai';

// Initialize with fixed responses
const mockControl = mockOpenAIResponse(true, {
  useFixedResponses: true,
  logRequests: true
});

const openai = new OpenAI({ apiKey: 'test-key' });

// All simple chat requests will return the same fixed response
const response1 = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Any message' }]
});

console.log(response1.choices[0].message.content); // "This is a consistent test response."
console.log(response1.id); // "chatcmpl-test123456789"

// Function calls will use the function call template
const functionResponse = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Get weather' }],
  functions: [{
    name: 'get_weather',
    description: 'Get weather information',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      }
    }
  }]
});

console.log(functionResponse.choices[0].message.function_call.name); // "test_function"

// Image generation will use fixed template
const imageResponse = await openai.images.generate({
  prompt: 'Any prompt'
});

console.log(imageResponse.data[0].url); // "https://example.com/test-image.png"

mockControl.stopMocking();
````

## Working with Response Templates

```javascript
import { mockOpenAIResponse } from 'openai-api-mock';

const mockControl = mockOpenAIResponse(true);

// Get all available templates
const templates = mockControl.getResponseTemplates();
console.log(Object.keys(templates)); // ['SIMPLE_CHAT', 'FUNCTION_CALL', 'TOOL_CALL', 'IMAGE_GENERATION']

// Create a custom template based on existing one
const customChatTemplate = mockControl.createResponseTemplate('SIMPLE_CHAT', {
  choices: [
    {
      message: {
        content: 'This is my custom response content',
      },
    },
  ],
  model: 'gpt-4-mock',
});

console.log(customChatTemplate.choices[0].message.content); // "This is my custom response content"
console.log(customChatTemplate.model); // "gpt-4-mock"
console.log(customChatTemplate.id); // "chatcmpl-test123456789" (preserved from template)

mockControl.stopMocking();
```

## Combining Seed and Custom Logic

```javascript
import { mockOpenAIResponse } from 'openai-api-mock';
import OpenAI from 'openai';

// Use seed for faker-generated content, but override specific responses
const mockControl = mockOpenAIResponse(true, {
  seed: 12345,
});

// Add a custom endpoint that returns fixed content
mockControl.addCustomEndpoint('POST', '/v1/custom/test', () => {
  return [
    200,
    {
      message: 'This is always the same',
      timestamp: Date.now(), // This will vary
    },
  ];
});

const openai = new OpenAI({ apiKey: 'test-key' });

// Regular chat will be seeded (consistent faker content)
const chatResponse = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello' }],
});

// Custom endpoint will have mixed behavior
const customResponse = await fetch('https://api.openai.com/v1/custom/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});

mockControl.stopMocking();
```

## Testing Scenarios

```javascript
describe('My OpenAI Integration', () => {
  let mockControl;

  beforeEach(() => {
    // Use consistent seed for all tests
    mockControl = mockOpenAIResponse(true, { seed: 12345 });
  });

  afterEach(() => {
    mockControl.stopMocking();
  });

  test('should handle chat responses consistently', async () => {
    const openai = new OpenAI({ apiKey: 'test-key' });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test message' }],
    });

    // This assertion will always pass with the same seed
    expect(response.choices[0].message.content).toBe('expedita quibusdam corrupti autem'); // or whatever the seeded response is
  });

  test('should handle function calls with fixed responses', async () => {
    // Switch to fixed responses for this test
    mockControl.stopMocking();
    mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

    const openai = new OpenAI({ apiKey: 'test-key' });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }],
      functions: [{ name: 'test_func', parameters: { type: 'object', properties: {} } }],
    });

    // This will always be the same
    expect(response.choices[0].message.function_call.name).toBe('test_function');
    expect(response.choices[0].message.function_call.arguments).toBe(
      '{"param1": "test_value", "param2": 42}',
    );
  });
});
```

## Best Practices

1. **For Unit Tests**: Use `seed` option to ensure consistent faker-generated content
2. **For Integration Tests**: Use `useFixedResponses: true` for completely predictable responses
3. **For Manual Testing**: Use `logRequests: true` to see what requests are being mocked
4. **For Performance Testing**: Use `latency` option with a seed to simulate consistent network conditions
5. **For Error Testing**: Use `includeErrors: true` with a seed to get reproducible error scenarios
