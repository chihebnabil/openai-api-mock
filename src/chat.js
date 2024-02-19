const { faker } = require("@faker-js/faker");

function getChatResponce(requestBody) {
  const created = Math.floor(Date.now() / 1000);

  if (!requestBody.functions && !requestBody.tools) {
    return createDefaultResponse(created);
  }

  return createFunctionCallingResponse(requestBody, created);
}

function createDefaultResponse(created) {
  return {
    choices: [
      {
        finish_reason: "stop",
        index: 0,
        message: {
          content: faker.lorem.words(5),
          role: "assistant",
        },
        logprobs: null,
      },
    ],
    created: created,
    id: `chatcmpl-${faker.string.alphanumeric(30)}`,
    model: `gpt-3.5-mock`,
    object: "chat.completion",
    usage: {
      completion_tokens: 17,
      prompt_tokens: 57,
      total_tokens: 74,
    },
  };
}

function createFunctionCallingResponse(requestBody, created) {
  const isTool = Boolean(requestBody.tools);
  const functionOrToolCallObject = isTool
    ? [createToolCallObject(requestBody)]
    : createFunctionCallObject(requestBody);
  const functionOrToolCall = isTool ? "tool_calls" : "function_call";

  const functionCallingResponse = {
    id: `chatcmpl-${faker.string.alphanumeric(30)}`,
    object: "chat.completion",
    created: created,
    model: "gpt-3.5-mock",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: null,
          [functionOrToolCall]: functionOrToolCallObject,
        },
        finish_reason: functionOrToolCall,
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

function createToolCallObject(requestBody) {
  return {
    id: `call-${faker.string.alphanumeric(30)}`,
    type: "function",
    function: {
      name: `${requestBody.tools[0].function.name}`,
      arguments: `${generateToolCallArguments(requestBody)}`,
    },
  };
}
function createFunctionCallObject(requestBody) {
  return {
    name: `${requestBody.functions[0].name}`,
    arguments: `${generateFunctionCallArguments(requestBody)}`,
  };
}

function generateToolCallArguments(requestBody) {
  const { parameters } = requestBody.tools[0].function;
  const argumentsObject = {};

  Object.entries(parameters.properties).forEach(([paramName, paramDetails]) => {
    argumentsObject[paramName] = generateFakeData(
      paramDetails.type,
      paramDetails
    );
  });

  return JSON.stringify(argumentsObject, null, 2);
}

function generateFakeData(type, properties, name) {
  switch (type) {
    case "string":
      if (name === "name") {
        return faker.person.fullName();
      } else if (name === "email") {
        return faker.internet.email();
      } else if (name === "price") {
        return faker.commerce.price({ min: 100 });
      } else if (name === "company") {
        return faker.company.bs();
      } else if (name === "phone") {
        return faker.phone.number();
      } else if (name === "address") {
        return faker.address.streetAddress();
      } else if (name === "date") {
        return faker.date.past();
      } else if (name === "jobTitle") {
        return faker.name.jobTitle();
      } else if (name === "creditCardNumber") {
        return faker.finance.creditCardNumber();
      } else if (name === "currencyCode") {
        return faker.finance.currencyCode();
      } else if (name === "productName") {
        return faker.commerce.productName();
      } else if (name === "uuid") {
        return faker.datatype.uuid();
      } else {
        return faker.lorem.words(5);
      }
    case "number":
      return faker.number.int({ max: 100 });
    case "array":
      return generateFakeArray(properties);
    case "object":
      return generateFakeObject(properties);
    case "boolean":
      return faker.datatype.boolean();
    default:
      return faker.lorem.words(1);
  }
}

function generateFakeArray(properties) {
  const arrayItemsType = properties.items.type;
  return Array.from({ length: 5 }, () => {
    if (arrayItemsType === "string") {
      return faker.lorem.words(1);
    } else if (arrayItemsType === "object") {
      const itemProperties = properties.items.properties;
      return generateFakeData("object", { properties: itemProperties });
    }
  });
}

function generateFakeObject(properties) {
  const itemObject = {};
  Object.entries(properties.properties).forEach(([itemName, itemDetails]) => {
    itemObject[itemName] = generateFakeData(itemDetails.type, itemDetails, itemName);
  });
  return itemObject;
}

function generateFunctionCallArguments(requestBody) {
  const { parameters } = requestBody.functions[0];
  const argumentsObject = {};

  Object.entries(parameters.properties).forEach(([paramName, paramDetails]) => {
    argumentsObject[paramName] = generateFakeData(
      paramDetails.type,
      paramDetails
    );
  });

  return JSON.stringify(argumentsObject, null, 2);
}

module.exports = {
  getChatResponce,
};