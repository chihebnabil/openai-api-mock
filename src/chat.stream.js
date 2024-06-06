const { faker } = require("@faker-js/faker");
const { Readable } = require('stream');

function createChatStream() {
    const stream = new Readable({
        read() { }
    });

    let count = 0;
    const maxCount = 5;

    function sendData() {
        setTimeout(() => {
            if (count < maxCount - 1) {
                stream.push(`data: ${getSteamChatObject()}\n\n`);
                count++;
                sendData(); // Call the function recursively until the last iteration
            } else if (count === maxCount - 1) {
                stream.push(`data: [DONE]\n\n`);
                stream.push(null); // End the stream after sending the data
            }
        }, 200);
    }

    sendData(); // Start sending data

    return stream;
}

function getSteamChatObject() {
    const created = Math.floor(Date.now() / 1000);

    let lorem = faker.lorem.paragraph()
    const loremArray = lorem.split(" ");

    let ob = {
        id: `chatcmpl-${faker.string.alphanumeric(30)}`,
        object: 'chat.completion.chunk',
        created: created,
        model: "gpt-3.5-mock",
        system_fingerprint: null,
        choices: [
            {
                index: 0,
                delta: {
                    content: loremArray[0]
                },
                logprobs: null,
                finish_reason: null
            }
        ]
    }

    return JSON.stringify(ob);
}

module.exports = {
    createChatStream,
    getSteamChatObject,
};