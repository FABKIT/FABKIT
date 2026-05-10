export async function compressJSON(json: string): Promise<Blob> {
	const stream = new CompressionStream("gzip");
	const writer = stream.writable.getWriter();
	writer.write(new TextEncoder().encode(json));
	writer.close();
	return new Response(stream.readable).blob();
}

export async function decompressFile(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
		const stream = new DecompressionStream("gzip");
		return new Response(new Blob([buffer]).stream().pipeThrough(stream)).text();
	}
	return new TextDecoder().decode(buffer);
}
