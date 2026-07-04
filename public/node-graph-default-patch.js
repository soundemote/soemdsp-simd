function createNodeGraphPatchNode(type, options = {}) {
  const node = {
    gx: Number.isFinite(Number(options.gx)) ? Number(options.gx) : 0,
    gy: Number.isFinite(Number(options.gy)) ? Number(options.gy) : 0,
    id: String(options.id || type),
    paramMeta: nodeGraphDefaultParamMetaForType(type),
    params: nodeGraphDefaultParamsForType(type),
    type,
  };
  if (Object.hasOwn(options, "widthGu")) {
    node.widthGu = normalizeNodeGraphModuleWidthUnits(type, options.widthGu);
  }
  const alias = normalizeNodeGraphPatchNodeAlias(options.alias);
  if (alias) {
    node.alias = alias;
  }
  const ui = nodeGraphModuleDefinitions[type]?.layout === "textBox" && !Object.hasOwn(options, "ui")
    ? { buttonsHidden: true }
    : normalizeNodeGraphPatchNodeUi(options.ui);
  if (ui.buttonsHidden || ui.titleHidden) {
    node.ui = ui;
  }
  if (nodeGraphModuleDefinitions[type]?.layout === "textBox") {
    node.layout = normalizeNodeGraphTextBoxLayout(options.layout);
  } else if (nodeGraphModuleDefinitions[type]?.layout === "image") {
    node.layout = normalizeNodeGraphImageLayout(options.layout);
  } else if (nodeGraphModuleDefinitions[type]?.layout === "led") {
    node.led = normalizeNodeGraphLedLayout(options.led);
  }
  if (nodeGraphModuleIsGraphType(type)) {
    node.graph = normalizeNodeGraphGraph(options.graph);
  }
  if (type === "codeblock") {
    node.codeblock = normalizeNodeGraphCodeblock(options.codeblock);
  }
  if (type === "canvas") {
    node.canvasScript = normalizeNodeGraphCanvasScript(options.canvasScript);
  }
  if (type === "screenSpaceShader") {
    node.screenSpaceShader = normalizeNodeGraphScreenSpaceShader(options.screenSpaceShader);
  }
  if (Object.hasOwn(options, "scopeShader")) {
    node.scopeShader = normalizeNodeGraphScopeShader(options.scopeShader);
  }
  if (type === "moduleGroup") {
    node.moduleGroup = normalizeNodeGraphModuleGroup(options.moduleGroup);
  }
  if (type === "clapPlugin") {
    node.clap = normalizeNodeGraphClapPluginBinding(options.clap);
  }
  return node;
}

const nodeGraphDefaultNodeConfigs = Object.freeze([
  {
    ...createNodeGraphPatchNode("audioPlayer", { id: "audioPlayer-1", gx: 1, gy: 1, widthGu: 8 }),
    params: { ...nodeGraphDefaultParamsForType("audioPlayer"), speed: 1, transport: 4 },
  },
  {
    ...createNodeGraphPatchNode("output", { id: "output", gx: 12, gy: 5 }),
    params: { ...nodeGraphDefaultParamsForType("output"), volume: 0.8 },
  },
]);

const nodeGraphDefaultConnections = Object.freeze([
  { sourceNode: "audioPlayer-1", sourcePort: "Left", destinationNode: "output", destinationPort: "Left" },
  { sourceNode: "audioPlayer-1", sourcePort: "Right", destinationNode: "output", destinationPort: "Right" },
]);

const nodeGraphDefaultPatch = Object.freeze({
  activeCameraId: "camera-1",
  audio: {
    targetSampleRate: 44100,
  },
  bypassedNodes: [],
  cameras: [
    {
      color: "#ff3333",
      enabled: true,
      height: 489,
      id: "camera-1",
      midiTrigger: null,
      name: "Camera 1",
      resolutionHeight: 1080,
      resolutionWidth: 1920,
      width: 868,
      x: 0,
      y: 0,
    },
  ],
  info: {
    author: "",
    description: "",
    name: "Init",
    tags: "",
  },
  visual: {
    background: {
      h: 210,
      l: 5,
      s: 0,
    },
    mode: "auto",
    scale: 1,
    style: "glow",
    theme: "cyan-violet",
    trail: 0.35,
  },
  timing: {
    tempoBpm: 120,
    timeSignatureDenominator: 4,
    timeSignatureNumerator: 4,
  },
  windows: {
    metadata: { left: null, top: null },
    moduleActions: { left: null, top: null },
  },
  grid: { ...nodeGraphGrid },
  view: { widthGu: 20, heightGu: 20, zoom: 1 },
  nodes: nodeGraphDefaultNodeConfigs.map((node) => ({ ...node })),
  connections: nodeGraphDefaultConnections.map((connection) => ({ ...connection })),
  graphConnections: [],
  modulations: [],
  monitors: [],
  requiredAssets: [],
  samples: [],
  uiItems: [],
});
