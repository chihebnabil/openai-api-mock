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
            id: `chatcmpl-${faker.string.alphanumeric(30)}`,
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
        id: `chatcmpl-${faker.string.alphanumeric(30)}`,
        object: 'chat.completion',
        created: created,
        model: 'gpt-3.5-mock',
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

function generateFakeData(type, properties) {
    if (type === 'string') {
        return faker.lorem.words(5);
    } else if (type === 'number') {
        return faker.random.number();
    } else if (type === 'array') {
        const arrayItemsType = properties.items.type;
        let arrayItems = [];
        if (arrayItemsType === 'string') {
            arrayItems = Array.from({ length: 5 }, () => faker.lorem.words(1));
        } else if (arrayItemsType === 'object') {
            const itemProperties = properties.items.properties;
            arrayItems = Array.from({ length: 5 }, () => generateFakeData('object', { properties: itemProperties }));
        }
        return arrayItems;
    } else if (type === 'object') {
        const itemObject = {};
        Object.entries(properties.properties).forEach(([itemName, itemDetails]) => {
            itemObject[itemName] = generateFakeData(itemDetails.type, itemDetails);
        });
        return itemObject;
    } else {
        return faker.lorem.words(1);
    }
}

function generateFunctionCallArguments(requestBody) {
    const { parameters } = requestBody.functions[0];
    const argumentsObject = {};

    Object.entries(parameters.properties).forEach(([paramName, paramDetails]) => {
        argumentsObject[paramName] = generateFakeData(paramDetails.type, paramDetails);
    });

    return JSON.stringify(argumentsObject, null, 2);
}

module.exports = {
    getResponce
}