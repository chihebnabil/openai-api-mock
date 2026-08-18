/**
 * Utilities for generating deterministic embedding vectors
 */

/**
 * FNV-1a string hash (32-bit)
 * @param {string} str - String to hash
 * @returns {number} Unsigned 32-bit hash
 */
export function fnv1aHash(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 seeded PRNG
 * @param {number} seed - Seed value
 * @returns {Function} Function producing floats in [0, 1)
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a deterministic, L2-normalized unit vector for a given key
 * @param {string} key - Key to derive the vector from (same key = same vector)
 * @param {number} dimensions - Number of vector dimensions
 * @returns {number[]} Unit-length vector of floats
 */
export function deterministicVector(key, dimensions) {
  const rand = mulberry32(fnv1aHash(key));
  const vector = [];
  for (let i = 0; i < dimensions; i++) {
    vector.push(rand() * 2 - 1);
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return vector.map(value => value / norm);
}

/**
 * Encode a vector of floats as base64 (little-endian float32), like the OpenAI API
 * @param {number[]} vector - Vector of floats
 * @returns {string} Base64-encoded string
 */
export function encodeBase64Float32(vector) {
  const buffer = new ArrayBuffer(vector.length * 4);
  const view = new DataView(buffer);
  for (let i = 0; i < vector.length; i++) {
    view.setFloat32(i * 4, vector[i], true);
  }
  return Buffer.from(buffer).toString('base64');
}
