import { mockOpenAIResponse, stopMocking } from '../dist/index.js';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'OPENAI_API_KEY' });

describe('Mock OpenAI Chat with a delay', () => {
  beforeEach(() => {
    mockOpenAIResponse(true, { latency: 1000, logRequests: true });
  });

  afterEach(() => {
    stopMocking();
  });

  test('should mock OpenAI Chat with a delay', async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-mock',
      messages: [
        { role: 'system', content: "You're an expert chef" },
        { role: 'user', content: 'Suggest at least 5 recipes' },
      ],
    });

    expect(response).toBeDefined();
  });
});
