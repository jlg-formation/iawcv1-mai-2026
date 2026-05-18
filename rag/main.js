import { askQuestion, indexDocuments } from "./rag.js";
import { updateEmbeddingDimensions } from "./ui.js";

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

function bindEvents() {
  getRequiredElement("indexBtn").addEventListener("click", indexDocuments);
  getRequiredElement("askBtn").addEventListener("click", askQuestion);
  getRequiredElement("embeddingProvider").addEventListener(
    "change",
    updateEmbeddingDimensions
  );
}

bindEvents();
updateEmbeddingDimensions();
