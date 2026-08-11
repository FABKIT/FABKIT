export function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

export async function base64ToBlob(base64: string): Promise<Blob> {
	const response = await fetch(base64);
	return response.blob();
}
