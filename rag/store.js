export const vectorDB = [];

let observedEmbeddingInfo = null;

export function resetVectorDB() {
  vectorDB.length = 0;
}

export function setDocuments(documents) {
  resetVectorDB();
  vectorDB.push(...documents);
}

export function hasDocuments() {
  return vectorDB.length > 0;
}

/**
 * @param {string} provider
 * @param {number} dimension
 * @returns {void}
 */
export function setObservedEmbeddingInfo(provider, dimension) {
  observedEmbeddingInfo = { provider, dimension };
}

/**
 * @returns {{ provider: string, dimension: number } | null}
 */
export function getObservedEmbeddingInfo() {
  return observedEmbeddingInfo;
}
