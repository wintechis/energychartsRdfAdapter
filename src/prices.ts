import type { PriceResponse } from "./types.ts";
import { DataFactory, Writer } from "n3";
import { RDF_NAMESPACES } from "./config.ts";
import { mapContentTypeToFormat } from "./format-utils.ts";

const { namedNode, literal } = DataFactory;
const {
  BASE_OBSERVATION_URL,
  SOSA_NAMESPACE,
  RDF_NAMESPACE,
  XSD_NAMESPACE,
  QUDT_NAMESPACE,
  QUDT_UNIT_NAMESPACE,
  DCT_NAMESPACE,
  CC_NAMESPACE,
} = RDF_NAMESPACES;

/**
 * Converts price response to RDF
 */
export function pricesToRDF(
  response: PriceResponse,
  contentType?: string,
): Promise<string> {
  const format = mapContentTypeToFormat(contentType);

  const writer = new Writer({
    prefixes: {
      sosa: SOSA_NAMESPACE,
      rdf: RDF_NAMESPACE,
      xsd: XSD_NAMESPACE,
      qudt: QUDT_NAMESPACE,
      qudt_unit: QUDT_UNIT_NAMESPACE,
      dct: DCT_NAMESPACE,
      cc: CC_NAMESPACE,
    },
    format: format,
  });

  // Convert unix timestamps and prices to observations
  response.unix_seconds.forEach((timestamp, index) => {
    const price = response.price[index];
    const obsId = `price_${timestamp}`;
    const observationUri = namedNode(`${BASE_OBSERVATION_URL}${obsId}`);

    // Type definition for observation
    writer.addQuad(
      observationUri,
      namedNode(`${RDF_NAMESPACE}type`),
      namedNode(`${SOSA_NAMESPACE}Observation`),
    );

    // Timestamp
    writer.addQuad(
      observationUri,
      namedNode(`${SOSA_NAMESPACE}resultTime`),
      literal(
        new Date(timestamp * 1000).toISOString(),
        namedNode(`${XSD_NAMESPACE}dateTime`),
      ),
    );

    // Add attribution and license information
    writer.addQuad(
      observationUri,
      namedNode("http://purl.org/dc/terms/source"),
      namedNode("https://www.smard.de/"),
    );

    writer.addQuad(
      observationUri,
      namedNode("http://purl.org/dc/terms/license"),
      namedNode("https://creativecommons.org/licenses/by/4.0/"),
    );

    writer.addQuad(
      observationUri,
      namedNode("http://purl.org/dc/terms/creator"),
      literal("Bundesnetzagentur | SMARD.de"),
    );

    // Price value with unit conversion from EUR/MWh to EUR/kWh
    const priceInEurPerKwh = price / 1000; // Convert MWh to kWh

    writer.addQuad(
      observationUri,
      namedNode(`${SOSA_NAMESPACE}hasResult`),
      writer.blank([
        {
          predicate: namedNode(`${RDF_NAMESPACE}type`),
          object: namedNode(`${QUDT_NAMESPACE}QuantityValue`),
        },
        {
          predicate: namedNode(`${QUDT_NAMESPACE}numericValue`),
          object: literal(
            priceInEurPerKwh.toString(),
            namedNode(`${XSD_NAMESPACE}float`),
          ),
        },
        {
          predicate: namedNode(`${QUDT_NAMESPACE}unit`),
          object: namedNode(`${QUDT_UNIT_NAMESPACE}CCY_EUR-PER-KiloW-HR`),
        },
      ]),
    );
  });

  return new Promise<string>((resolve, reject) => {
    writer.end((error: Error | null, result: string | PromiseLike<string>) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}
