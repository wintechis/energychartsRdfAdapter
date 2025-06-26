import {
  Application,
  type Context,
  Router,
} from "https://deno.land/x/oak/mod.ts";
import { energychartsClient, pricesToRDF } from "./mod.ts";
import { parseAcceptHeader } from "src/format-utils.ts";

// Create application
const app = new Application();
const router = new Router();

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// CORS middleware
app.use(async (ctx, next) => {
  ctx.response.headers.set("Access-Control-Allow-Origin", "*");
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  ctx.response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept",
  );

  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204; // No content
    return;
  }

  await next();
});

/**
 * Determines response format based on Accept header priority
 * @param ctx The context containing request headers
 * @returns Format type and content type
 */
function determineResponseFormat(ctx: Context): {
  format: "json" | "rdf";
  contentType: string;
} {
  const acceptHeader = ctx.request.headers.get("Accept") || "";

  // Parse and sort media types by quality parameter
  const mediaTypes = parseAcceptHeader(acceptHeader);

  // RDF media types that N3 library supports
  const rdfMediaTypes = [
    "text/turtle",
    "application/n-triples",
    "application/n-quads",
    "application/trig",
    "text/n3",
    "application/ld+json",
  ];

  // Check each media type in priority order
  for (const mediaType of mediaTypes) {
    // Check for JSON first
    if (mediaType === "application/json") {
      return { format: "json", contentType: "application/json" };
    }

    // Then check for supported RDF formats
    if (rdfMediaTypes.includes(mediaType)) {
      return { format: "rdf", contentType: mediaType };
    }
  }

  // Default to turtle if nothing else matches
  return { format: "rdf", contentType: "text/turtle" };
}

// Price endpoint
router.get("/prices", async (ctx) => {
  try {
    const { format, contentType } = determineResponseFormat(ctx);

    // Get query parameters
    const bzn = ctx.request.url.searchParams.get("bzn") || "DE-LU";
    const start = ctx.request.url.searchParams.get("start") || "";
    const end = ctx.request.url.searchParams.get("end") || "";

    // Fetch data from energy charts API
    const response = await energychartsClient.getPrices({ bzn, start, end });

    if (format === "json") {
      ctx.response.headers.set("Content-Type", contentType);
      ctx.response.body = response;
    } else {
      // Convert to RDF
      const rdfData = await pricesToRDF(response, contentType);
      ctx.response.headers.set("Content-Type", contentType);
      ctx.response.headers.set("Vary", "Accept");
      ctx.response.body = rdfData;
    }
  } catch (error) {
    console.error("Error fetching prices:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to fetch energy price data" };
  }
});

// Add a simple status endpoint
router.get("/", (ctx) => {
  ctx.response.body = {
    status: "ok",
    service: "Energycharts RDF Adapter",
    endpoints: ["/prices"],
    version: "0.0.1",
  };
});

// Register router
app.use(router.routes());
app.use(router.allowedMethods());

// Error handling
app.addEventListener("error", (event) => {
  console.error("Server error:", event.error);
});

// Start the server
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Server running on http://localhost:${port}`);

// Start the application
await app.listen({ port });
