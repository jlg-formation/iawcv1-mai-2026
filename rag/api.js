/**
 * @param {{ provider: string, apiKey: string, baseUrl: string }} config
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function createEmbedding(config, text) {
  const endpoint =
    config.provider === "lmstudio"
      ? `${config.baseUrl.replace(/\/$/, "")}/embeddings`
      : "https://api.openai.com/v1/embeddings";

  const headers = {
    "Content-Type": "application/json"
  };

  if (config.provider !== "lmstudio") {
    /** @type {Record<string, string>} */
    const typedHeaders = headers;
    typedHeaders.Authorization = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model:
        config.provider === "lmstudio"
          ? "text-embedding-nomic-embed-text-v1.5"
          : "text-embedding-3-small",
      input: text
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data.data[0].embedding;
}

/**
 * @param {string} apiKey
 * @param {string} context
 * @param {string} question
 * @returns {Promise<string>}
 */
export async function askLLM(apiKey, context, question) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Tu réponds uniquement à partir du contexte fourni."
        },
        {
          role: "user",
          content: `\nContexte :\n${context}\n\nQuestion :\n${question}\n          `
        }
      ],
      temperature: 0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data.choices[0].message.content;
}

/**
 * @param {string} pineconeApiKey
 * @param {string} query
 * @param {{ id: string, text: string }[]} documents
 * @param {number} topN
 * @returns {Promise<Array<{ index: number, score: number, document?: { id: string, text: string } }>>}
 */
export async function rerankDocuments(pineconeApiKey, query, documents, topN) {
  const response = await fetch("https://api.pinecone.io/rerank", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": pineconeApiKey,
      "X-Pinecone-API-Version": "2025-04"
    },
    body: JSON.stringify({
      model: "bge-reranker-v2-m3",
      query,
      documents,
      top_n: topN,
      return_documents: true,
      parameters: {
        truncate: "END"
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data.data;
}
