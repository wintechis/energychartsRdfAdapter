import { assert, assertEquals, assertExists } from "jsr:@std/assert";
import { pricesToRDF } from "../src/prices.ts";

// Mock data for testing
const mockPriceResponse = {
  license_info: "CC BY 4.0",
  unix_seconds: [1704067200, 1704070800, 1704074400], // 2024-01-01 00:00, 01:00, 02:00 UTC
  price: [89.5, 92.3, 85.1], // EUR/MWh
  unit: "EUR/MWh",
  deprecated: false,
};

Deno.test("RDF conversion - should convert energy prices to RDF", async () => {
  const rdf = await pricesToRDF(mockPriceResponse);

  assertExists(rdf);
  assertEquals(typeof rdf, "string");

  // Test that the RDF contains expected triples
  const expectedStrings = [
    // Observation URIs
    `<https://energy-charts.info/observation/price_1704067200>`,
    `<https://energy-charts.info/observation/price_1704070800>`,
    `<https://energy-charts.info/observation/price_1704074400>`,

    // Type declarations
    `sosa:Observation`,

    // Timestamps
    `"2024-01-01T00:00:00.000Z"^^xsd:dateTime`,
    `"2024-01-01T01:00:00.000Z"^^xsd:dateTime`,
    `"2024-01-01T02:00:00.000Z"^^xsd:dateTime`,

    // Attribution
    `dct:source <https://www.smard.de/>`,
    `dct:license <https://creativecommons.org/licenses/by/4.0/>`,
    `dct:creator "Bundesnetzagentur | SMARD.de"`,

    // Price values (converted from EUR/MWh to EUR/kWh)
    `"0.0895"^^xsd:float`, // 89.5 / 1000
    `"0.0923"^^xsd:float`, // 92.3 / 1000
    `"0.0851"^^xsd:float`, // 85.1 / 1000

    // Unit
    `qudt_unit:CCY_EUR-PER-KiloW-HR`,

    // Quantity value type
    `qudt:QuantityValue`,
  ];

  for (const expected of expectedStrings) {
    assert(rdf.includes(expected), `RDF should contain ${expected}`);
  }
});

Deno.test("RDF conversion - should handle empty price data", async () => {
  const emptyResponse = {
    license_info: "CC BY 4.0",
    unix_seconds: [],
    price: [],
    unit: "EUR/MWh",
    deprecated: false,
  };

  const rdf = await pricesToRDF(emptyResponse);

  assertExists(rdf);
  assertEquals(typeof rdf, "string");

  // Should still contain prefixes but no observation data
  assert(rdf.includes("@prefix sosa:"));
  assert(rdf.includes("@prefix dct:"));
  assert(!rdf.includes("price_"));
});

Deno.test("RDF conversion - should handle different content types", async () => {
  const rdfTurtle = await pricesToRDF(mockPriceResponse, "text/turtle");
  const rdfNTriples = await pricesToRDF(
    mockPriceResponse,
    "application/n-triples",
  );

  assertExists(rdfTurtle);
  assertExists(rdfNTriples);

  // Turtle should have prefixes
  assert(rdfTurtle.includes("@prefix"));

  // N-Triples should have full URIs
  assert(rdfNTriples.includes("http://www.w3.org/ns/sosa/Observation"));
});

Deno.test("RDF conversion - should convert units correctly", async () => {
  const singlePriceResponse = {
    license_info: "CC BY 4.0",
    unix_seconds: [1704067200],
    price: [100.0], // 100 EUR/MWh
    unit: "EUR/MWh",
    deprecated: false,
  };

  const rdf = await pricesToRDF(singlePriceResponse);

  // Should convert 100 EUR/MWh to 0.1 EUR/kWh
  assert(rdf.includes(`"0.1"^^xsd:float`));
  assert(rdf.includes("qudt_unit:CCY_EUR-PER-KiloW-HR"));
});
