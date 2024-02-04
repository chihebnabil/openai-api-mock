# OpenAI API Mock

This is a Node.js module for mocking OpenAI API responses in a development environment. 
It's useful for testing and development purposes when you don't want to make actual API calls.
The module also supports mocking function_calling


## Installation

You can install this module using npm as a dev dependency :

```sh
npm install -D openai-api-mock
```


## Usage
```js
const { mockOpenAIResponse } = require('openai-api-mock');
```

Then, call the mockOpenAIResponse function to set up the mock response:

```js
mockOpenAIResponse();
```
This function intercepts HTTP calls to the OpenAI endpoint and returns a mock response. The mock response is generated based on the requestBody of the code , and it supports complex (function call) requestBody structures like arrays and nested objects.

```js
mockOpenAIResponse(force = true);
```
The force parameter is a boolean that determines whether the mock response should be used regardless of the environment. 
If force is true, the mock response will be used regardless of the environment. If force is false or not provided, the mock response will only be used if the <code>NODE_ENV</code> environment variable is set to 'development'.

### Example responces

```js
// Call the mockOpenAIResponse function once to set up the mock
mockOpenAIResponse() 

// Now, when you call the OpenAI API, it will return a mock response
const response = await openai.chat.completions.create({
                model: "gpt-3.5",
                messages: [
                    { role: 'system', content: "You'r an expert chef" },
                    { role: 'user', content: "Suggest at least 5 recipes" },
                ]
});
 ```
In this example, the `response` constant will contain mock data, simulating a response from the OpenAI API:

```json
{
    choices: [
        {
          finish_reason: 'stop',
          index: 0,
          message: [Object],
          logprobs: null
        }
      ],
      created: 1707040459,
      id: 'chatcmpl-tggOnwW8Lp2XiwQ8dmHHAcNYJ8CfzR',
      model: 'gpt-3.5-mock',
      object: 'chat.completion',
      usage: { completion_tokens: 17, prompt_tokens: 57, total_tokens: 74 }
}
```


## Intercepted URLs

This module uses the `nock` library to intercept HTTP calls to the following OpenAI API endpoints:

- `https://api.openai.com/v1/chat/completions`: This endpoint is used for generating chat completions.
- `https://api.openai.com/v1/images/generations`: This endpoint is used for generating images.


## Dependencies
This module depends on the following npm packages:

- nock : For intercepting HTTP calls.
- @faker-js/faker : For generating fake data.

## License
This project is licensed under the MIT License.