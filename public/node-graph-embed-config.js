// Lets whatever embeds this sandbox (an iframe on another site, a different
// mount path, etc.) override a handful of boot-time choices -- which patch
// loads as the default, which resource manifest backs it -- without hand-
// patching files inside public/ after every pull from upstream. Two knobs,
// checked in this order:
//   1. a query param on the page URL (?defaultPreset=..., ?resourcesManifest=...)
//   2. ./embed-config.json, a small file sibling to index.html that survives
//      a hard-replace of the public/ folder since it lives outside it
// Neither present -> null, and the caller falls back to its own built-in
// default. This file has no opinion on what those defaults are.
const nodeGraphEmbedConfigUrl = "./embed-config.json";
let nodeGraphEmbedConfigPromise = null;

async function nodeGraphLoadEmbedConfig() {
  if (!nodeGraphEmbedConfigPromise) {
    nodeGraphEmbedConfigPromise = fetch(nodeGraphEmbedConfigUrl, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null)
      .then((config) => (config && typeof config === "object" ? config : {}));
  }
  return nodeGraphEmbedConfigPromise;
}

async function nodeGraphResolveEmbedOverride(configKey, queryParam) {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const fromQuery = params.get(queryParam);
    if (fromQuery && fromQuery.trim()) {
      return fromQuery.trim();
    }
  } catch {
    // Ignore: fall through to the config file.
  }
  const config = await nodeGraphLoadEmbedConfig();
  const fromConfig = config?.[configKey];
  return typeof fromConfig === "string" && fromConfig.trim() ? fromConfig.trim() : null;
}
