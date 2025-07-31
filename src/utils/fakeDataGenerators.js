import { faker } from '@faker-js/faker';

export function generateToolCallArguments(requestBody) {
  const { parameters } = requestBody.tools[0].function;
  const argumentsObject = {};

  Object.entries(parameters.properties).forEach(([paramName, paramDetails]) => {
    argumentsObject[paramName] = generateFakeData(paramDetails.type, paramDetails, paramName);
  });

  return JSON.stringify(argumentsObject, null, 2);
}

export function generateFunctionCallArguments(requestBody) {
  const { parameters } = requestBody.functions[0];
  const argumentsObject = {};

  Object.entries(parameters.properties).forEach(([paramName, paramDetails]) => {
    argumentsObject[paramName] = generateFakeData(paramDetails.type, paramDetails, paramName);
  });

  return JSON.stringify(argumentsObject, null, 2);
}

export function generateFakeData(type, properties, name) {
  switch (type) {
    case 'string':
      return generateFakeStringData(name);
    case 'number':
      return faker.number.int({ max: 100 });
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

export function generateFakeArray(properties) {
  const arrayItemsType = properties.items.type;
  return Array.from({ length: 5 }, () => {
    if (arrayItemsType === 'string') {
      return faker.lorem.words(1);
    } else if (arrayItemsType === 'object') {
      const itemProperties = properties.items.properties;
      return generateFakeData('object', { properties: itemProperties }, 'item');
    }
  });
}

export function generateFakeObject(properties) {
  const itemObject = {};
  Object.entries(properties.properties).forEach(([itemName, itemDetails]) => {
    itemObject[itemName] = generateFakeData(itemDetails.type, itemDetails, itemName);
  });
  return itemObject;
}

export function generateFakeStringData(name) {
  if (name === 'name') {
    return faker.person.fullName();
  } else if (name === 'email') {
    return faker.internet.email();
  } else if (name === 'price') {
    return faker.commerce.price();
  } else if (name === 'company') {
    return faker.company.name();
  } else if (name === 'phone') {
    return faker.phone.number();
  } else if (name === 'address') {
    return faker.location.streetAddress();
  } else if (name === 'date') {
    return faker.date.past();
  } else if (name === 'jobTitle') {
    return faker.person.jobTitle();
  } else if (name === 'creditCardNumber') {
    return faker.finance.creditCardNumber();
  } else if (name === 'currencyCode') {
    return faker.finance.currencyCode();
  } else if (name === 'productName') {
    return faker.commerce.productName();
  } else if (name === 'uuid') {
    return faker.string.uuid();
  } else {
    return faker.lorem.words(5);
  }
}
