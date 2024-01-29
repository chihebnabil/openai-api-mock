const { faker } = require('@faker-js/faker');

function getResponce(requestBody) {
    const created = Math.floor(Date.now() / 1000)
    if (!requestBody.functions) {
        return {
            choices: [
                {
                    finish_reason: 'stop',
                    index: 0,
                    message: {
                        content: faker.lorem.words(5),
                        role: 'assistant',
                    },
                    logprobs: null,
                },
            ],
            created: created,
            id: `chatcmpl-${faker.random.alphaNumeric(30)}`,
            model: `gpt-3.5-mock`,
            object: 'chat.completion',
            usage: {
                completion_tokens: 17,
                prompt_tokens: 57,
                total_tokens: 74,
            },
        }
    }

    let functionCallingResponse = {
        id: `chatcmpl-${faker.random.alphaNumeric(30)}`,
        object: 'chat.completion',
        created: created,
        model: 'gpt-3.5-turbo-0613',
        choices: [
            {
                index: 0,
                message: {
                    role: 'assistant',
                    content: null,
                    function_call: {
                        name: `${requestBody.functions[0].name}`,
                        arguments: `${generateFunctionCallArguments(requestBody)}`,
                    }
                },
                finish_reason: 'function_call'
            }
        ],
        usage: {
            prompt_tokens: 81,
            completion_tokens: 19,
            total_tokens: 100
        }
    };
    return functionCallingResponse;
}

function generateFunctionCallArguments(requestBody) {
    const { parameters } = requestBody.functions[0];
    const argumentsObject = {};

    Object.entries(parameters.properties).forEach(([paramName, paramDetails]) => {
        if (paramDetails.type === 'string') {
            argumentsObject[paramName] = faker.lorem.words(5);
        } else if (paramDetails.type === 'number') {
            argumentsObject[paramName] = faker.number.int();
        } else {
            argumentsObject[paramName] = faker.lorem.words(1);
        }
    });

    return JSON.stringify(argumentsObject, null, 2);
}

module.exports = {
    getResponce
}