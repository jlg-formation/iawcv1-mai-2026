import { getObservedEmbeddingInfo, vectorDB } from "./store.js";

/** @type {Record<string, number>} */
const EMBEDDING_DIMENSIONS = {
  openai: 1536,
  lmstudio: 768
};

/**
 * @typedef {{ text: string, score: number, rerankScore: number }} RetrievedDocument
 */

/**
 * @param {string} id
 * @returns {HTMLElement}
 */
function getRequiredElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Élément introuvable : ${id}`);
  }

  return element;
}

/**
 * @param {string} id
 * @returns {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement}
 */
function getFieldElement(id) {
  const element = getRequiredElement(id);

  if (
    !(element instanceof HTMLInputElement) &&
    !(element instanceof HTMLTextAreaElement) &&
    !(element instanceof HTMLSelectElement)
  ) {
    throw new Error(`Champ invalide : ${id}`);
  }

  return element;
}

/**
 * @param {string} message
 * @returns {void}
 */
export function log(message) {
  const logElement = getRequiredElement("log");
  logElement.textContent += message + "\n";
}

export function clearLog() {
  getRequiredElement("log").textContent = "";
}

/**
 * @param {string} text
 * @returns {string[]}
 */
export function splitDocuments(text) {
  return text
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function getApiKey() {
  return getFieldElement("apiKey").value.trim();
}

export function getEmbeddingProvider() {
  return getFieldElement("embeddingProvider").value.trim();
}

export function getLmStudioBaseUrl() {
  return getFieldElement("lmStudioBaseUrl").value.trim();
}

export function getPineconeApiKey() {
  return getFieldElement("pineconeApiKey").value.trim();
}

export function getRawDocuments() {
  return getFieldElement("documentsInput").value;
}

export function getQuestion() {
  return getFieldElement("questionInput").value.trim();
}

export function getTopK() {
  const rawValue = Number.parseInt(getFieldElement("topKInput").value, 10);

  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 3;
}

/**
 * @param {string} answer
 * @returns {void}
 */
export function setAnswer(answer) {
  getRequiredElement("answer").textContent = answer;
}

export function updateEmbeddingDimensions() {
  const provider = getEmbeddingProvider();
  const expectedDimensions = EMBEDDING_DIMENSIONS[provider] ?? "inconnue";
  const observedEmbeddingInfo = getObservedEmbeddingInfo();
  const observedDimensions =
    observedEmbeddingInfo && observedEmbeddingInfo.provider === provider
      ? observedEmbeddingInfo.dimension
      : null;
  const label =
    provider === "lmstudio"
      ? "LM Studio / text-embedding-nomic-embed-text-v1.5"
      : "OpenAI / text-embedding-3-small";

  getRequiredElement("embeddingDimensions").textContent =
    observedDimensions === null
      ? `Dimensions attendues : ${expectedDimensions} (${label}). Dimension observée : en attente du premier embedding.`
      : `Dimensions observées : ${observedDimensions} (${label}). Attendu : ${expectedDimensions}.`;
}

export function clearRetrievedContext() {
  getRequiredElement("retrievedContext").innerHTML = "";
}

export function renderDocuments() {
  const container = getRequiredElement("documentsList");
  container.innerHTML = "";

  vectorDB.forEach((doc, index) => {
    const div = document.createElement("div");
    div.className = "document";
    div.innerHTML = `
      <strong>Document ${index + 1}</strong><br>
      ${doc.text}
    `;
    container.appendChild(div);
  });
}

/**
 * @param {RetrievedDocument[]} retrieved
 * @returns {void}
 */
export function renderRetrievedContext(retrieved) {
  const contextDiv = getRequiredElement("retrievedContext");
  contextDiv.innerHTML = "";

  retrieved.forEach((doc) => {
    const div = document.createElement("div");
    div.className = "document";
    div.innerHTML = `
      <div class="score">
        Score vectoriel : ${doc.score.toFixed(4)}
      </div>
      <div class="score">
        Score reranking : ${doc.rerankScore.toFixed(4)}
      </div>
      <div>${doc.text}</div>
    `;
    contextDiv.appendChild(div);
  });
}
