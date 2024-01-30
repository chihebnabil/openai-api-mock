const { faker } = require('@faker-js/faker');

function getChatResponce(requestBody) {
    const created = Math.floor(Date.now() / 1000);

    if (!requestBody.functions) {
        return createDefaultResponse(created);
    }

    return createFunctionCallingResponse(requestBody, created);
}

function createDefaultResponse(created) {
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
    };
}

function createFunctionCallingResponse(requestBody, created) {
    const functionCallingResponse = {
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
                    function_call: createFunctionCallObject(requestBody),
                },
                finish_reason: 'function_call',
            },
        ],
        usage: {
            prompt_tokens: 81,
            completion_tokens: 19,
            total_tokens: 100,
        },
    };

    return functionCallingResponse;
}

function createFunctionCallObject(requestBody) {
    return {
        name: `${requestBody.functions[0].name}`,
        arguments: `${generateFunctionCallArguments(requestBody)}`,
    };
}

function generateFakeData(type, properties) {
    switch (type) {
        case 'string':
            return faker.lorem.words(5);
        case 'number':
            return faker.number.int();
        case 'array':
            return generateFakeArray(properties);
        case 'object':
            return generateFakeObject(properties);
        case 'boolean':
            return faker.datatype.boolean();
        default:
            return faker.lorem.words(1);
    }
}

function generateFakeArray(properties) {
    const arrayItemsType = properties.items.type;
    return Array.from({ length: 5 }, () => {
        if (arrayItemsType === 'string') {
            return faker.lorem.words(1);
        } else if (arrayItemsType === 'object') {
            const itemProperties = properties.items.properties;
            return generateFakeData('object', { properties: itemProperties });
        }
    });
}

function generateFakeObject(properties) {
    const itemObject = {};
    Object.entries(properties.properties).forEach(([itemName, itemDetails]) => {
        itemObject[itemName] = generateFakeData(itemDetails.type, itemDetails);
    });
    return itemObject;
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
    getChatResponce,
};