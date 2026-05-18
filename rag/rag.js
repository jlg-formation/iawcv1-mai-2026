import { askLLM, createEmbedding, rerankDocuments } from "./api.js";
import {
  hasDocuments,
  setDocuments,
  setObservedEmbeddingInfo,
  vectorDB
} from "./store.js";
import {
  clearLog,
  getApiKey,
  getEmbeddingProvider,
  getLmStudioBaseUrl,
  getPineconeApiKey,
  getQuestion,
  getRawDocuments,
  getTopK,
  log,
  renderDocuments,
  renderRetrievedContext,
  setAnswer,
  splitDocuments,
  updateEmbeddingDimensions
} from "./ui.js";

/**
 * @typedef {{ text: string, embedding: number[] }} StoredDocument
 * @typedef {StoredDocument & { score: number }} ScoredDocument
 * @typedef {ScoredDocument & { rerankScore: number }} RerankedDocument
 * @typedef {{ provider: string, apiKey: string, baseUrl: string }} EmbeddingConfig
 */

/**
 * @returns {EmbeddingConfig}
 */
function getEmbeddingConfig() {
  return {
    provider: getEmbeddingProvider(),
    apiKey: getApiKey(),
    baseUrl: getLmStudioBaseUrl()
  };
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * @param {EmbeddingConfig} embeddingConfig
 * @param {number[]} embedding
 * @returns {void}
 */
function captureObservedEmbeddingDimension(embeddingConfig, embedding) {
  setObservedEmbeddingInfo(embeddingConfig.provider, embedding.length);
  updateEmbeddingDimensions();
}

export async function indexDocuments() {
  try {
    const embeddingConfig = getEmbeddingConfig();

    if (embeddingConfig.provider === "openai" && !embeddingConfig.apiKey) {
      alert("Veuillez entrer une clé API OpenAI");
      return;
    }

    clearLog();

    const docs = splitDocuments(getRawDocuments());

    log("Début indexation...");
    log(`Nombre de documents : ${docs.length}`);
    log(`Provider embeddings : ${embeddingConfig.provider}`);

    const indexedDocs = [];

    for (const doc of docs) {
      log(`Embedding : "${doc}"`);
      const embedding = await createEmbedding(embeddingConfig, doc);
      captureObservedEmbeddingDimension(embeddingConfig, embedding);
      indexedDocs.push({ text: doc, embedding });
    }

    setDocuments(indexedDocs);
    renderDocuments();
    log("Indexation terminée.");
  } catch (error) {
    console.error(error);
    alert(
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue"
    );
  }
}

/**
 * @param {EmbeddingConfig} embeddingConfig
 * @param {string} question
 * @param {number} topK
 * @returns {Promise<ScoredDocument[]>}
 */
async function searchDocuments(embeddingConfig, question, topK) {
  log("Création embedding question...");
  const questionEmbedding = await createEmbedding(embeddingConfig, question);
  captureObservedEmbeddingDimension(embeddingConfig, questionEmbedding);

  log("Calcul similarités cosinus...");
  const scored = vectorDB.map((doc) => ({
    ...doc,
    score: cosineSimilarity(questionEmbedding, doc.embedding)
  }));

  scored.sort((left, right) => right.score - left.score);
  return scored.slice(0, Math.min(Math.max(topK * 3, topK), scored.length));
}

/**
 * @param {string} pineconeApiKey
 * @param {string} question
 * @param {ScoredDocument[]} documents
 * @param {number} topK
 * @returns {Promise<RerankedDocument[]>}
 */
async function rerankRetrievedDocuments(
  pineconeApiKey,
  question,
  documents,
  topK
) {
  log("Reranking Pinecone...");

  const reranked = await rerankDocuments(
    pineconeApiKey,
    question,
    documents.map((doc, index) => ({
      id: `doc-${index}`,
      text: doc.text
    })),
    Math.min(topK, documents.length)
  );

  return reranked.map((item) => {
    const original = documents[item.index];

    return {
      ...original,
      rerankScore: item.score
    };
  });
}

export async function askQuestion() {
  try {
    const apiKey = getApiKey();
    const embeddingConfig = getEmbeddingConfig();
    const pineconeApiKey = getPineconeApiKey();
    const question = getQuestion();
    const topK = getTopK();

    if (embeddingConfig.provider === "openai" && !embeddingConfig.apiKey) {
      alert("Veuillez entrer une clé API OpenAI");
      return;
    }

    if (!question) {
      alert("Veuillez poser une question");
      return;
    }

    if (!pineconeApiKey) {
      alert("Veuillez entrer une clé API Pinecone");
      return;
    }

    if (!hasDocuments()) {
      alert("Veuillez indexer les documents");
      return;
    }

    log("\n===================================");
    log("QUESTION UTILISATEUR");
    log(question);
    log(`Top K : ${topK}`);
    log(`Provider embeddings : ${embeddingConfig.provider}`);

    const retrieved = await searchDocuments(embeddingConfig, question, topK);
    const reranked = await rerankRetrievedDocuments(
      pineconeApiKey,
      question,
      retrieved,
      topK
    );

    renderRetrievedContext(reranked);

    const context = reranked.map((doc) => doc.text).join("\n");

    log("\nCONTEXTE RETROUVÉ");
    log(context);
    log("\nAppel du LLM...");

    const answer = await askLLM(apiKey, context, question);
    setAnswer(answer);

    log("\nRÉPONSE GÉNÉRÉE");
    log(answer);
  } catch (error) {
    console.error(error);
    alert(
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue"
    );
  }
}
