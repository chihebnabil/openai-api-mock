const nock = require('nock');
const { getChatResponce } = require('./src/chat.js');
const { getImageResponce } = require('./src/image.js');

const OPEN_AI_BASE_URL = 'https://api.openai.com';
const CHAT_COMPLETIONS_ENDPOINT = '/v1/chat/completions';
const IMAGE_GENERATIONS_ENDPOINT = '/v1/images/generations';

function mockOpenAIResponse(force = false) {
    var env = process.env.NODE_ENV || 'development';
    // Intercept the HTTP call and return the mock response
    if (env === 'development' || force) {
        nock(OPEN_AI_BASE_URL)
            .post(CHAT_COMPLETIONS_ENDPOINT)
            .reply(function (uri, requestBody) {
                return [200, getChatResponce(requestBody)];
            });

        nock(OPEN_AI_BASE_URL)
            .post(IMAGE_GENERATIONS_ENDPOINT)
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
    stopMocking,
};