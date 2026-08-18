import { mockOpenAIResponse, stopMocking } from '../dist/index.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'OPENAI_API_KEY' });

describe('Mock OpenAI Embeddings API', () => {
  let mockControl;

  beforeEach(() => {
    mockControl = mockOpenAIResponse(true);
  });

  afterEach(() => {
    stopMocking();
  });

  describe('Response shape', () => {
    it('should mock embeddings with correct properties', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'The quick brown fox jumped over the lazy dog',
      });

      expect(response).toHaveProperty('object', 'list');
      expect(response.model).toEqual('text-embedding-3-small');
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.data[0]).toHaveProperty('object', 'embedding');
      expect(response.data[0]).toHaveProperty('index', 0);
      expect(Array.isArray(response.data[0].embedding)).toBe(true);
      expect(response.data[0].embedding.length).toBe(1536);
      response.data[0].embedding.forEach(value => {
        expect(typeof value).toBe('number');
      });
      expect(response).toHaveProperty('usage');
      expect(response.usage).toHaveProperty('prompt_tokens');
      expect(response.usage).toHaveProperty('total_tokens');
      expect(response.usage.prompt_tokens).toBe(response.usage.total_tokens);
    });

    it('should return 3072 dimensions for text-embedding-3-large', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: 'A longer text to embed with the large model',
      });

      expect(response.data[0].embedding.length).toBe(3072);
    });

    it('should honor the dimensions parameter', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Reduced dimensionality embedding',
        dimensions: 256,
      });

      expect(response.data[0].embedding.length).toBe(256);
    });

    it('should return unit-length (L2 normalized) vectors', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Normalization check',
      });

      const norm = Math.sqrt(
        response.data[0].embedding.reduce((sum, value) => sum + value * value, 0),
      );
      expect(norm).toBeCloseTo(1, 8);
    });
  });

  describe('Input types', () => {
    it('should handle an array of strings with correct indexes', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: ['first text', 'second text', 'third text'],
      });

      expect(response.data.length).toBe(3);
      response.data.forEach((item, index) => {
        expect(item.index).toBe(index);
        expect(item.object).toBe('embedding');
        expect(item.embedding.length).toBe(1536);
      });
    });

    it('should handle a token array input', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: [15496, 1917, 10710],
      });

      expect(response.data.length).toBe(1);
      expect(response.data[0].index).toBe(0);
      expect(response.data[0].embedding.length).toBe(1536);
      expect(response.usage.total_tokens).toBe(3);
    });

    it('should handle an array of token arrays', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: [
          [1, 2, 3],
          [4, 5],
        ],
      });

      expect(response.data.length).toBe(2);
      expect(response.data[0].index).toBe(0);
      expect(response.data[1].index).toBe(1);
      expect(response.usage.total_tokens).toBe(5);
    });
  });

  describe('Deterministic vectors', () => {
    it('should return identical vectors for identical inputs', async () => {
      const input = 'Deterministic embedding test';

      const response1 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });
      const response2 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });

      expect(response1).toEqual(response2);
    });

    it('should be independent of the faker seed', async () => {
      const input = 'Seed independent embedding';
      mockControl.stopMocking();
      mockControl = mockOpenAIResponse(true, { seed: 111 });
      const response1 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });

      mockControl.stopMocking();
      mockControl = mockOpenAIResponse(true, { seed: 999 });
      const response2 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input,
      });

      expect(response1.data[0].embedding).toEqual(response2.data[0].embedding);
    });

    it('should return different vectors for different inputs', async () => {
      const response1 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'The food was delicious',
      });
      const response2 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'The weather is sunny today',
      });

      expect(response1.data[0].embedding).not.toEqual(response2.data[0].embedding);
    });
  });

  describe('Base64 encoding', () => {
    it('should return a base64 string decodable to float32 values', async () => {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Base64 encoding test',
        dimensions: 64,
        encoding_format: 'base64',
      });

      const base64 = response.data[0].embedding;
      expect(typeof base64).toBe('string');

      const buffer = Buffer.from(base64, 'base64');
      expect(buffer.length).toBe(64 * 4);

      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const decoded = [];
      for (let i = 0; i < 64; i++) {
        decoded.push(view.getFloat32(i * 4, true));
      }

      const floatResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Base64 encoding test',
        dimensions: 64,
      });
      decoded.forEach((value, i) => {
        expect(value).toBeCloseTo(Math.fround(floatResponse.data[0].embedding[i]), 6);
      });
    });
  });

  describe('Error handling', () => {
    it('should return 400 when model is missing', async () => {
      await expect(openai.embeddings.create({ input: 'text' })).rejects.toMatchObject({
        status: 400,
      });
    });

    it('should return 404 with model_not_found for non-embedding models', async () => {
      await expect(
        openai.embeddings.create({ model: 'gpt-4', input: 'text' }),
      ).rejects.toMatchObject({
        status: 404,
        error: { code: 'model_not_found' },
      });
    });

    it('should return 400 when input is missing', async () => {
      await expect(
        openai.embeddings.create({ model: 'text-embedding-3-small' }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('should return 400 for an empty string input', async () => {
      await expect(
        openai.embeddings.create({ model: 'text-embedding-3-small', input: '' }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('should return 400 for an empty array input', async () => {
      await expect(
        openai.embeddings.create({ model: 'text-embedding-3-small', input: [] }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('should return 400 when the input array exceeds 2048 items', async () => {
      const input = Array(3000).fill('text');
      await expect(
        openai.embeddings.create({ model: 'text-embedding-3-small', input }),
      ).rejects.toMatchObject({ status: 400 });
    });

    it('should return 400 when dimensions is used with ada-002', async () => {
      await expect(
        openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: 'text',
          dimensions: 512,
        }),
      ).rejects.toMatchObject({
        status: 400,
        error: { message: expect.stringContaining('Dimensions is not supported by this model') },
      });
    });

    it('should return 400 for an invalid encoding_format', async () => {
      await expect(
        openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: 'text',
          encoding_format: 'hex',
        }),
      ).rejects.toMatchObject({ status: 400 });
    });
  });

  describe('Custom and OpenAI-compatible models', () => {
    it('should accept unknown embedding-style models (OpenAI-compatible endpoints)', async () => {
      const response = await openai.embeddings.create({
        model: 'nomic-embed-text',
        input: 'Local model embedding',
      });

      expect(response.model).toEqual('nomic-embed-text');
      expect(response.data[0].embedding.length).toBe(1536);
    });

    it('should work with a custom baseUrl', async () => {
      mockControl.stopMocking();
      const customBaseUrl = 'https://custom-embed.example.com';
      mockControl = mockOpenAIResponse(true, { baseUrl: customBaseUrl });

      const customOpenai = new OpenAI({ apiKey: 'test-key', baseURL: customBaseUrl });
      const response = await customOpenai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Embedding via custom base URL',
      });

      expect(response.object).toBe('list');
      expect(response.data[0].embedding.length).toBe(1536);
    });
  });

  describe('Fixed response templates', () => {
    it('should use the EMBEDDING template when useFixedResponses is enabled', async () => {
      mockControl.stopMocking();
      mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

      const response1 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'First input',
      });
      const response2 = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Completely different input',
      });

      expect(response1).toEqual(response2);
      expect(response1.model).toEqual('text-embedding-3-small');
      expect(response1.data[0].embedding.length).toBe(1536);
    });

    it('should honor encoding_format with fixed responses', async () => {
      mockControl.stopMocking();
      mockControl = mockOpenAIResponse(true, { useFixedResponses: true });

      const floatResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'First input',
        encoding_format: 'float',
      });
      const base64Response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: 'Second input',
        encoding_format: 'base64',
      });

      expect(floatResponse.data[0].embedding.length).toBe(1536);

      // With an explicit base64 request, the SDK returns the raw base64 string
      const base64 = base64Response.data[0].embedding;
      expect(typeof base64).toBe('string');
      expect(base64.length).toBe(8192); // 1536 floats * 4 bytes, base64-encoded

      const buffer = Buffer.from(base64, 'base64');
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      for (let i = 0; i < 10; i++) {
        expect(view.getFloat32(i * 4, true)).toBeCloseTo(
          Math.fround(floatResponse.data[0].embedding[i]),
          6,
        );
      }
    });

    it('should expose the EMBEDDING template via getResponseTemplates', () => {
      const templates = mockControl.getResponseTemplates();
      expect(templates).toHaveProperty('EMBEDDING');
      expect(templates.EMBEDDING.object).toBe('list');
    });
  });
});
