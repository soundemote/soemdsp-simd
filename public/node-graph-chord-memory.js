function createNodeGraphChordMemoryState() {
  return {
    latchWasHigh: false,
    clearWasHigh: false,
    advanceWasHigh: false,
    writeIndex: 0,
    arpIndex: 0,
    slots: [0, 0, 0, 0],
    slotsActive: [false, false, false, false],
  };
}

// Records a chord one note at a time from a mono Pitch input: each Latch
// trigger stores the current Pitch into the next of 4 slots (round-robin, a
// simple step-record), Clear resets all slots, and Advance steps an
// arpeggiator index across whichever slots are active. This sidesteps
// needing real keyboard polyphony -- play notes one at a time on any mono
// pitch source and latch each one to build the chord.
function nodeGraphChordMemorySample(state, options = {}) {
  const latchHigh = Number(options.latch) > 0;
  const clearHigh = Number(options.clear) > 0;
  const advanceHigh = Number(options.advance) > 0;
  const pitch = Number(options.pitch) || 0;

  if (clearHigh && !state.clearWasHigh) {
    state.slots = [0, 0, 0, 0];
    state.slotsActive = [false, false, false, false];
    state.writeIndex = 0;
    state.arpIndex = 0;
  }
  state.clearWasHigh = clearHigh;

  if (latchHigh && !state.latchWasHigh) {
    state.slots[state.writeIndex] = pitch;
    state.slotsActive[state.writeIndex] = true;
    state.writeIndex = (state.writeIndex + 1) % 4;
  }
  state.latchWasHigh = latchHigh;

  const activeIndices = [];
  for (let i = 0; i < 4; i += 1) {
    if (state.slotsActive[i]) activeIndices.push(i);
  }

  if (advanceHigh && !state.advanceWasHigh && activeIndices.length > 0) {
    const currentPos = activeIndices.indexOf(state.arpIndex);
    const nextPos = currentPos === -1 ? 0 : (currentPos + 1) % activeIndices.length;
    state.arpIndex = activeIndices[nextPos];
  }
  state.advanceWasHigh = advanceHigh;

  const arp = activeIndices.length > 0 ? state.slots[state.arpIndex] : 0;
  const gate = activeIndices.length > 0 ? 1 : 0;

  return {
    "Note 1": state.slots[0],
    "Note 2": state.slots[1],
    "Note 3": state.slots[2],
    "Note 4": state.slots[3],
    Arp: arp,
    Gate: gate,
  };
}
