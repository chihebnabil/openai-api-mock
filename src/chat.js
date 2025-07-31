import {
  createDefaultResponse,
  createFunctionCallingResponse,
} from './utils/responseGenerators.js';

export function getChatResponce(requestBody) {
  const created = Math.floor(Date.now() / 1000);

  if (!requestBody.functions && !requestBody.tools) {
    return createDefaultResponse(created);
  }

  return createFunctionCallingResponse(requestBody, created);
}
