function nodeGraphBaseSampleRate() {
  const sampleRate = Math.round(Number(nodeGraphMvp?.sampleRate));
  return Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 44100;
}

function nodeGraphTargetSampleRate(patch = nodeGraphMvp.patch) {
  return normalizeNodeGraphPatchAudio(patch?.audio).targetSampleRate;
}

const nodeGraphOversamplingPresets = Object.freeze([1, 2, 4]);

function nodeGraphOversamplingMultiplier(baseRate, targetRate) {
  const base = Number(baseRate);
  const target = Number(targetRate);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(target) || target <= 0) {
    return 1;
  }
  return Math.max(1, Math.min(4, target / base));
}

function nodeGraphOversamplingPresetForRatio(ratio) {
  const value = Number(ratio);
  if (!Number.isFinite(value) || value <= 0) {
    return "1";
  }
  for (const preset of nodeGraphOversamplingPresets) {
    if (Math.abs(value - preset) < 0.001) {
      return String(preset);
    }
  }
  return "custom";
}

function nodeGraphTargetSampleRateForOversampling(multiplier, baseRate = nodeGraphBaseSampleRate()) {
  const preset = nodeGraphOversamplingPresets.includes(Number(multiplier))
    ? Number(multiplier)
    : 1;
  const base = Number(baseRate);
  return Math.round((Number.isFinite(base) && base > 0 ? base : 44100) * preset);
}

function nodeGraphEffectiveSampleRate(baseRate, multiplier) {
  const base = Number(baseRate);
  const factor = Number(multiplier);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(factor) || factor <= 0) {
    return base;
  }
  return base * factor;
}

function nodeGraphFormatSampleRate(sampleRate) {
  const value = Number(sampleRate);
  if (!Number.isFinite(value)) {
    return "0 Hz";
  }
  return `${Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} Hz`;
}

function nodeGraphFormatOversamplingRatio(ratio) {
  const value = Number(ratio);
  if (!Number.isFinite(value) || value <= 0) {
    return "x1";
  }
  return `x${Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")}`;
}

function nodeGraphAudioDerivation(patch = nodeGraphMvp.patch) {
  const currentSampleRate = nodeGraphBaseSampleRate();
  const targetSampleRate = nodeGraphTargetSampleRate(patch);
  const oversamplingRatio = nodeGraphOversamplingMultiplier(currentSampleRate, targetSampleRate);
  const clampedEngineSampleRate = nodeGraphEffectiveSampleRate(currentSampleRate, oversamplingRatio);
  return {
    clampedEngineSampleRate,
    currentSampleRate,
    outputSampleRate: currentSampleRate,
    oversampling: oversamplingRatio,
    oversamplingRatio,
    resultingSampleRate: clampedEngineSampleRate,
    targetSampleRate,
  };
}
