const nodeGraphCodeScreenRegistryLimits = Object.freeze({
  descriptionLength: 512,
  helperSourceLength: 20000,
  idLength: 64,
  languageLength: 32,
  nameLength: 96,
  pathLength: 2048,
  registryItems: 256,
  scriptLength: 40000,
  tagsLength: 160,
  targetLength: 256,
});

function normalizeNodeGraphCodeScreenText(value, maxLength = nodeGraphCodeScreenRegistryLimits.nameLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeNodeGraphCodeScreenId(value, fallback = "") {
  const id = normalizeNodeGraphCodeScreenText(value, nodeGraphCodeScreenRegistryLimits.idLength)
    .replace(/[^A-Za-z0-9_.:-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return id || fallback;
}

function normalizeNodeGraphCodeScreenLanguage(value, fallback = "javascript") {
  const language = normalizeNodeGraphCodeScreenText(value, nodeGraphCodeScreenRegistryLimits.languageLength)
    .replace(/[^A-Za-z0-9_+#.-]+/g, "")
    .toLowerCase();
  return language || fallback;
}

function normalizeNodeGraphCodeScreenRegistry(list, normalizer) {
  if (!Array.isArray(list)) {
    return [];
  }
  const used = new Set();
  const items = [];
  for (const value of list.slice(0, nodeGraphCodeScreenRegistryLimits.registryItems)) {
    const item = normalizer(value, items.length + 1);
    if (!item?.id || used.has(item.id)) {
      continue;
    }
    used.add(item.id);
    items.push(item);
  }
  return items;
}

function normalizeNodeGraphCodeScreenHelper(value = {}, index = 1) {
  const source = value && typeof value === "object" ? value : {};
  const id = normalizeNodeGraphCodeScreenId(source.id, `helper-${index}`);
  const updatedAt = normalizeNodeGraphCodeScreenText(source.updatedAt, 48);
  return {
    category: normalizeNodeGraphCodeScreenText(source.category, 64),
    description: normalizeNodeGraphCodeScreenText(
      source.description,
      nodeGraphCodeScreenRegistryLimits.descriptionLength,
    ),
    id,
    language: normalizeNodeGraphCodeScreenLanguage(source.language || source.highlight || "javascript"),
    name: normalizeNodeGraphCodeScreenText(source.name, nodeGraphCodeScreenRegistryLimits.nameLength) || id,
    namespace: normalizeNodeGraphCodeScreenText(source.namespace, 32).replace(/\.+$/g, ""),
    source: String(source.source ?? "").slice(0, nodeGraphCodeScreenRegistryLimits.helperSourceLength),
    signature: normalizeNodeGraphCodeScreenText(source.signature, 160),
    tags: normalizeNodeGraphCodeScreenText(source.tags, nodeGraphCodeScreenRegistryLimits.tagsLength),
    ...(updatedAt ? { updatedAt } : {}),
  };
}

function normalizeNodeGraphCodeScreenSample(value = {}, index = 1) {
  const source = value && typeof value === "object" ? value : {};
  const id = normalizeNodeGraphCodeScreenId(source.id, `sample-${index}`);
  return {
    description: normalizeNodeGraphCodeScreenText(
      source.description,
      nodeGraphCodeScreenRegistryLimits.descriptionLength,
    ),
    id,
    name: normalizeNodeGraphCodeScreenText(source.name, nodeGraphCodeScreenRegistryLimits.nameLength) || id,
    path: normalizeNodeGraphCodeScreenText(source.path, nodeGraphCodeScreenRegistryLimits.pathLength),
  };
}

function normalizeNodeGraphCodeScreenSlot(value = {}, index = 1) {
  const source = value && typeof value === "object" ? value : {};
  const workflow = normalizeNodeGraphCodeScreenText(source.workflow || "workflow", 64);
  const area = normalizeNodeGraphCodeScreenText(source.area || source.sampleArea, nodeGraphCodeScreenRegistryLimits.nameLength);
  const slot = normalizeNodeGraphCodeScreenText(source.slot, 64);
  const id = normalizeNodeGraphCodeScreenId(source.id, `slot-${index}`);
  return {
    area,
    circuit: source.circuit && typeof source.circuit === "object" ? JSON.parse(JSON.stringify(source.circuit)) : null,
    description: normalizeNodeGraphCodeScreenText(
      source.description,
      nodeGraphCodeScreenRegistryLimits.descriptionLength,
    ),
    id,
    name: normalizeNodeGraphCodeScreenText(source.name, nodeGraphCodeScreenRegistryLimits.nameLength) || id,
    runtime: normalizeNodeGraphCodeScreenText(source.runtime || "metadata only", 64),
    slot,
    workflow,
  };
}

function normalizeNodeGraphCodeScreenUiSetting(value = {}, index = 1) {
  const source = value && typeof value === "object" ? value : {};
  const id = normalizeNodeGraphCodeScreenId(source.id, `ui-setting-${index}`);
  return {
    description: normalizeNodeGraphCodeScreenText(
      source.description,
      nodeGraphCodeScreenRegistryLimits.descriptionLength,
    ),
    id,
    name: normalizeNodeGraphCodeScreenText(source.name, nodeGraphCodeScreenRegistryLimits.nameLength) || id,
    target: normalizeNodeGraphCodeScreenText(source.target, nodeGraphCodeScreenRegistryLimits.targetLength),
    value: normalizeNodeGraphCodeScreenText(source.value, nodeGraphCodeScreenRegistryLimits.targetLength),
  };
}

function normalizeNodeGraphCodeScreenPatchTool(value = {}, index = 1) {
  const source = value && typeof value === "object" ? value : {};
  const id = normalizeNodeGraphCodeScreenId(source.id, `patch-tool-${index}`);
  return {
    description: normalizeNodeGraphCodeScreenText(
      source.description,
      nodeGraphCodeScreenRegistryLimits.descriptionLength,
    ),
    id,
    name: normalizeNodeGraphCodeScreenText(source.name, nodeGraphCodeScreenRegistryLimits.nameLength) || id,
    target: normalizeNodeGraphCodeScreenText(source.target, nodeGraphCodeScreenRegistryLimits.targetLength),
  };
}

function normalizeNodeGraphCodeScreen(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  return {
    helpers: normalizeNodeGraphCodeScreenRegistry(source.helpers, normalizeNodeGraphCodeScreenHelper),
    patchTools: normalizeNodeGraphCodeScreenRegistry(source.patchTools, normalizeNodeGraphCodeScreenPatchTool),
    samples: normalizeNodeGraphCodeScreenRegistry(source.samples, normalizeNodeGraphCodeScreenSample),
    script: String(source.script ?? "").slice(0, nodeGraphCodeScreenRegistryLimits.scriptLength),
    scriptLanguage: normalizeNodeGraphCodeScreenLanguage(source.scriptLanguage || source.language || "javascript"),
    slots: normalizeNodeGraphCodeScreenRegistry(source.slots, normalizeNodeGraphCodeScreenSlot),
    ui: normalizeNodeGraphCodeScreenRegistry(source.ui, normalizeNodeGraphCodeScreenUiSetting),
  };
}
