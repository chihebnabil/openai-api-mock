const nock = require('nock');
const { getChatResponce } = require('./src/chat.js');
const { getImageResponce } = require('./src/image.js');

function mockOpenAIResponse(force = false) {
    // Define the OpenAI endpoints
    const openaiCompletionEndpoint = 'https://api.openai.com/v1/chat/completions';
    const imageEndpoint = 'https://api.openai.com/v1/images/generations';
    var env = process.env.NODE_ENV || 'development';

    // Intercept the HTTP call and return the mock response
    if (env === 'development' || force) {
        nock(openaiCompletionEndpoint)
            .post('')
            .reply(function (uri, requestBody) {
                return [200, getChatResponce(requestBody)];
            });

        nock(imageEndpoint)
            .post('')
            .reply(function (uri, requestBody) {
                return [200, getImageResponce(requestBody)];
            });

        // Mocking only the chat completion endpoint, not blocking other requests
        nock.emitter.on('no match', function (req) {
            nock.enableNetConnect(req);
        });
    }
}

function stopMocking() {
    nock.cleanAll();
}

module.exports = {
    mockOpenAIResponse,
    stopMocking
};