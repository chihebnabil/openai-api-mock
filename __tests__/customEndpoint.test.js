import fetch from 'node-fetch';
import { mockOpenAIResponse, stopMocking } from '../dist/index.js';

describe('Mock Custom OpenAI endpoint', () => {
  let mock;
  beforeEach(() => {
    mock = mockOpenAIResponse(true, { logRequests: true });
  });

  afterEach(() => {
    stopMocking();
  });

  test('should mock custom endpoint', async () => {
    mock.addCustomEndpoint('POST', '/v1/custom/endpoint', () => {
      return [200, { message: 'Custom endpoint response' }];
    });
    const response = await fetch('https://api.openai.com/v1/custom/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    expect(data).toEqual({ message: 'Custom endpoint response' });
  });

  test('should mock custom endpoint with error', async () => {
    mock.addCustomEndpoint('POST', '/v1/custom/endpoint', () => {
      return [400, { error: { message: 'Invalid request' } }];
    });
    const response = await fetch('https://api.openai.com/v1/custom/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    expect(data).toEqual({ error: { message: 'Invalid request' } });
  });
});
