const baseUrl = process.env.DEPLOY_URL?.replace(/\/$/, "");
if (!baseUrl) throw new Error("DEPLOY_URL es obligatorio.");
const url = new URL(baseUrl);
if (url.protocol !== "https:") throw new Error("DEPLOY_URL debe usar HTTPS.");

const routes = ["/", "/sale", "/products", "/inventory", "/cash", "/sales", "/summary", "/settings"];
let shell = "";
for (const path of routes) {
	const response = await fetch(`${baseUrl}${path}`, { redirect: "error" });
	if (!response.ok || !(response.headers.get("content-type") ?? "").includes("text/html")) {
		throw new Error(`${path}: shell inválido (${response.status}).`);
	}
	if (!response.headers.get("content-security-policy")) throw new Error(`${path}: CSP ausente.`);
	if (!(response.headers.get("cache-control") ?? "").includes("max-age=0")) {
		throw new Error(`${path}: caché shell insegura.`);
	}
	if (path === "/") shell = await response.text();
}
for (const [path, type] of [
	["/manifest.webmanifest", "application/manifest+json"],
	["/sw.js", "javascript"],
	["/release.json", "application/json"],
]) {
	const response = await fetch(`${baseUrl}${path}`, { cache: "no-store" });
	if (!response.ok || !(response.headers.get("content-type") ?? "").includes(type)) {
		throw new Error(`${path}: recurso inválido (${response.status}).`);
	}
	if (!(response.headers.get("cache-control") ?? "").includes("max-age=0")) {
		throw new Error(`${path}: caché insegura.`);
	}
}
const mainAsset = shell.match(/(?:src|href)="(\/assets\/[^"']+\.(?:js|css))"/)?.[1];
if (!mainAsset) throw new Error("Shell no referencia asset principal.");
const assetResponse = await fetch(`${baseUrl}${mainAsset}`);
if (!assetResponse.ok || !(assetResponse.headers.get("cache-control") ?? "").includes("immutable")) {
	throw new Error("Asset principal no usa caché immutable.");
}
const missingAsset = await fetch(`${baseUrl}/assets/missing-bodegix-asset.js`);
if (missingAsset.status !== 404) throw new Error("Asset inexistente debe responder 404 real.");
console.log(`Smoke no destructivo OK: ${baseUrl}`);
