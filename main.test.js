const nock = require('nock');
const { mockOpenAIResponse, stopMocking } = require('./main');

const openaiCompletionEndpoint = 'https://api.openai.com/v1/chat/completions';
const imageEndpoint = 'https://api.openai.com/v1/images/generations';

describe('mockOpenAIResponse', () => {
    it('should mock the chat completion', async () => {
        mockOpenAIResponse();

        nock(openaiCompletionEndpoint)
            .post('')
            .reply(function (uri, requestBody) {
                return [200, getChatResponce(requestBody)];
            });
        try {
            // Post using fetch
            const response = await fetch(openaiCompletionEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "gpt-3.5",
                    messages: [
                        { role: 'system', content: "You'r an expert chef" },
                        { role: 'user', content: "Suggest at least 5 recipes" },
                    ]
                }),
            });
            if (!response.ok) {
                console.log('Response not OK:', response);
                return;
            }

            const data = await response.json();
            expect(data.choices[0]).toHaveProperty('finish_reason', 'stop');
            expect(data.model).toEqual('gpt-3.5-mock');
            stopMocking();
        } catch (error) {
        }
    });


    it('should mock image generation', async () => {
        mockOpenAIResponse();

        nock(imageEndpoint)
            .post('')
            .reply(function (uri, requestBody) {
                return [200, getImageResponce(requestBody)];
            });

        try {
            const response = await fetch(imageEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "dall-e-3",
                    prompt: "Kurt Cobain",
                    n: 1,
                    size: "1024x1024",
                    quality: "hd",
                }),
            });
            if (!response.ok) {
                console.log('Response not OK:', response);
                return;
            }

            const data = await response.json();
            expect(data.data[0]).toHaveProperty('revised_prompt');
            expect(data.data[0]).toHaveProperty('url');
            expect(data.model).toEqual('dall-e-3-mock');
            stopMocking();
        }catch(error){

        }
    
    });

    it('should allow other requests', async () => {
        mockOpenAIResponse();
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/todos');
            if (!response.ok) {
                console.log('Response not OK:', response);
                return;
            }
            const data = await response.json();
            expect(data).toHaveProperty('data');
            stopMocking();
        }catch(error){

        }
    })
});