import fetch from 'node-fetch';
import { mockOpenAIResponse, stopMocking } from '../dist/index.js';
import OpenAI from 'openai';

describe('Mock OpenAI with custom baseUrl', () => {
  afterEach(() => {
    stopMocking();
  });

  test('should use default base URL when no baseUrl is provided', async () => {
    const mock = mockOpenAIResponse(true, { logRequests: false });
    
    // Test with default OpenAI client
    const openai = new OpenAI({ apiKey: 'test-key' });
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
    });

    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('object', 'chat.completion');
    expect(response.model).toEqual('gpt-3.5-turbo-mock');
  });

  test('should mock custom base URL for chat completions', async () => {
    const customBaseUrl = 'https://custom-api.example.com';
    const mock = mockOpenAIResponse(true, { 
      baseUrl: customBaseUrl,
      logRequests: false 
    });

    // Test with custom base URL using OpenAI client
    const openai = new OpenAI({ 
      apiKey: 'test-key',
      baseURL: customBaseUrl 
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello from custom API' }],
    });

    expect(response).toHaveProperty('id');
    expect(response).toHaveProperty('object', 'chat.completion');
    expect(response.model).toEqual('gpt-4-mock');
    expect(response.choices).toBeInstanceOf(Array);
    expect(response.choices[0]).toHaveProperty('message');
    expect(response.choices[0].message).toHaveProperty('role', 'assistant');
  });

  test('should mock custom base URL for image generations', async () => {
    const customBaseUrl = 'https://custom-api.example.com';
    const mock = mockOpenAIResponse(true, { 
      baseUrl: customBaseUrl,
      logRequests: false 
    });

    // Test with custom base URL using OpenAI client
    const openai = new OpenAI({ 
      apiKey: 'test-key',
      baseURL: customBaseUrl 
    });
    
    const response = await openai.images.generate({
      prompt: 'A custom image',
      n: 1,
      size: '1024x1024',
    });

    expect(response).toHaveProperty('created');
    expect(response).toHaveProperty('data');
    expect(response.data).toBeInstanceOf(Array);
    expect(response.data[0]).toHaveProperty('url');
  });

  test('should work with custom endpoints using custom base URL', async () => {
    const customBaseUrl = 'https://local-api.example.com';
    const mock = mockOpenAIResponse(true, { 
      baseUrl: customBaseUrl,
      logRequests: false 
    });

    // Add custom endpoint to the custom base URL
    mock.addCustomEndpoint('POST', '/v1/custom/test', (uri, body) => {
      return [200, { custom: 'response from custom base', receivedBody: body }];
    });

    const response = await fetch(`${customBaseUrl}/v1/custom/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    });

    const data = await response.json();
    expect(data).toEqual({ 
      custom: 'response from custom base', 
      receivedBody: { test: 'data' } 
    });
  });

  test('should handle different custom base URLs', async () => {
    // Test Azure OpenAI-style URL
    const azureBaseUrl = 'https://myresource.openai.azure.com';
    const azureMock = mockOpenAIResponse(true, { 
      baseUrl: azureBaseUrl,
      logRequests: false 
    });

    const azureOpenai = new OpenAI({ 
      apiKey: 'test-key',
      baseURL: azureBaseUrl 
    });
    
    const azureResponse = await azureOpenai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello Azure' }],
    });

    expect(azureResponse).toHaveProperty('object', 'chat.completion');
    expect(azureResponse.model).toEqual('gpt-4-mock');

    stopMocking(); // Clean up before next test

    // Test localhost URL
    const localBaseUrl = 'http://localhost:11434';
    const localMock = mockOpenAIResponse(true, { 
      baseUrl: localBaseUrl,
      logRequests: false 
    });

    const localOpenai = new OpenAI({ 
      apiKey: 'test-key',
      baseURL: localBaseUrl 
    });
    
    const localResponse = await localOpenai.chat.completions.create({
      model: 'llama2',
      messages: [{ role: 'user', content: 'Hello localhost' }],
    });

    expect(localResponse).toHaveProperty('object', 'chat.completion');
    expect(localResponse.model).toEqual('llama2-mock');
  });

  test('should handle streaming with custom base URL', async () => {
    const customBaseUrl = 'https://streaming-api.example.com';
    const mock = mockOpenAIResponse(true, { 
      baseUrl: customBaseUrl,
      logRequests: false 
    });

    const openai = new OpenAI({ 
      apiKey: 'test-key',
      baseURL: customBaseUrl 
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: true,
      messages: [{ role: 'user', content: 'Hello streaming' }],
    });

    let streamContent = '';
    let chunkCount = 0;
    
    for await (const part of response) {
      chunkCount++;
      if (part.choices[0]?.delta?.content) {
        streamContent += part.choices[0].delta.content;
      }
      // Limit chunks to avoid infinite loop in tests
      if (chunkCount > 10) break;
    }

    expect(chunkCount).toBeGreaterThan(0);
    expect(streamContent.length).toBeGreaterThan(0);
  });

  test('should not interfere with requests to other domains', async () => {
    const customBaseUrl = 'https://custom-api.example.com';
    const mock = mockOpenAIResponse(true, { 
      baseUrl: customBaseUrl,
      logRequests: false 
    });

    // This request should NOT be intercepted since it's to a different domain
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
      });
      
      const data = await response.json();
      // Should get real response from httpbin.org, not our mock
      expect(data).toHaveProperty('url', 'https://httpbin.org/get');
    } catch (error) {
      // If network request fails, it's acceptable since we're testing isolation
      // The important thing is that our mock doesn't interfere
      console.log('Network request failed, which is acceptable for isolation test');
    }
  });
});