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
    it('should mock the chat completion', async () => {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5",
                messages: [
                    { role: 'system', content: "You'r an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
                ]
            });
            expect(response.choices[0]).toHaveProperty('finish_reason', 'stop');
            expect(response.model).toEqual('gpt-3.5-mock');
        } catch (error) {
            throw new Error(error);
        }
    });

    it('should mock the chat completion with function call', async () => {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5",
                messages: [
                    { role: 'system', content: "You'r an expert chef" },
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
                                            name: {
                                                type: 'string',
                                                description: 'The name of the recipe',
                                            },
                                            ingredients: {
                                                type: 'array',
                                                description: 'The ingredients needed for the recipe',
                                                items: {
                                                    type: 'string',
                                                    description: 'The name of the ingredient',
                                                },
                                            },
                                            instructions: {
                                                type: 'string',
                                                description: 'Detailed instructions on how to make the recipe',
                                            },
                                            serving: {
                                                type: 'string',
                                                description: 'The number of people the recipe serves',
                                            },
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
            expect(JSON.parse(response.choices[0].message.function_call.arguments)).toHaveProperty('recipes');

        } catch (error) {
            throw new Error(error);
        }
    });


    it('should mock the chat completion with email function call (tools)', async () => {
        try{
            const response = await openai.chat.completions.create({
                model: "gpt-3.5",
                messages: [
                    { role: 'system', content: "You'r an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
                ],
                tools: [
                    {
                    type: "function",
                    function: {
                        name: 'send_email',
                        description: 'Send an email to the user with the recipes',
                        parameters: {
                            type: "object",
                            properties: {
                                email: {
                                    type: "string",
                                    description: "The email address of the user",
                                }
                            }
                        },
                        required: ["email"],
                    }

                }],

                tool_choice: { name: 'send_email' },
            });
            expect(response.model).toEqual('gpt-3.5-mock');
            expect(response.choices[0]).toHaveProperty('finish_reason', 'tool_calls');
            expect(response.choices[0].message.tool_calls[0].function).toHaveProperty('name', 'send_email');
            expect(response.choices[0].message.tool_calls[0].function).toHaveProperty('arguments');
            expect(JSON.parse(response.choices[0].message.tool_calls[0].function.arguments)).toHaveProperty('email');
         
        }catch(error){
            throw new Error(error);
        }

    });


    it('should mock the chat completion with function call (tools)', async () => {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5",
                messages: [
                    { role: 'system', content: "You'r an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
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
                                    description: "The recipes that can be made with the ingredients",
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: {
                                                type: 'string',
                                                description: 'The name of the recipe',
                                            },
                                            ingredients: {
                                                type: 'array',
                                                description: 'The ingredients needed for the recipe',
                                                items: {
                                                    type: 'string',
                                                    description: 'The name of the ingredient',
                                                },
                                            },
                                            instructions: {
                                                type: 'string',
                                                description: 'Detailed instructions on how to make the recipe',
                                            },
                                            serving: {
                                                type: 'string',
                                                description: 'The number of people the recipe serves',
                                            },
                                        }
                                    }
                                },
                            }
                        },
                        required: ["recipes"],
                    }

                }],
                tool_choice: { name: 'get_recipes' },
            });
            expect(response.model).toEqual('gpt-3.5-mock');
            expect(response.choices[0]).toHaveProperty('finish_reason', 'tool_calls');
            expect(response.choices[0].message.tool_calls[0].function).toHaveProperty('name', 'get_recipes');
            expect(response.choices[0].message.tool_calls[0].function).toHaveProperty('arguments');
            expect(JSON.parse(response.choices[0].message.tool_calls[0].function.arguments)).toHaveProperty('recipes');
    });


    it('should mock image generation', async () => {
        try {
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt: "Kurt Cobain",
                n: 1,
                size: "1024x1024",
                quality: "hd",
            });

            expect(response.data[0]).toHaveProperty('revised_prompt');
            expect(response.data[0]).toHaveProperty('url');
        } catch (error) {
            throw new Error(error);
        }

    });

    it('should allow other requests', async () => {
        try {
            const response = await fetch('https://jsonplaceholder.typicode.com/todos');
            const data = await response.json();
            expect(data[0]).toHaveProperty('completed');
        } catch (error) {
            throw new Error(error);
        }
    })
});