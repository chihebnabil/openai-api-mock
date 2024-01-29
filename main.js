const nock = require('nock');
const { getResponce } = require('./src/responce.js');

async function main() {
    const chatCompletion = await openai.chat.completions.create({
        functions: [
            {
                name: 'get_current_weather',
                description: 'Get the current weather in a given location',
                parameters: {
                    type: 'object',
                    properties: {
                        location: {
                            type: 'string',
                            description: 'The city and state, e.g. San Francisco, CA'
                        },
                        unit: {
                            type: 'string',
                            enum: ['celsius', 'fahrenheit']
                        }
                    },
                    required: ['location']
                }
            }
        ],
        model: 'gpt-3.5-turbo',
    });

    console.log(JSON.parse(chatCompletion.choices[0].message.function_call.arguments));
}

function mockOpenAIResponse() {
    // Define the OpenAI endpoint
    const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
    // Intercept the HTTP call and return the mock response
    if (process.env.NODE_ENV === 'development') {
        nock(openaiEndpoint)
            .post('')
            .reply(
                function (uri, requestBody) {
                    return [200, getResponce(requestBody)];
                }
            );
    }
}

module.exports = {
    mockOpenAIResponse
};
