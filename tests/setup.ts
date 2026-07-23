import "fake-indexeddb/auto";

// Define globals normally injected by Vite so they are available during tests.
(globalThis as Record<string, unknown>).__APP_VERSION__ = "0.0.0-test";

// Minimal FileReader polyfill — Bun's test runtime doesn't implement it, but
// card-storage.ts's blobToBase64 (via @fabkit/shared/blob) relies on
// readAsDataURL for gallery/card export. Only the subset used there is implemented.
if (typeof (globalThis as Record<string, unknown>).FileReader === "undefined") {
	class FileReaderPolyfill {
		result: string | null = null;
		onloadend: (() => void) | null = null;
		onerror: ((error: unknown) => void) | null = null;

		async readAsDataURL(blob: Blob): Promise<void> {
			try {
				const buffer = await blob.arrayBuffer();
				const base64 = Buffer.from(buffer).toString("base64");
				this.result = `data:${blob.type || "application/octet-stream"};base64,${base64}`;
				this.onloadend?.();
			} catch (error) {
				this.onerror?.(error);
			}
		}
	}

	(globalThis as Record<string, unknown>).FileReader = FileReaderPolyfill;
}
