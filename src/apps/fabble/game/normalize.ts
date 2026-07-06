export function normalizeCardName(s: string): string {
	return s
		.normalize("NFD")
		.replace(/\p{M}+/gu, "") // strip combining diacritics
		.replace(/ð/gi, "d") // non-decomposable letters (ð survives NFD!)
		.replace(/ø/gi, "o")
		.replace(/æ/gi, "ae")
		.replace(/þ/gi, "th")
		.replace(/ß/gi, "ss")
		.toLowerCase()
		.replace(/['’‘`]/g, "") // apostrophes: "hunters" finds "Hunter's"
		.replace(/[^a-z0-9 ]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
