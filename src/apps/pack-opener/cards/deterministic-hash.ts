/** Hashes a string to a stable, non-negative integer index into a
 * fixed-length pool — deterministic per input, so the same drawn card
 * always resolves to the same pick (name, pitch, real-card selection, etc)
 * rather than re-randomizing on every render. */
export function hashToIndex(id: string, length: number): number {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	return Math.abs(hash) % length;
}
