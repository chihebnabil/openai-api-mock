/**
 * Test file demonstrating consistent output mechanisms
 */

import { mockOpenAIResponse } from '../src/index.js';

describe('Consistent Output Mechanisms', () => {
  let mockControl;

  afterEach(() => {
    if (mockControl) {
      mockControl.stopMocking();
    }
  });

  describe('Seed-based consistency', () => {
    test('should produce identical responses with the same seed', async () => {
      // First run with seed
      mockControl = mockOpenAIResponse(true, { seed: 12345 });

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: 'test-key' });

      const response1 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      mockControl.stopMocking();

      // Second run with same seed
      mockControl = mockOpenAIResponse(true, { seed: 12345 });

      const response2 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      // Responses should be identical
      expect(response1).toEqual(response2);
    });

    test('should produce different responses with different seeds', async () => {
      // First run with seed 12345
      mockControl = mockOpenAIResponse(true, { seed: 12345 });

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: 'test-key' });

      const response1 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      mockControl.stopMocking();

      // Second run with different seed
      mockControl = mockOpenAIResponse(true, { seed: 54321 });

      const response2 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      // Responses should be different
      expect(response1).not.toEqual(response2);
    });

    test('should allow runtime seed changes', async () => {
      mockControl = mockOpenAIResponse(true);

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: 'test-key' });

      // Set seed at runtime
      mockControl.setSeed(12345);

      const response1 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      // Change seed
      mockControl.setSeed(12345);

      const response2 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      // Responses should be identical with same seed
      expect(response1).toEqual(response2);
    });
  });

  describe('Fixed response templates', () => {
    test('should use fixed templates when enabled', async () => {
      mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: 'test-key' });

      const response1 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      const response2 = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Different message' }],
      });

      // Both responses should be identical and match the template
      expect(response1).toEqual(response2);
      expect(response1.choices[0].message.content).toBe('This is a consistent test response.');
      expect(response1.id).toBe('chatcmpl-test123456789');
    });

    test('should use function call template for function requests', async () => {
      mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: 'test-key' });

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
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

      expect(response.choices[0].message.function_call).toBeDefined();
      expect(response.choices[0].message.function_call.name).toBe('test_function');
      expect(response.choices[0].finish_reason).toBe('function_call');
    });

    test('should provide access to response templates', () => {
      mockControl = mockOpenAIResponse(true);

      const templates = mockControl.getResponseTemplates();

      expect(templates).toHaveProperty('SIMPLE_CHAT');
      expect(templates).toHaveProperty('FUNCTION_CALL');
      expect(templates).toHaveProperty('TOOL_CALL');
      expect(templates).toHaveProperty('IMAGE_GENERATION');
    });

    test('should allow creating custom response templates', () => {
      mockControl = mockOpenAIResponse(true);

      const customTemplate = mockControl.createResponseTemplate('SIMPLE_CHAT', {
        choices: [
          {
            message: {
              content: 'Custom response content',
            },
          },
        ],
      });

      expect(customTemplate.choices[0].message.content).toBe('Custom response content');
      // Other properties should remain from the template
      expect(customTemplate.id).toBe('chatcmpl-test123456789');
    });
  });

  describe('Image generation consistency', () => {
    test('should use fixed template for image generation', async () => {
      mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: 'test-key' });

      const response1 = await openai.images.generate({
        prompt: 'A sunset over mountains',
      });

      const response2 = await openai.images.generate({
        prompt: 'A cat wearing a hat',
      });

      // Both responses should be identical
      expect(response1).toEqual(response2);
      expect(response1.data[0].url).toBe('https://example.com/test-image.png');
    });
  });
});
