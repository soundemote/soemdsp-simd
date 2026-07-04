// Preset scale masks: 12-bit, bit i = pitch class i (0=C, 1=C#, ... 11=B) is a
// member of the scale. Index matches the "scale" parameter's choice order.
const nodeGraphPitchQuantizerScaleMasks = Object.freeze([
  4095, // Chromatic (all 12 pitch classes)
  2741, // Major (0,2,4,5,7,9,11)
  1453, // Minor (0,2,3,5,7,8,10)
  661,  // Major Pentatonic (0,2,4,7,9)
  1193, // Minor Pentatonic (0,3,5,7,10)
  1365, // Whole Tone (0,2,4,6,8,10)
]);

function createNodeGraphPitchQuantizerState() {
  return { hasOutput: false, lastOutput: 0 };
}

function nodeGraphPitchQuantizerMaskFromChoice(choiceIndex) {
  const index = Math.max(0, Math.min(nodeGraphPitchQuantizerScaleMasks.length - 1, Math.round(Number(choiceIndex) || 0)));
  return nodeGraphPitchQuantizerScaleMasks[index];
}

// Snaps a 0.1V/Oct pitch signal (semitone = pitch * 120, matching this
// sandbox's convention -- see "0.1V/Oct": midi / 120 elsewhere) to the
// nearest active pitch class in a 12-bit scale mask. The mask comes from
// either the Scale input wire (if connected -- e.g. a future keyboard or
// Turing Machine feed) or the scale preset parameter. An empty mask holds
// the last quantized output rather than snapping to anything, matching
// hardware quantizer behavior.
function nodeGraphPitchQuantizerSample(state, options = {}) {
  const pitch = Number(options.pitch) || 0;
  const mask = options.hasScaleInput
    ? Math.round(Number(options.scaleInput) || 0) & 0xFFF
    : nodeGraphPitchQuantizerMaskFromChoice(options.scaleChoice);

  if (mask === 0) {
    return state.hasOutput ? state.lastOutput : pitch;
  }

  const semitoneFloat = pitch * 120;
  const rounded = Math.round(semitoneFloat);
  let bestSemitone = rounded;
  let bestDistance = Infinity;
  let found = false;
  for (let radius = 0; radius <= 12 && !found; radius += 1) {
    for (const sign of radius === 0 ? [0] : [-1, 1]) {
      const candidate = rounded + sign * radius;
      const pitchClass = ((candidate % 12) + 12) % 12;
      if (!((mask >> pitchClass) & 1)) continue;
      const distance = Math.abs(candidate - semitoneFloat);
      if (!found || distance < bestDistance) {
        found = true;
        bestDistance = distance;
        bestSemitone = candidate;
      }
    }
  }

  const output = found ? bestSemitone / 120 : pitch;
  state.hasOutput = true;
  state.lastOutput = output;
  return output;
}
