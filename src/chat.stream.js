import { Readable } from 'node:stream';
import { getSteamChatObject } from './utils/responseGenerators.js';

export function createChatStream(requestBody) {
  const stream = new Readable({
    read() {},
  });

  let count = 0;
  const maxCount = 5;

  function sendData() {
    setTimeout(() => {
      if (count < maxCount - 1) {
        stream.push(`data: ${getSteamChatObject(requestBody)}\n\n`);
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
