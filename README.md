# Energy Charts RDF Adapter

This library provides a Deno-based interface to the Energy Charts API with RDF conversion capabilities.

## Usage

This library can be used with Deno or via its REST API.

### Using the API

The REST API is available at `https://energycharts-rdf-adapter.deno.dev`.

#### Response Formats

The API supports content negotiation through the `Accept` header:

- Root endpoint (`/`): Only supports `application/json`
- Prices endpoint (`/prices`) supports:
  - `text/turtle` (default format when no specific format is requested)
  - `application/n-triples`
  - `application/n-quads`
  - `application/trig`
  - `text/n3`
  - `application/ld+json`
  - `application/json` (only when explicitly requested)

The `text/turtle` format is used as the default when no specific format is requested or when an unsupported format is specified.

#### Example Requests

To query day-ahead prices for different bidding zones:

```console
# Get prices for Austria
foo@bar:~$ curl -X GET -H "Accept: text/turtle" \
"https://energycharts-rdf-adapter.deno.dev/prices?bzn=AT"

# Get prices for France with date range
foo@bar:~$ curl -X GET -H "Accept: application/json" \
"https://energycharts-rdf-adapter.deno.dev/prices?bzn=FR&start=2024-06-01&end=2024-06-07"
```

#### Available Bidding Zones

The following bidding zones are supported:

- `AT` (Austria)
- `BE` (Belgium)
- `CH` (Switzerland)
- `CZ` (Czech Republic)
- `DE-LU` (Germany, Luxembourg) - default
- `DE-AT-LU` (Germany, Austria, Luxembourg)
- `DK1` (Denmark 1)
- `DK2` (Denmark 2)
- `FR` (France)
- `HU` (Hungary)
- `IT-North` (Italy North)
- `NL` (Netherlands)
- `NO2` (Norway 2)
- `PL` (Poland)
- `SE4` (Sweden 4)
- `SI` (Slovenia)

### Using the Library

To use the library in your own Deno project first add it via

- deno: `deno add jsr:@wintechis/energycharts-rdf-adapter`
- npm: `npx jsr add @wintechis/energycharts-rdf-adapter`
- yarn: `yarn add jsr:@wintechis/energycharts-rdf-adapter`
- pnpm: `pnpm i jsr:@wintechis/energycharts-rdf-adapter`
- bun: `bunx jsr add @wintechis/energycharts-rdf-adapter`

Then you can use the library as follows:

```typescript
import {
  energychartsClient,
  pricesToRDF,
} from "@wintechis/energycharts-rdf-adapter";

// Get day-ahead prices for Germany-Luxembourg
const prices = await energychartsClient.getPrices({
  bzn: "DE-LU",
  start: "2024-01-01",
  end: "2024-01-02",
});

// Convert prices to RDF
const rdfData = await pricesToRDF(prices);
console.log(rdfData);
```

The above code outputs the following RDF data:

```turtle
@prefix sosa: <http://www.w3.org/ns/sosa/>.
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix qudt: <http://qudt.org/1.1/schema/qudt#>.
@prefix qudt_unit: <http://qudt.org/1.1/vocab/unit#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix cc: <http://creativecommons.org/ns#>.

:price_1704067200 a sosa:Observation;
    sosa:resultTime "2024-01-01T00:00:00.000Z"^^xsd:dateTime;
    dct:source <https://www.smard.de/>;
    dct:license <https://creativecommons.org/licenses/by/4.0/>;
    dct:creator "Bundesnetzagentur | SMARD.de";
    sosa:hasResult [
        a qudt:QuantityValue;
        qudt:numericValue "0.089"^^xsd:float;
        qudt:unit qudt_unit:CCY_EUR-PER-KiloW-HR
    ].
```

## Data License

**CC BY 4.0 Licensed Data**: The data for the following bidding zones is licensed as [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) from Bundesnetzagentur | SMARD.de and is published without changes:

- AT, BE, CH, CZ, DE-LU, DE-AT-LU, DK1, DK2, FR, HU, IT-North, NL, NO2, PL, SE4, SI

**Restricted Use Data**: The data for other bidding zones is for private and internal use only. Commercial use requires licensing from the original data providers.

## Development

```
# Run tests
deno test

# Run development server with watch mode
deno task dev
```
