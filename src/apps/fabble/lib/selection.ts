// Runtime selection functions (cyrb53, weightedSelect, computeSuppressionSet,
// selectDaily) have been moved to the Cloudflare Worker. The client no longer
// computes the daily card — it receives it via the Worker's reveal payload.

export interface SelectionList {
	month: string; // "YYYY-MM"
	generatedAt: string; // ISO 8601
	cards: string[]; // card names in the curated selection
}
