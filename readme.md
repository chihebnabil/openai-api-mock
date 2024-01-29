# OpenAI API Mock

This is a Node.js module for mocking OpenAI API responses in a development environment. 
It's useful for testing and development purposes when you don't want to make actual API calls.
The module also supports mocking function_calling

## Installation

You can install this module using npm:

```sh
npm install openai-api-mock
```

## Usage
```js
const { mockOpenAIResponse } = require('openai-api-mock');
```
Then, call the mockOpenAIResponse function to set up the mock response:

```js
mockOpenAIResponse();
```
This function intercepts HTTP calls to the OpenAI endpoint and returns a mock response.


## Dependencies
This module depends on the following npm packages:

- nock : For intercepting HTTP calls.
- @faker-js/faker : For generating fake data.

## License
This project is licensed under the MIT License.