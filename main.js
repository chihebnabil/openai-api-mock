const nock = require('nock');
const { getResponce } = require('./src/responce.js');

function mockOpenAIResponse(force = false) {
    // Define the OpenAI endpoint
    const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';
    var env = process.env.NODE_ENV || 'development'
    // Intercept the HTTP call and return the mock response
    if (env === 'development' || force) {
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
