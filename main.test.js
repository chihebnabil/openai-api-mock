const { mockOpenAIResponse, stopMocking } = require('./main');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: "OPENAI_API_KEY" });

describe('Mock OpenAI Chat & Image generation API', () => {
    beforeEach(() => {
        mockOpenAIResponse(true);
    });

    afterEach(() => {
        stopMocking();
    });

    describe('Chat Completion Tests', () => {
        it('should mock the chat completion with correct properties', async () => {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: 'system', content: "You're an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
                ]
            });

            expect(response).toHaveProperty('id');
            expect(response).toHaveProperty('object', 'chat.completion');
            expect(response).toHaveProperty('created');
            expect(response.model).toEqual('gpt-3.5-mock');
            expect(response.choices).toBeInstanceOf(Array);
            expect(response.choices[0]).toHaveProperty('index', 0);
            expect(response.choices[0]).toHaveProperty('message');
            expect(response.choices[0].message).toHaveProperty('role', 'assistant');
            expect(response.choices[0].message).toHaveProperty('content');
            expect(response.choices[0]).toHaveProperty('finish_reason', 'stop');
            expect(response).toHaveProperty('usage');
            expect(response.usage).toHaveProperty('prompt_tokens');
            expect(response.usage).toHaveProperty('completion_tokens');
            expect(response.usage).toHaveProperty('total_tokens');
        });

        it('should mock the streaming chat completion', async () => {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                stream: true,
                messages: [
                    { role: 'user', content: "What's the biggest country in the world" },
                ]
            });

            let streamContent = '';
            for await (const part of response) {
                expect(part).toHaveProperty('id');
                expect(part).toHaveProperty('object', 'chat.completion.chunk');
                expect(part).toHaveProperty('created');
                expect(part).toHaveProperty('model', 'gpt-3.5-mock');
                expect(part.choices[0]).toHaveProperty('index', 0);
                expect(part.choices[0]).toHaveProperty('delta');
                if (part.choices[0]?.delta?.content) {
                    streamContent += part.choices[0].delta.content;
                }
            }
            expect(streamContent).not.toBe('');
        });

        it('should mock the chat completion with function call', async () => {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: 'system', content: "You're an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
                ],
                functions: [
                    {
                        name: 'get_recipes',
                        description: 'Suggest at least 5 recipes based on the ingredients you have',
                        parameters: {
                            type: "object",
                            properties: {
                                recipes: {
                                    type: "array",
                                    description: "The recipes that can be made with the ingredients",
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            ingredients: { type: 'array', items: { type: 'string' } },
                                            instructions: { type: 'string' },
                                            serving: { type: 'string' },
                                        }
                                    }
                                },
                            }
                        },
                        required: ["recipes"],
                    },
                ],
                function_call: { name: 'get_recipes' },
            });

            expect(response.model).toEqual('gpt-3.5-mock');
            expect(response.choices[0]).toHaveProperty('finish_reason', 'function_call');
            expect(response.choices[0].message.function_call).toHaveProperty('name', 'get_recipes');
            expect(response.choices[0].message.function_call).toHaveProperty('arguments');
            const args = JSON.parse(response.choices[0].message.function_call.arguments);
            expect(args).toHaveProperty('recipes');
            expect(args.recipes).toBeInstanceOf(Array);
            expect(args.recipes.length).toBeGreaterThanOrEqual(5);
            args.recipes.forEach(recipe => {
                expect(recipe).toHaveProperty('name');
                expect(recipe).toHaveProperty('ingredients');
                expect(recipe).toHaveProperty('instructions');
                expect(recipe).toHaveProperty('serving');
            });
        });

        it('should mock the chat completion with tool calls', async () => {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: 'system', content: "You're an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes and send them to my email" },
                ],
                tools: [
                    {
                        type: "function",
                        function: {
                            name: 'get_recipes',
                            description: 'Suggest at least 5 recipes based on the ingredients you have',
                            parameters: {
                                type: "object",
                                properties: {
                                    recipes: {
                                        type: "array",
                                        items: {
                                            type: 'object',
                                            properties: {
                                                name: { type: 'string' },
                                                ingredients: { type: 'array', items: { type: 'string' } },
                                                instructions: { type: 'string' },
                                                serving: { type: 'string' },
                                            }
                                        }
                                    },
                                }
                            },
                            required: ["recipes"],
                        }
                    },
                    {
                        type: "function",
                        function: {
                            name: 'send_email',
                            description: 'Send an email to the user with the recipes',
                            parameters: {
                                type: "object",
                                properties: {
                                    email: { type: "string" },
                                    subject: { type: "string" },
                                    body: { type: "string" },
                                }
                            },
                            required: ["email", "subject", "body"],
                        }
                    }
                ],
                tool_choice: "auto",
            });

            expect(response.model).toEqual('gpt-3.5-mock');
            expect(response.choices[0]).toHaveProperty('finish_reason', 'tool_calls');
            expect(response.choices[0].message.tool_calls).toBeInstanceOf(Array);

            const recipesArgs = JSON.parse(response.choices[0].message.tool_calls[0].function.arguments);
            expect(recipesArgs).toHaveProperty('recipes');
        });
    });

    describe('Image Generation Tests', () => {
        it('should mock image generation with correct properties', async () => {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: "A futuristic cityscape",
                n: 1,
                size: "1024x1024",
                quality: "hd",
            });

            expect(response).toHaveProperty('created');
            expect(response).toHaveProperty('data');
            expect(response.data).toBeInstanceOf(Array);
            expect(response.data.length).toBe(1);
            expect(response.data[0]).toHaveProperty('revised_prompt');
            expect(response.data[0]).toHaveProperty('url');
            expect(response.data[0].url).toMatch(/^http:\/\//);
        });

        it('should handle multiple image generation', async () => {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: "Abstract art in various styles",
                n: 3,
                size: "512x512",
                quality: "standard",
            });

            expect(response.data).toBeInstanceOf(Array);
            expect(response.data.length).toBe(3);
            response.data.forEach(image => {
                expect(image).toHaveProperty('url');
                expect(image.url).toMatch(/^http:\/\//);
            });
        });
    });

    it('should allow other requests', async () => {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos');
        const data = await response.json();

        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('userId');
        expect(data[0]).toHaveProperty('title');
        expect(data[0]).toHaveProperty('completed');
    });
});