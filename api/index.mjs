import {handleRequest} from "../dist/server/index.js";

function requestOrigin(request) {
  const forwardedProto = String(request.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const forwardedHost = String(request.headers["x-forwarded-host"] || request.headers.host || "escritorasady.com.br").split(",")[0].trim();
  return `${forwardedProto}://${forwardedHost}`;
}

async function requestBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const chunks = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return chunks.length ? Buffer.concat(chunks) : undefined;
}

export async function vercelHandler(request, response) {
  try {
    const body = await requestBody(request);
    const webRequest = new Request(new URL(request.url || "/", requestOrigin(request)), {
      method: request.method,
      headers: request.headers,
      body,
      ...(body ? {duplex: "half"} : {}),
    });
    const webResponse = await handleRequest(webRequest, process.env);

    response.statusCode = webResponse.status;
    for (const [name, value] of webResponse.headers) response.setHeader(name, value);
    response.end(Buffer.from(await webResponse.arrayBuffer()));
  } catch (error) {
    console.error(`[vercel] Falha no adapter: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    response.statusCode = 500;
    response.setHeader("content-type", "text/plain; charset=utf-8");
    response.setHeader("cache-control", "no-store");
    response.end("Erro interno temporário.");
  }
}

export default vercelHandler;
