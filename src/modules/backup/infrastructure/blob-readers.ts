export async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
	if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
	if (typeof FileReader !== "undefined") {
		return new Promise<ArrayBuffer>((resolve, reject) => {
			const reader = new FileReader();
			reader.addEventListener("load", () => {
				if (reader.result instanceof ArrayBuffer) resolve(reader.result);
				else reject(new TypeError("No se pudo leer el archivo binario"));
			});
			reader.addEventListener("error", () => reject(reader.error));
			reader.readAsArrayBuffer(blob);
		});
	}
	return new Response(blob).arrayBuffer();
}

export async function readBlobAsText(blob: Blob): Promise<string> {
	if (typeof blob.text === "function") return blob.text();
	return new TextDecoder().decode(await readBlobAsArrayBuffer(blob));
}
