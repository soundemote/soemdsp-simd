const nodeGraphColorStandards = Object.freeze({
  ZRGBA: "ZRGBA",
  Chroma: "Chroma",
  HLSA: "HLSA",
});

const nodeGraphOfficialColorStandards = Object.freeze([
  nodeGraphColorStandards.ZRGBA,
  nodeGraphColorStandards.Chroma,
  nodeGraphColorStandards.HLSA,
]);

function nodeGraphClampColorUnit(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, number));
}

function nodeGraphWrapColorHue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return ((number % 1) + 1) % 1;
}

function nodeGraphNormalizeColorSpace(space) {
  const value = String(space || "ZRGBA").trim().toLowerCase();
  if (value === "rgba" || value === "zrgba") {
    return nodeGraphColorStandards.ZRGBA;
  }
  if (value === "chroma") {
    return nodeGraphColorStandards.Chroma;
  }
  if (value === "hlsa" || value === "hsla" || value === "hsl") {
    return nodeGraphColorStandards.HLSA;
  }
  return nodeGraphColorStandards.ZRGBA;
}

function nodeGraphNormalizeZrgba(color = {}) {
  const source = Array.isArray(color)
    ? { r: color[0], g: color[1], b: color[2], a: color[3], z: color[4] }
    : color || {};
  return {
    space: nodeGraphColorStandards.ZRGBA,
    z: Number.isFinite(Number(source.z ?? source.signal)) ? Number(source.z ?? source.signal) : 0,
    r: nodeGraphClampColorUnit(source.r ?? source.red),
    g: nodeGraphClampColorUnit(source.g ?? source.green),
    b: nodeGraphClampColorUnit(source.b ?? source.blue),
    a: nodeGraphClampColorUnit(source.a ?? source.alpha, 1),
  };
}

function nodeGraphNormalizeHlsa(color = {}) {
  const source = Array.isArray(color)
    ? { h: color[0], l: color[1], s: color[2], a: color[3], z: color[4] }
    : color || {};
  return {
    space: nodeGraphColorStandards.HLSA,
    z: Number.isFinite(Number(source.z ?? source.signal)) ? Number(source.z ?? source.signal) : 0,
    h: nodeGraphWrapColorHue(source.h ?? source.hue),
    l: nodeGraphClampColorUnit(source.l ?? source.light ?? source.lightness),
    s: nodeGraphClampColorUnit(source.s ?? source.saturation),
    a: nodeGraphClampColorUnit(source.a ?? source.alpha, 1),
  };
}

function nodeGraphNormalizeChroma(color = {}) {
  const source = Array.isArray(color)
    ? { h: color[0], c: color[1], l: color[2], a: color[3], z: color[4] }
    : color || {};
  return {
    space: nodeGraphColorStandards.Chroma,
    z: Number.isFinite(Number(source.z ?? source.signal)) ? Number(source.z ?? source.signal) : 0,
    h: nodeGraphWrapColorHue(source.h ?? source.hue),
    c: nodeGraphClampColorUnit(source.c ?? source.chroma ?? source.saturation),
    l: nodeGraphClampColorUnit(source.l ?? source.light ?? source.lightness, 0.5),
    a: nodeGraphClampColorUnit(source.a ?? source.alpha, 1),
  };
}

function nodeGraphHlsaToZrgba(color = {}) {
  const hlsa = nodeGraphNormalizeHlsa(color);
  if (hlsa.s <= 0) {
    return {
      space: nodeGraphColorStandards.ZRGBA,
      z: hlsa.z,
      r: hlsa.l,
      g: hlsa.l,
      b: hlsa.l,
      a: hlsa.a,
    };
  }
  const q = hlsa.l < 0.5 ? hlsa.l * (1 + hlsa.s) : hlsa.l + hlsa.s - hlsa.l * hlsa.s;
  const p = 2 * hlsa.l - q;
  const channel = (offset) => {
    let t = hlsa.h + offset;
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  };
  return nodeGraphNormalizeZrgba({
    z: hlsa.z,
    r: channel(1 / 3),
    g: channel(0),
    b: channel(-1 / 3),
    a: hlsa.a,
  });
}

function nodeGraphZrgbaToHlsa(color = {}) {
  const zrgba = nodeGraphNormalizeZrgba(color);
  const max = Math.max(zrgba.r, zrgba.g, zrgba.b);
  const min = Math.min(zrgba.r, zrgba.g, zrgba.b);
  const l = (max + min) / 2;
  if (max === min) {
    return nodeGraphNormalizeHlsa({ z: zrgba.z, h: 0, l, s: 0, a: zrgba.a });
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === zrgba.r) {
    h = (zrgba.g - zrgba.b) / d + (zrgba.g < zrgba.b ? 6 : 0);
  } else if (max === zrgba.g) {
    h = (zrgba.b - zrgba.r) / d + 2;
  } else {
    h = (zrgba.r - zrgba.g) / d + 4;
  }
  return nodeGraphNormalizeHlsa({ z: zrgba.z, h: h / 6, l, s, a: zrgba.a });
}

function nodeGraphChromaToHlsa(color = {}) {
  const chroma = nodeGraphNormalizeChroma(color);
  return nodeGraphNormalizeHlsa({
    z: chroma.z,
    h: chroma.h,
    l: chroma.l,
    s: chroma.c,
    a: chroma.a,
  });
}

function nodeGraphHlsaToChroma(color = {}) {
  const hlsa = nodeGraphNormalizeHlsa(color);
  return nodeGraphNormalizeChroma({
    z: hlsa.z,
    h: hlsa.h,
    c: hlsa.s,
    l: hlsa.l,
    a: hlsa.a,
  });
}

function nodeGraphChromaToZrgba(color = {}) {
  return nodeGraphHlsaToZrgba(nodeGraphChromaToHlsa(color));
}

function nodeGraphZrgbaToChroma(color = {}) {
  return nodeGraphHlsaToChroma(nodeGraphZrgbaToHlsa(color));
}

function nodeGraphConvertColor(color = {}, from = "ZRGBA", to = "ZRGBA") {
  const source = nodeGraphNormalizeColorSpace(from);
  const target = nodeGraphNormalizeColorSpace(to);
  let zrgba = color;
  if (source === nodeGraphColorStandards.HLSA) {
    zrgba = nodeGraphHlsaToZrgba(color);
  } else if (source === nodeGraphColorStandards.Chroma) {
    zrgba = nodeGraphChromaToZrgba(color);
  } else {
    zrgba = nodeGraphNormalizeZrgba(color);
  }
  if (target === nodeGraphColorStandards.HLSA) {
    return nodeGraphZrgbaToHlsa(zrgba);
  }
  if (target === nodeGraphColorStandards.Chroma) {
    return nodeGraphZrgbaToChroma(zrgba);
  }
  return nodeGraphNormalizeZrgba(zrgba);
}

Object.assign(globalThis, {
  nodeGraphColorStandards,
  nodeGraphOfficialColorStandards,
  nodeGraphClampColorUnit,
  nodeGraphWrapColorHue,
  nodeGraphNormalizeColorSpace,
  nodeGraphNormalizeZrgba,
  nodeGraphNormalizeHlsa,
  nodeGraphNormalizeChroma,
  nodeGraphHlsaToZrgba,
  nodeGraphZrgbaToHlsa,
  nodeGraphChromaToHlsa,
  nodeGraphHlsaToChroma,
  nodeGraphChromaToZrgba,
  nodeGraphZrgbaToChroma,
  nodeGraphConvertColor,
});
