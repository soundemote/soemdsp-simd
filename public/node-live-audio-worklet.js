const nodeLiveAdditiveHardMaxHarmonics = 1024;

const nodeLiveRaptEllipticQuarterbandSos = Object.freeze([
  Object.freeze([1.3515101236634053e-04, 1.8481719657676747e-04, 1.3515101236634053e-04, 1, -1.5863119326809123, 0.6428204816292211]),
  Object.freeze([1, -0.3714014551732318, 0.9999999999999998, 1, -1.5620959364626055, 0.7161571320953768]),
  Object.freeze([1, -1.0298229723362611, 1, 1, -1.5310702081483014, 0.8130950789236201]),
  Object.freeze([1, -1.2676395426322578, 1.0000000000000002, 1, -1.50809401930334, 0.8931580864862605]),
  Object.freeze([1, -1.3628788519102755, 1.0000000000000002, 1, -1.4983265140498274, 0.9475287279522546]),
  Object.freeze([1, -1.3980241837651683, 1, 1, -1.5032624176850438, 0.9843747059042128]),
]);

function nodeLiveIsPolyBlepOscillatorType(type) {
  return type === "osc" || type === "polyBlep" || type === "fbPolyBlepOsc" || type === "sineWavetable";
}

// Registry-driven native module lifecycle -- see
// docs/NATIVE_CPP_WASM_MODULE_GUIDE.md. Proof-of-concept batch: collapses
// the five identical-shape lifecycle touch points (constructor state map,
// reset state map, createNestedRuntime state map + instantiation, removal
// destroy loop, native-load handler) into one generic loop driven by this
// table, instead of hand-duplicating them per module. The bespoke DSP
// math (JS fallback bodies, evaluateFrame dispatch) stays untouched.
const nativeStatefulModuleRegistry = Object.freeze([
  Object.freeze({
    type: "quadratureOscillator",
    nativeName: "quadrature_oscillator",
    stateMapKey: "quadratureOscillatorStates",
    nativeFlagKey: "nativeQuadratureOscillator",
    nativeReadyKey: "nativeQuadratureOscillatorReady",
    createState: "createQuadratureOscillatorState",
    destroyNativeState: "destroyQuadratureOscillatorNativeState",
    requiredExports: ["soemdsp_quadrature_oscillator_create", "soemdsp_quadrature_oscillator_sample"],
  }),
  Object.freeze({
    type: "dsfOscillator",
    nativeName: "dsf_oscillator",
    stateMapKey: "dsfOscillatorStates",
    nativeFlagKey: "nativeDsfOscillator",
    nativeReadyKey: "nativeDsfOscillatorReady",
    createState: "createDsfOscillatorState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_dsf_oscillator_create", "soemdsp_dsf_oscillator_sample"],
  }),
  Object.freeze({
    type: "keplerBouwkamp",
    nativeName: "jerobeam_kepler_bouwkamp",
    stateMapKey: "keplerBouwkampStates",
    nativeFlagKey: "nativeKeplerBouwkamp",
    nativeReadyKey: "nativeKeplerBouwkampReady",
    createState: "createKeplerBouwkampState",
    destroyNativeState: "destroyKeplerBouwkampNativeState",
    requiredExports: [
      "soemdsp_jbkepler_create",
      "soemdsp_jbkepler_sample",
      "soemdsp_jbkepler_x",
      "soemdsp_jbkepler_y",
    ],
  }),
  Object.freeze({
    type: "flowerChildFilter",
    nativeName: "flower_child_filter",
    stateMapKey: "flowerChildFilterStates",
    nativeFlagKey: "nativeFlowerChildFilter",
    nativeReadyKey: "nativeFlowerChildFilterReady",
    createState: "createFlowerChildFilterState",
    destroyNativeState: "destroyFlowerChildFilterNativeState",
    requiredExports: ["soemdsp_flower_child_filter_create", "soemdsp_flower_child_filter_sample"],
  }),
  Object.freeze({
    type: "noiseGenerator",
    nativeName: "noise_generator",
    stateMapKey: "noiseGeneratorStates",
    nativeFlagKey: "nativeNoiseGenerator",
    nativeReadyKey: "nativeNoiseGeneratorReady",
    createState: "createNoiseGeneratorState",
    destroyNativeState: "destroyNoiseGeneratorNativeState",
    requiredExports: ["soemdsp_noise_generator_create", "soemdsp_noise_generator_sample", "soemdsp_noise_generator_left", "soemdsp_noise_generator_right"],
  }),
  Object.freeze({
    type: "fractalBrownianNoise",
    nativeName: "fractal_brownian_noise",
    stateMapKey: "fractalBrownianNoiseStates",
    nativeFlagKey: "nativeFbm",
    nativeReadyKey: "nativeFbmReady",
    createState: "createFractalBrownianNoiseState",
    destroyNativeState: "destroyFbmNativeState",
    requiredExports: ["soemdsp_fbm_create", "soemdsp_fbm_sample", "soemdsp_fbm_x", "soemdsp_fbm_y", "soemdsp_fbm_z"],
  }),
  Object.freeze({
    type: "ladderFilter",
    nativeName: "ladder_filter",
    stateMapKey: "ladderFilterStates",
    nativeFlagKey: "nativeLadderFilter",
    nativeReadyKey: "nativeLadderFilterReady",
    createState: "createLadderFilterState",
    destroyNativeState: "destroyLadderFilterNativeState",
    requiredExports: ["soemdsp_ladder_filter_create", "soemdsp_ladder_filter_sample"],
  }),
  Object.freeze({
    type: "slewLimiter",
    nativeName: "slew_limiter",
    stateMapKey: "slewLimiterStates",
    nativeFlagKey: "nativeSlewLimiter",
    nativeReadyKey: "nativeSlewLimiterReady",
    createState: "createSlewLimiterState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_slew_limiter_create", "soemdsp_slew_limiter_sample"],
  }),
  Object.freeze({
    type: "sampleHold",
    nativeName: "sample_hold",
    stateMapKey: "sampleHoldStates",
    nativeFlagKey: "nativeSampleHold",
    nativeReadyKey: "nativeSampleHoldReady",
    createState: "createSampleHoldState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_sample_hold_create", "soemdsp_sample_hold_sample"],
  }),
  Object.freeze({
    type: "expAdsr",
    nativeName: "exp_adsr",
    stateMapKey: "expAdsrStates",
    nativeFlagKey: "nativeExpAdsr",
    nativeReadyKey: "nativeExpAdsrReady",
    createState: "createExpAdsrState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_exp_adsr_create", "soemdsp_exp_adsr_sample"],
  }),
  Object.freeze({
    type: "linearEnvelope",
    nativeName: "linear_envelope",
    stateMapKey: "linearEnvelopeStates",
    nativeFlagKey: "nativeLinearEnvelope",
    nativeReadyKey: "nativeLinearEnvelopeReady",
    createState: "createLinearEnvelopeState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_linear_envelope_create", "soemdsp_linear_envelope_sample"],
  }),
  Object.freeze({
    type: "pluckEnvelope",
    nativeName: "pluck_envelope",
    stateMapKey: "pluckEnvelopeStates",
    nativeFlagKey: "nativePluckEnvelope",
    nativeReadyKey: "nativePluckEnvelopeReady",
    createState: "createPluckEnvelopeState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_pluck_envelope_create", "soemdsp_pluck_envelope_sample"],
  }),
  Object.freeze({
    type: "cookbookFilter",
    nativeName: "cookbook_filter",
    stateMapKey: "cookbookFilterStates",
    nativeFlagKey: "nativeCookbookFilter",
    nativeReadyKey: "nativeCookbookFilterReady",
    createState: "createCookbookFilterState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_cookbook_filter_create", "soemdsp_cookbook_filter_sample"],
  }),
  Object.freeze({
    type: "delayEffect",
    nativeName: "delay_effect",
    stateMapKey: "delayEffectStates",
    nativeFlagKey: "nativeDelayEffect",
    nativeReadyKey: "nativeDelayEffectReady",
    createState: "createDelayEffectState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_delay_effect_create", "soemdsp_delay_effect_sample", "soemdsp_delay_effect_last_wet"],
  }),
  Object.freeze({
    type: "randomWalk",
    nativeName: "random_walk",
    stateMapKey: "randomWalkStates",
    nativeFlagKey: "nativeRandomWalk",
    nativeReadyKey: "nativeRandomWalkReady",
    createState: "createRandomWalkState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_random_walk_create", "soemdsp_random_walk_sample"],
  }),
  Object.freeze({
    type: "chordMemory",
    nativeName: "chord_memory",
    stateMapKey: "chordMemoryStates",
    nativeFlagKey: "nativeChordMemory",
    nativeReadyKey: "nativeChordMemoryReady",
    createState: "createChordMemoryState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_chord_memory_create", "soemdsp_chord_memory_sample", "soemdsp_chord_memory_note", "soemdsp_chord_memory_arp"],
  }),
  Object.freeze({
    type: "turingMachine",
    nativeName: "turing_machine",
    stateMapKey: "turingMachineStates",
    nativeFlagKey: "nativeTuringMachine",
    nativeReadyKey: "nativeTuringMachineReady",
    createState: "createTuringMachineState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_turing_machine_create", "soemdsp_turing_machine_sample", "soemdsp_turing_machine_scale", "soemdsp_turing_machine_gate"],
  }),
  Object.freeze({
    type: "yellowjacketFilter",
    nativeName: "yellowjacket_filter",
    stateMapKey: "yellowjacketFilterStates",
    nativeFlagKey: "nativeYellowjacketFilter",
    nativeReadyKey: "nativeYellowjacketFilterReady",
    createState: "createYellowjacketFilterState",
    destroyNativeState: "destroyYellowjacketFilterNativeState",
    requiredExports: ["soemdsp_yellowjacket_filter_create", "soemdsp_yellowjacket_filter_sample"],
  }),
  Object.freeze({
    type: "superloveFilter",
    nativeName: "superlove_filter",
    stateMapKey: "superloveFilterStates",
    nativeFlagKey: "nativeSuperloveFilter",
    nativeReadyKey: "nativeSuperloveFilterReady",
    createState: "createSuperloveFilterState",
    destroyNativeState: "destroySuperloveFilterNativeState",
    requiredExports: ["soemdsp_superlove_filter_create", "soemdsp_superlove_filter_sample"],
  }),
  Object.freeze({
    type: "rsmetFilter",
    nativeName: "rsmet_filter",
    stateMapKey: "rsmetFilterStates",
    nativeFlagKey: "nativeRsmetFilter",
    nativeReadyKey: "nativeRsmetFilterReady",
    createState: "createRsmetFilterState",
    destroyNativeState: "destroyRsmetFilterNativeState",
    requiredExports: ["soemdsp_rsmet_filter_create", "soemdsp_rsmet_filter_sample"],
  }),
  Object.freeze({
    type: "chaoticPhaseLockingFilter",
    nativeName: "chaotic_phase_locking_filter",
    stateMapKey: "chaoticPhaseLockingFilterStates",
    nativeFlagKey: "nativeChaoticPhaseLockingFilter",
    nativeReadyKey: "nativeChaoticPhaseLockingFilterReady",
    createState: "createChaoticPhaseLockingFilterState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_chaotic_phase_locking_filter_create", "soemdsp_chaotic_phase_locking_filter_sample"],
  }),
  Object.freeze({
    type: "resonatorFilter",
    nativeName: "resonator_filter",
    stateMapKey: "resonatorFilterStates",
    nativeFlagKey: "nativeResonatorFilter",
    nativeReadyKey: "nativeResonatorFilterReady",
    createState: "createResonatorFilterState",
    destroyNativeState: "destroyResonatorFilterNativeState",
    requiredExports: ["soemdsp_resonator_filter_create", "soemdsp_resonator_filter_sample"],
  }),
  Object.freeze({
    type: "humanFilter",
    nativeName: "human_filter",
    stateMapKey: "humanFilterStates",
    nativeFlagKey: "nativeHumanFilter",
    nativeReadyKey: "nativeHumanFilterReady",
    createState: "createHumanFilterState",
    destroyNativeState: "destroyHumanFilterNativeState",
    requiredExports: ["soemdsp_human_filter_create", "soemdsp_human_filter_sample"],
  }),
  Object.freeze({
    type: "passiveFilter",
    nativeName: "passive_filter",
    stateMapKey: "passiveFilterStates",
    nativeFlagKey: "nativePassiveFilter",
    nativeReadyKey: "nativePassiveFilterReady",
    createState: "createPassiveFilterState",
    destroyNativeState: "destroyPassiveFilterNativeState",
    requiredExports: ["soemdsp_passive_filter_create", "soemdsp_passive_filter_sample"],
  }),
  Object.freeze({
    type: "polyBlep",
    nativeName: "polyblep",
    stateMapKey: "polyBlepStates",
    nativeFlagKey: "nativePolyBlep",
    nativeReadyKey: "nativePolyBlepReady",
    createState: "createPolyBlepState",
    destroyNativeState: "destroyPolyBlepNativeState",
    requiredExports: ["soemdsp_polyblep_create", "soemdsp_polyblep_sample", "soemdsp_polyblep_out"],
  }),
  Object.freeze({
    type: "lorenzAttractor",
    nativeName: "lorenz_attractor",
    stateMapKey: "lorenzAttractorStates",
    nativeFlagKey: "nativeLorenzAttractor",
    nativeReadyKey: "nativeLorenzAttractorReady",
    createState: "createLorenzAttractorState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_lorenz_attractor_create", "soemdsp_lorenz_attractor_sample", "soemdsp_lorenz_attractor_x", "soemdsp_lorenz_attractor_y", "soemdsp_lorenz_attractor_z"],
  }),
  Object.freeze({
    type: "pll",
    nativeName: "pll",
    stateMapKey: "pllStates",
    nativeFlagKey: "nativePll",
    nativeReadyKey: "nativePllReady",
    createState: "createPllState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_pll_create", "soemdsp_pll_process", "soemdsp_pll_vco_out"],
  }),
  Object.freeze({
    type: "helmholtzPitch",
    nativeName: "helmholtz",
    stateMapKey: "helmholtzStates",
    nativeFlagKey: "nativeHelmholtz",
    nativeReadyKey: "nativeHelmholtzReady",
    createState: "createHelmholtzState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_helmholtz_create", "soemdsp_helmholtz_process", "soemdsp_helmholtz_frequency"],
  }),
  Object.freeze({
    type: "reverbEffect",
    nativeName: "sabrina_reverb",
    stateMapKey: "reverbEffectStates",
    nativeFlagKey: "nativeSabrinaReverb",
    nativeReadyKey: "nativeSabrinaReverbReady",
    createState: "createSabrinaReverbState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_sabrina_reverb_create", "soemdsp_sabrina_reverb_process", "soemdsp_sabrina_reverb_left", "soemdsp_sabrina_reverb_right"],
  }),
  Object.freeze({
    type: "tb303Filter",
    nativeName: "tb303_filter",
    stateMapKey: "tb303FilterStates",
    nativeFlagKey: "nativeTb303Filter",
    nativeReadyKey: "nativeTb303FilterReady",
    createState: "createTb303FilterState",
    destroyNativeState: "destroyTb303FilterNativeState",
    requiredExports: ["soemdsp_tb303_filter_create", "soemdsp_tb303_filter_sample"],
  }),
  Object.freeze({
    type: "flowerChildEnvelopeFollower",
    nativeName: "flower_child_envelope_follower",
    stateMapKey: "flowerChildEnvelopeFollowerStates",
    nativeFlagKey: "nativeFlowerChildEnvelopeFollower",
    nativeReadyKey: "nativeFlowerChildEnvelopeFollowerReady",
    createState: "createFlowerChildEnvelopeFollowerState",
    destroyNativeState: null,
    requiredExports: ["soemdsp_flower_child_envelope_follower_create", "soemdsp_flower_child_envelope_follower_sample"],
  }),
  Object.freeze({
    type: "changeDetector",
    nativeName: "change_detector",
    stateMapKey: "changeDetectorStates",
    nativeFlagKey: "nativeChangeDetector",
    nativeReadyKey: "nativeChangeDetectorReady",
    createState: "createChangeDetectorState",
    destroyNativeState: "destroyChangeDetectorNativeState",
    requiredExports: ["soemdsp_change_detector_create", "soemdsp_change_detector_sample"],
  }),
  Object.freeze({
    type: "robinSupersaw",
    nativeName: "robin_supersaw",
    stateMapKey: "robinSupersawStates",
    nativeFlagKey: "nativeRobinSupersaw",
    nativeReadyKey: "nativeRobinSupersawReady",
    createState: "createRobinSupersawState",
    destroyNativeState: "destroyRobinSupersawNativeState",
    requiredExports: ["soemdsp_robin_supersaw_create", "soemdsp_robin_supersaw_sample"],
  }),
  Object.freeze({
    type: "logisticMap",
    nativeName: "logistic_map",
    stateMapKey: "logisticMapStates",
    nativeFlagKey: "nativeLogisticMap",
    nativeReadyKey: "nativeLogisticMapReady",
    createState: "createLogisticMapState",
    destroyNativeState: "destroyLogisticMapNativeState",
    requiredExports: ["soemdsp_logistic_map_create", "soemdsp_logistic_map_sample"],
  }),
  Object.freeze({
    type: "henonMap",
    nativeName: "henon_map",
    stateMapKey: "henonMapStates",
    nativeFlagKey: "nativeHenonMap",
    nativeReadyKey: "nativeHenonMapReady",
    createState: "createHenonMapState",
    destroyNativeState: "destroyHenonMapNativeState",
    requiredExports: ["soemdsp_henon_map_create", "soemdsp_henon_map_sample", "soemdsp_henon_map_x", "soemdsp_henon_map_y"],
  }),
  Object.freeze({
    type: "chuaAttractor",
    nativeName: "chua_attractor",
    stateMapKey: "chuaAttractorStates",
    nativeFlagKey: "nativeChuaAttractor",
    nativeReadyKey: "nativeChuaAttractorReady",
    createState: "createChuaAttractorState",
    destroyNativeState: "destroyChuaAttractorNativeState",
    requiredExports: ["soemdsp_chua_attractor_create", "soemdsp_chua_attractor_sample", "soemdsp_chua_attractor_x", "soemdsp_chua_attractor_y", "soemdsp_chua_attractor_z"],
  }),
  Object.freeze({
    type: "wirdoSpiral",
    nativeName: "jerobeam_wirdo_spiral",
    stateMapKey: "wirdoSpiralStates",
    nativeFlagKey: "nativeWirdoSpiral",
    nativeReadyKey: "nativeWirdoSpiralReady",
    createState: "createWirdoSpiralState",
    destroyNativeState: "destroyWirdoSpiralNativeState",
    requiredExports: ["soemdsp_jbwirdo_create", "soemdsp_jbwirdo_sample", "soemdsp_jbwirdo_x", "soemdsp_jbwirdo_y"],
  }),
  Object.freeze({
    type: "blubb",
    nativeName: "jerobeam_blubb",
    stateMapKey: "blubbStates",
    nativeFlagKey: "nativeBlubb",
    nativeReadyKey: "nativeBlubbReady",
    createState: "createBlubbState",
    destroyNativeState: "destroyBlubbNativeState",
    requiredExports: ["soemdsp_jbblubb_create", "soemdsp_jbblubb_sample", "soemdsp_jbblubb_x", "soemdsp_jbblubb_y"],
  }),
  Object.freeze({
    type: "mushroom",
    nativeName: "jerobeam_mushroom",
    stateMapKey: "mushroomStates",
    nativeFlagKey: "nativeMushroom",
    nativeReadyKey: "nativeMushroomReady",
    createState: "createMushroomState",
    destroyNativeState: "destroyMushroomNativeState",
    requiredExports: ["soemdsp_jbmushroom_create", "soemdsp_jbmushroom_sample", "soemdsp_jbmushroom_x", "soemdsp_jbmushroom_y"],
  }),
  Object.freeze({
    type: "boing",
    nativeName: "jerobeam_boing",
    stateMapKey: "boingStates",
    nativeFlagKey: "nativeBoing",
    nativeReadyKey: "nativeBoingReady",
    createState: "createBoingState",
    destroyNativeState: "destroyBoingNativeState",
    requiredExports: ["soemdsp_jbboing_create", "soemdsp_jbboing_sample", "soemdsp_jbboing_x", "soemdsp_jbboing_y"],
  }),
  Object.freeze({
    type: "torus",
    nativeName: "jerobeam_torus",
    stateMapKey: "torusStates",
    nativeFlagKey: "nativeTorus",
    nativeReadyKey: "nativeTorusReady",
    createState: "createTorusState",
    destroyNativeState: "destroyTorusNativeState",
    requiredExports: ["soemdsp_jbtorus_create", "soemdsp_jbtorus_sample", "soemdsp_jbtorus_x", "soemdsp_jbtorus_y"],
  }),
  Object.freeze({
    type: "nyquistShannon",
    nativeName: "jerobeam_nyquist_shannon",
    stateMapKey: "nyquistShannonStates",
    nativeFlagKey: "nativeNyquistShannon",
    nativeReadyKey: "nativeNyquistShannonReady",
    createState: "createNyquistShannonState",
    destroyNativeState: "destroyNyquistShannonNativeState",
    requiredExports: ["soemdsp_jbnyquist_create", "soemdsp_jbnyquist_sample", "soemdsp_jbnyquist_x", "soemdsp_jbnyquist_y"],
  }),
  Object.freeze({
    type: "radar",
    nativeName: "jerobeam_radar",
    stateMapKey: "radarStates",
    nativeFlagKey: "nativeRadar",
    nativeReadyKey: "nativeRadarReady",
    createState: "createRadarState",
    destroyNativeState: "destroyRadarNativeState",
    requiredExports: ["soemdsp_jbradar_create", "soemdsp_jbradar_sample", "soemdsp_jbradar_x", "soemdsp_jbradar_y"],
  }),
  Object.freeze({
    type: "pitchQuantizer",
    nativeName: "pitch_quantizer",
    stateMapKey: "pitchQuantizerStates",
    nativeFlagKey: "nativePitchQuantizer",
    nativeReadyKey: "nativePitchQuantizerReady",
    createState: "createPitchQuantizerState",
    destroyNativeState: "destroyPitchQuantizerNativeState",
    requiredExports: ["soemdsp_pitch_quantizer_create", "soemdsp_pitch_quantizer_sample"],
  }),
  Object.freeze({
    type: "surgeOscillator",
    nativeName: "surge_oscillator",
    stateMapKey: "surgeOscillatorStates",
    nativeFlagKey: "nativeSurgeOscillator",
    nativeReadyKey: "nativeSurgeOscillatorReady",
    createState: "createSurgeOscillatorState",
    destroyNativeState: "destroySurgeOscillatorNativeState",
    requiredExports: ["soemdsp_surge_oscillator_create", "soemdsp_surge_oscillator_sample"],
  }),
  Object.freeze({
    type: ["vactrolEnvelope", "vactrolEnvelopeC4"],
    nativeName: "vactrol_envelope",
    stateMapKey: "vactrolEnvelopeStates",
    nativeFlagKey: "nativeVactrolEnvelope",
    nativeReadyKey: "nativeVactrolEnvelopeReady",
    createState: "createVactrolEnvelopeState",
    destroyNativeState: "destroyVactrolEnvelopeNativeState",
    requiredExports: ["soemdsp_vactrol_envelope_create", "soemdsp_vactrol_envelope_sample"],
  }),
]);

const nodeLiveSineWavetableSize = 2048;
const nodeLiveSineWavetable = new Float32Array(nodeLiveSineWavetableSize + 1);
for (let index = 0; index <= nodeLiveSineWavetableSize; index += 1) {
  nodeLiveSineWavetable[index] = Math.sin((index / nodeLiveSineWavetableSize) * Math.PI * 2);
}

function nodeLiveClamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function nodeLiveSmoothStep01(value) {
  const t = nodeLiveClamp01(value);
  return t * t * (3 - 2 * t);
}

function nodeLiveNyquistFadeAmplitude(frequency, sampleRate) {
  const safeRate = Math.max(1, Number(sampleRate) || 44100);
  const nyquist = safeRate * 0.5;
  const safeFrequency = Math.max(0, Number(frequency) || 0);
  const fadeStart = Math.min(20000, nyquist * 0.9);
  if (safeFrequency <= fadeStart) {
    return 1;
  }
  if (safeFrequency >= nyquist) {
    return 0;
  }
  const fadeProgress = (safeFrequency - fadeStart) / Math.max(1, nyquist - fadeStart);
  return 1 - nodeLiveSmoothStep01(fadeProgress);
}

function nodeLiveWrap01(value) {
  return ((Number(value) || 0) % 1 + 1) % 1;
}

function nodeLiveSineWavetableLookup(phaseRadians) {
  const cycle = nodeLiveWrap01((Number(phaseRadians) || 0) / (Math.PI * 2));
  const position = cycle * nodeLiveSineWavetableSize;
  const index = Math.floor(position);
  const fraction = position - index;
  const a = nodeLiveSineWavetable[index] || 0;
  const b = nodeLiveSineWavetable[index + 1] || nodeLiveSineWavetable[0] || 0;
  return a + (b - a) * fraction;
}

function nodeLiveSineCosWavetableSample(phaseRadians, frequency, amplitude, sampleRate) {
  const level = Math.max(0, Number(amplitude) || 0) * nodeLiveNyquistFadeAmplitude(frequency, sampleRate);
  return {
    cos: nodeLiveSineWavetableLookup((Number(phaseRadians) || 0) + Math.PI * 0.5) * level,
    sin: nodeLiveSineWavetableLookup(phaseRadians) * level,
  };
}

class NodeLiveAudioProcessor extends AudioWorkletProcessor {
  // Block size for the FBM native block-processing boundary
  // (soemdsp_fbm_process_block) -- matches the typical AudioWorklet render
  // quantum. Params are resolved once per this many samples instead of once
  // per sample; see fractalBrownianNoiseVector.
  static FBM_NATIVE_BLOCK_SIZE = 128;

  // Same block-processing boundary pattern for Noise Generator
  // (soemdsp_noise_generator_process_block) -- a pure generator like FBM,
  // so its block cache also refills transparently with no added latency.
  static NOISE_NATIVE_BLOCK_SIZE = 128;

  constructor() {
    super();
    this.inputConnections = new Map();
    this.triggerPatchBindings = new Map();
    this.triggerPatchGates = new Map();
    this.badNumberCount = 0;
    this.lastBadValueReason = "";
    this.lastBadValueNodeId = "";
    this.lastBadValueSource = "";
    this.audioPlayerMeterNodeId = "";
    this.audioPlayerMeterPeak = 0;
    this.audioPlayerMeterPhase = 0;
    this.audioPlayerMeterReason = "";
    this.audioPlayerMeterSamples = 0;
    this.audioPlayerNodeIds = [];
    this.inputMeterPeak = 0;
    this.inputMeterSamples = 0;
    this.inputMeterSquareSum = 0;
    this.maxBlockProcessMs = 0;
    this.maxBlockBudgetRatio = 0;
    this.meterClipCount = 0;
    this.meterCounter = 0;
    this.meterOverrunCount = 0;
    this.meterPeak = 0;
    this.meterProtectionMuteCount = 0;
    this.meterSamples = 0;
    this.meterSquareSum = 0;
    this.macroControls = new Array(10).fill(0);
    this.externalButtonEvents = new Map();
    this.wireBreakEvent = { pulseSamples: 0, gateSamples: 0 };
    this.wireConnectEvent = { pulseSamples: 0 };
    this.wireDisconnectEvent = { pulseSamples: 0 };
    this.windowReopenEvent = { pulseSamples: 0, gateSamples: 0, totalSamples: 0 };
    this.shootingStarExplosionEvent = { pulseSamples: 0 };
    this.pitchModWheelSignal = { mod: 0, pitch: 0 };
    this.midiKeyboardGatePulseSamples = 0;
    this.midiKeyboardSignal = null;
    this.moduleGroupRuntimes = new Map();
    this.modulationConnections = new Map();
    this.nodeOutputs = new Map();
    this.nodes = new Map();
    this.noiseSeedKeys = new Map();
    this.noiseSeeds = new Map();
    this.order = [];
    this.engineSampleRate = sampleRate;
    this.hostSampleRate = sampleRate;
    this.oversamplingRatio = 1;
    this.raptEllipticDecimatorLeft = this.createRaptEllipticDecimatorState();
    this.raptEllipticDecimatorRight = this.createRaptEllipticDecimatorState();
    this.raptEllipticDecimatorRatio = 1;
    this.clockDividerStates = new Map();
    this.clockStates = new Map();
    this.codeblockFunctions = new Map();
    this.delayedTriggerStates = new Map();
    this.ellipsoidOutputFrames = new Map();
    this.nativeEllipsoid = null;
    this.nativeEllipsoidReady = false;
    this.nativeHelmholtzStatusKey = "";
    this.nativeSoftClipper = null;
    this.nativeSoftClipperReady = false;
    this.nativeSineWavetable = null;
    this.nativeSineWavetableReady = false;
    this.nativeAdditiveOsc = null;
    this.nativeAdditiveOscReady = false;
    this.initNativeStatefulModuleMaps(this, { includeNativeFlags: true });
    this.graphInputConnections = new Map();
    this.logSpiralStates = new Map();
    this.oscResetStates = new Map();
    this.graphLfoStates = new Map();
    this.oscillatorLastPhaseIncrements = new Map();
    this.oscillatorStoppedSamples = new Map();
    this.outputNode = "output";
    this.patchFingerprint = "";
    this.patchCommandStates = new Map();
    this.phases = new Map();
    this.planSerial = 0;
    this.randomClockStates = new Map();
    this.samplePlaybackStates = new Map();
    this.samples = new Map();
    this.sessionId = 0;
    this.scopeBuffers = new Map();
    this.scopeCaptureNodeIds = [];
    this.scopeCounter = 0;
    this.scopeSampleStride = 1;
    this.smoothers = new Map();
    this.spiralStates = new Map();
    this.fractalSpiralStates = new Map();
    this.stepSequencerStates = new Map();
    this.timing = this.normalizePatchTiming();
    this.metronomeEnabled = false;
    this.metronomePhase = 0;
    this.metronomeBeatCount = 0;
    this.triggerCounterStates = new Map();
    this.triggerDividerStates = new Map();
    this.triangleStates = new Map();
    this.visualInputBuffers = new Map();
    this.visualSinks = [];
    this.resetVisualControls();
    this.earProtector = this.createEarProtector(sampleRate);
    this.port.onmessage = (event) => this.handleMessage(event.data || {});
  }

  createEarProtector(rate = sampleRate) {
    const threshold = Math.pow(10, 6 / 20);
    const clipLimit = 0.8;
    const increment = 1 / Math.max(1, 0.0005 * rate);
    const decrement = 1 / Math.max(1, 0.15 * rate);
    const w = Math.min((Math.PI * 2) / Math.max(1, rate), 0.000142475857) * 1000;
    const a1 = Math.exp(-w);
    const b0 = 0.5 * (1 + a1);
    const b1 = -b0;
    let counter = 0;
    let inputBuffer = 0;
    let outputBuffer = 0;
    return {
      protect: (left = 0, right = left) => {
        const mono = ((Number(left) || 0) + (Number(right) || 0)) * 0.5;
        outputBuffer = b0 * mono + b1 * inputBuffer + a1 * outputBuffer;
        inputBuffer = mono;
        if (Math.abs(outputBuffer) >= threshold) {
          counter += increment;
        }
        const gain = counter >= 1 ? 0 : 1;
        counter = Math.max(0, Math.min(2, counter)) - decrement;
        return {
          left: this.clampValue((Number(left) || 0) * gain, -clipLimit, clipLimit),
          muted: gain <= 0,
          right: this.clampValue((Number(right) || 0) * gain, -clipLimit, clipLimit),
        };
      },
    };
  }

  createRaptEllipticDecimatorState() {
    return nodeLiveRaptEllipticQuarterbandSos.map(() => [0, 0]);
  }

  resetRaptEllipticDecimator() {
    this.raptEllipticDecimatorLeft = this.createRaptEllipticDecimatorState();
    this.raptEllipticDecimatorRight = this.createRaptEllipticDecimatorState();
    this.raptEllipticDecimatorRatio = this.oversamplingRatio;
  }

  processRaptEllipticDecimatorSample(input, states) {
    let y = Number(input) || 0;
    for (let section = 0; section < nodeLiveRaptEllipticQuarterbandSos.length; section += 1) {
      const [b0, b1, b2, , a1, a2] = nodeLiveRaptEllipticQuarterbandSos[section];
      const z1 = states[section][0];
      const z2 = states[section][1];
      const sectionOut = b0 * y + z1;
      states[section][0] = b1 * y - a1 * sectionOut + z2;
      states[section][1] = b2 * y - a2 * sectionOut;
      y = sectionOut;
    }
    return y;
  }

  createVisualControlState() {
    return {
      controls: {
        blue: 0,
        chromaAlpha: 0,
        chromaDrift: 0,
        chromaHue: 0,
        chromaLightness: 0,
        chromaSaturation: 0,
        chromaSpread: 0,
        green: 0,
        red: 0,
        scopePaused: 0,
        scopeTracesOff: 0,
        screenDim: 0,
        screenShake: 0,
        visualBloom: 0,
        visualBrightness: 0,
        visualGlow: 0,
        x: 0,
        y: 0,
      },
      counter: 0,
      states: new Map([
        ["blue", 0],
        ["chromaAlpha", 0],
        ["chromaDrift", 0],
        ["chromaHue", 0],
        ["chromaLightness", 0],
        ["chromaSaturation", 0],
        ["chromaSpread", 0],
        ["green", 0],
        ["red", 0],
        ["scopePaused", 0],
        ["scopeTracesOff", 0],
        ["screenDim", 0],
        ["screenShake", 0],
        ["visualBloom", 0],
        ["visualBrightness", 0],
        ["visualGlow", 0],
        ["x", 0],
        ["y", 0],
      ]),
    };
  }

  resetVisualControls() {
    const visualState = this.createVisualControlState();
    this.visualControls = visualState.controls;
    this.visualControlCounter = visualState.counter;
    this.visualControlStates = visualState.states;
  }

  destroySabrinaReverbState(state) {
    if (!state?.nativeHandle || !this.nativeSabrinaReverb?.soemdsp_sabrina_reverb_destroy) {
      return;
    }
    this.nativeSabrinaReverb.soemdsp_sabrina_reverb_destroy(state.nativeHandle);
    state.nativeHandle = 0;
  }

  handleMessage(message) {
    if (message.type === "stop") {
      if (message.sessionId !== this.sessionId || message.planSerial !== this.planSerial) {
        return;
      }
      this.clearPlan();
      return;
    }
    if (message.type === "setPlan") {
      this.setPlan(message.plan, message);
      return;
    }
    if (message.type === "setConnections") {
      this.setConnections(message.plan || message, message);
      return;
    }
    if (message.type === "setNativeModuleWasm") {
      this.setNativeModuleWasm(message);
      return;
    }
    if (message.type === "setParams") {
      this.setParams(message.nodes, message);
      return;
    }
    if (message.type === "setMidiKeyboardSignal") {
      this.setMidiKeyboardSignal(message.signal);
      return;
    }
    if (message.type === "setMacroControls") {
      this.setMacroControls(message.values);
      return;
    }
    if (message.type === "setPitchModWheelSignal") {
      this.setPitchModWheelSignal(message.signal);
      return;
    }
    if (message.type === "externalButtonEvent") {
      this.setExternalButtonEvent(message.name);
      return;
    }
    if (message.type === "wireBreakEvent") {
      this.setWireBreakEvent();
      return;
    }
    if (message.type === "wireConnectEvent") {
      this.setWireConnectEvent();
      return;
    }
    if (message.type === "wireDisconnectEvent") {
      this.setWireDisconnectEvent();
      return;
    }
    if (message.type === "windowReopenEvent") {
      this.setWindowReopenEvent();
      return;
    }
    if (message.type === "shootingStarExplosionEvent") {
      this.setShootingStarExplosionEvent(message.speed);
      return;
    }
    if (message.type === "triggerPatchBind") {
      this.bindTriggerPatch(
        message.nodeId,
        message.port,
        message.triggerId,
        message.kind,
        message.plan,
        message.gateNodeId,
        message.outNodeId,
      );
      return;
    }
    if (message.type === "triggerPatchUnbind") {
      this.unbindTriggerPatch(message.nodeId, message.port);
      return;
    }
    if (message.type === "triggerPatchStart") {
      this.setTriggerPatchGate(message.nodeId, message.port, 1);
      return;
    }
    if (message.type === "triggerPatchStop") {
      this.setTriggerPatchGate(message.nodeId, message.port, 0);
      return;
    }
    if (message.type === "triggerPatchFire") {
      this.fireTriggerPatchOnce(message.nodeId, message.port);
      return;
    }
    if (message.type === "setMetronomeEnabled") {
      this.setMetronomeEnabled(message.enabled);
      return;
    }
  }

  setMetronomeEnabled(enabled) {
    this.metronomeEnabled = Boolean(enabled);
    if (!this.metronomeEnabled) {
      this.metronomePhase = 0;
      this.metronomeBeatCount = 0;
    }
  }

  // Ticks the metronome by one sample at `rate` and fires whichever circuit
  // slot (beat/downbeat) is due, if any -- called once per subframe from
  // process(), top-level only (never on a nested moduleGroup/trigger-patch
  // runtime, since those never have process() called on them directly).
  // The "beat"/"downbeat" circuit slots are ordinary trigger-patch bindings
  // under a synthetic nodeId ("__metronome__") rather than a real graph
  // port -- same bind/fire/evaluate mechanism as quick-connect, just not
  // tied to any node the user can see.
  advanceMetronome(rate) {
    if (!this.metronomeEnabled) {
      return;
    }
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const tempoBpm = Math.max(1, Number(this.timing?.tempoBpm) || 120);
    const increment = (tempoBpm / 60) / safeRate;
    this.metronomePhase += increment;
    if (this.metronomePhase >= 1) {
      this.metronomePhase -= Math.floor(this.metronomePhase);
      const numerator = Math.max(1, Number(this.timing?.timeSignatureNumerator) || 4);
      const isDownbeat = (this.metronomeBeatCount % numerator) === 0;
      this.metronomeBeatCount += 1;
      this.fireTriggerPatchOnce("__metronome__", isDownbeat ? "downbeat" : "beat");
    }
  }

  // Sums whatever the beat/downbeat circuit slots are currently outputting
  // this frame -- at most one is ever nonzero at a time, since only one of
  // them gets fired per beat edge.
  metronomeSample(frame, frames, safeRate, inputFrame) {
    if (!this.metronomeEnabled) {
      return 0;
    }
    const beat = this.evaluateTriggerPatchBindingByKey(
      this.inputKey("__metronome__", "beat"), frame, frames, safeRate, inputFrame,
    );
    const downbeat = this.evaluateTriggerPatchBindingByKey(
      this.inputKey("__metronome__", "downbeat"), frame, frames, safeRate, inputFrame,
    );
    return beat + downbeat;
  }

  // A "trigger patch" quick-connects a small reusable circuit (from
  // public/node-graph-trigger-patch-library.js) into a target input port,
  // acting like a hidden wire rather than a one-shot poke -- it stays bound
  // until explicitly unbound. `plan` arrives already compiled (via
  // nodeGraphBuildLivePlanForPatch on the main thread -- this worklet's
  // isolated scope never loads that helper, same reason dsf_oscillator and
  // robin_supersaw inline their own JS fallbacks instead of sharing globals).
  bindTriggerPatch(nodeId, port, triggerId, kind, plan, gateNodeId, outNodeId) {
    if (!nodeId || !port || !triggerId) {
      return;
    }
    const key = this.inputKey(nodeId, port);
    this.triggerPatchBindings.set(key, {
      triggerId,
      kind: kind || "sourcePatch",
      plan: plan || null,
      gateNodeId: gateNodeId || null,
      outNodeId: outNodeId || null,
      runtime: plan ? this.createNestedRuntime(plan) : null,
      stepState: kind === "stepImpulse" ? { lastGate: 0 } : null,
    });
    this.triggerPatchGates.set(key, { level: 0, oneShotRemaining: 0 });
  }

  unbindTriggerPatch(nodeId, port) {
    if (!nodeId || !port) {
      return;
    }
    const key = this.inputKey(nodeId, port);
    this.triggerPatchBindings.delete(key);
    this.triggerPatchGates.delete(key);
  }

  setTriggerPatchGate(nodeId, port, level) {
    if (!nodeId || !port) {
      return;
    }
    const gate = this.triggerPatchGates.get(this.inputKey(nodeId, port));
    if (gate) {
      gate.level = level ? 1 : 0;
    }
  }

  fireTriggerPatchOnce(nodeId, port) {
    if (!nodeId || !port) {
      return;
    }
    const gate = this.triggerPatchGates.get(this.inputKey(nodeId, port));
    if (gate) {
      gate.oneShotRemaining = 1;
    }
  }

  // Shared by mixInput (bound to a graph input port) and the metronome
  // (bound to a synthetic key, not any real node/port) -- evaluates
  // whatever trigger patch is bound under `key` for this frame and returns
  // its current output, 0 if nothing's bound there.
  evaluateTriggerPatchBindingByKey(key, frame, frames, safeRate, inputFrame) {
    const binding = this.triggerPatchBindings.get(key);
    if (!binding) {
      return 0;
    }
    const gate = this.triggerPatchGates.get(key) || { level: 0, oneShotRemaining: 0 };
    const gateLevel = gate.oneShotRemaining > 0 ? 1 : gate.level;
    if (gate.oneShotRemaining > 0) {
      gate.oneShotRemaining -= 1;
    }
    if (binding.kind === "stepImpulse") {
      return this.evaluateTriggerPatchStepImpulse(binding.stepState, gateLevel, safeRate);
    }
    if (binding.runtime && binding.plan) {
      const runtime = binding.runtime;
      runtime.engineSampleRate = safeRate;
      runtime.hostSampleRate = this.hostSampleRate;
      runtime.oversamplingRatio = this.oversamplingRatio;
      runtime.macroControls = this.macroControls;
      runtime.pitchModWheelSignal = this.pitchModWheelSignal;
      runtime.externalButtonEvents = this.externalButtonEvents;
      runtime.wireBreakEvent = this.wireBreakEvent;
      runtime.wireConnectEvent = this.wireConnectEvent;
      runtime.wireDisconnectEvent = this.wireDisconnectEvent;
      runtime.windowReopenEvent = this.windowReopenEvent;
      runtime.shootingStarExplosionEvent = this.shootingStarExplosionEvent;
      runtime.externalGroupInputs = new Map([[binding.gateNodeId, gateLevel]]);
      const frameOutput = runtime.evaluateFrame(frame, frames, [], safeRate, inputFrame);
      const triggerOutput = runtime.readRuntimePortOutput(
        frameOutput.frameValues,
        binding.outNodeId,
        "Out",
      );
      return Number(triggerOutput) || 0;
    }
    return 0;
  }

  // Band-limited step for the "instant attack, PolyBLEP'd" trigger -- rather
  // than a literal 0/1 hard jump (infinite bandwidth, aliases) or routing
  // through expAdsr's own attack segment (audibly not "instant"), smooth
  // exactly the one sample where the gate transitions using the same
  // polyBlep() correction the oscillators use for their edges. polyBlep is
  // only meaningful right at a discontinuity (phaseCycle == 0) -- it isn't
  // a multi-sample ramp, so this applies the correction once per edge and
  // stops (an earlier version kept advancing a "transition phase" through
  // the whole [0,1) range, which wandered into polyBlep's *other* branch
  // near phase 1, meant for an oscillator's opposite edge, producing a
  // spurious second blip well after the real transition -- caught via the
  // direct evaluateFrame trace test below).
  evaluateTriggerPatchStepImpulse(state, gateLevel, rate) {
    let value = gateLevel;
    if (gateLevel !== state.lastGate) {
      const delta = gateLevel - state.lastGate;
      state.lastGate = gateLevel;
      // polyBlep() is calibrated for a 2-unit jump (e.g. a square wave's
      // -1..1 edge); our gate steps by 1 unit (0..1), so halve its
      // correction and add rather than subtract -- this lands the
      // corrected sample at the midpoint of the step, matching the
      // square-wave oscillator's own use of this same function.
      value = gateLevel + (delta / 2) * this.polyBlep(0, 0.5);
    }
    return this.safeFilterNumber(value, state);
  }

  async setNativeModuleWasm(message) {
    if (!(message.bytes instanceof ArrayBuffer)) {
      return;
    }
    const name = String(message.name || "");
    const targetType = String(message.targetType || "");
    try {
      const result = await WebAssembly.instantiate(message.bytes, {});
      const exports = result?.instance?.exports || null;
      if (name === "ellipsoid" || targetType === "ellipsoid") {
        this.nativeEllipsoid = exports;
        this.nativeEllipsoidReady = Boolean(this.nativeEllipsoid?.soemdsp_ellipsoid_vector_sample);
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "ellipsoid",
          status: this.nativeEllipsoidReady ? "ready" : "missing exports",
        });
        return;
      }
      if (name === "soft_clipper" || targetType === "softClipper") {
        this.nativeSoftClipper = exports;
        this.nativeSoftClipperReady = Boolean(
          this.nativeSoftClipper?.soemdsp_soft_clipper_sample,
        );
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "soft_clipper",
          status: this.nativeSoftClipperReady ? "ready" : "missing exports",
        });
        return;
      }
      if (name === "sine_wavetable" || targetType === "sineWavetable") {
        this.nativeSineWavetable = exports;
        this.nativeSineWavetableReady = Boolean(
          this.nativeSineWavetable?.soemdsp_sine_wavetable_sin &&
          this.nativeSineWavetable?.soemdsp_sine_wavetable_cos,
        );
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "sine_wavetable",
          status: this.nativeSineWavetableReady ? "ready" : "missing exports",
        });
        return;
      }
      if (name === "additive_osc" || targetType === "additiveOsc") {
        this.nativeAdditiveOsc = exports;
        this.nativeAdditiveOscReady = Boolean(this.nativeAdditiveOsc?.soemdsp_additive_osc_sample);
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "additive_osc",
          status: this.nativeAdditiveOscReady ? "ready" : "missing exports",
        });
        return;
      }
      if (name === "shooting_star_explosion" || targetType === "shootingStarExplosion") {
        this.nativeShootingStarExplosion = exports;
        this.nativeShootingStarExplosionReady = Boolean(
          this.nativeShootingStarExplosion?.soemdsp_shooting_star_explosion_power,
        );
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "shooting_star_explosion",
          status: this.nativeShootingStarExplosionReady ? "ready" : "missing exports",
        });
        return;
      }
      this.port.postMessage({
        type: "nativeModuleStatus",
        name,
        status: "unsupported native module",
      });
    } catch (error) {
      this.port.postMessage({
        type: "nativeModuleStatus",
        name,
        status: "error",
        message: String(error?.message || error || "native module load failed"),
      });
    }
  }

  clearPlan() {
    this.destroyAllNativeStatefulModuleHandles(this);
    this.initNativeStatefulModuleMaps(this);
    this.inputConnections = new Map();
    this.triggerPatchBindings = new Map();
    this.triggerPatchGates = new Map();
    this.graphInputConnections = new Map();
    this.badNumberCount = 0;
    this.lastBadValueReason = "";
    this.lastBadValueNodeId = "";
    this.lastBadValueSource = "";
    this.inputMeterPeak = 0;
    this.inputMeterSamples = 0;
    this.inputMeterSquareSum = 0;
    this.meterClipCount = 0;
    this.meterCounter = 0;
    this.meterPeak = 0;
    this.meterProtectionMuteCount = 0;
    this.meterSamples = 0;
    this.meterSquareSum = 0;
    this.macroControls = new Array(10).fill(0);
    this.externalButtonEvents = new Map();
    this.wireBreakEvent = { pulseSamples: 0, gateSamples: 0 };
    this.wireConnectEvent = { pulseSamples: 0 };
    this.wireDisconnectEvent = { pulseSamples: 0 };
    this.windowReopenEvent = { pulseSamples: 0, gateSamples: 0, totalSamples: 0 };
    this.pitchModWheelSignal = { mod: 0, pitch: 0 };
    this.midiKeyboardGatePulseSamples = 0;
    this.midiKeyboardSignal = null;
    this.moduleGroupRuntimes = new Map();
    this.modulationConnections = new Map();
    this.nodeOutputs = new Map();
    this.nodes = new Map();
    this.order = [];
    this.patchFingerprint = "";
    this.patchCommandStates = new Map();
    this.engineSampleRate = sampleRate;
    this.hostSampleRate = sampleRate;
    this.oversamplingRatio = 1;
    for (const state of this.passiveFilterStates.values()) {
      this.destroyPassiveFilterNativeState(state);
    }
    this.clockDividerStates = new Map();
    this.clockStates = new Map();
    this.codeblockFunctions = new Map();
    this.delayedTriggerStates = new Map();
    for (const state of this.fractalBrownianNoiseStates.values()) {
      this.destroyFbmNativeState(state);
    }
    for (const state of this.ladderFilterStates.values()) {
      this.destroyLadderFilterNativeState(state);
    }
    for (const state of this.tb303FilterStates.values()) {
      this.destroyTb303FilterNativeState(state);
    }
    this.logSpiralStates = new Map();
    this.oscResetStates = new Map();
    this.graphLfoStates = new Map();
    this.randomClockStates = new Map();
    for (const state of this.reverbEffectStates.values()) {
      this.destroySabrinaReverbState(state);
    }
    for (const state of this.pllStates.values()) {
      this.destroyPllState(state);
    }
    for (const state of this.helmholtzStates.values()) {
      this.destroyHelmholtzState(state);
    }
    this.samplePlaybackStates = new Map();
    this.samples = new Map();
    this.scopeBuffers = new Map();
    this.scopeCounter = 0;
    this.smoothers = new Map();
    this.spiralStates = new Map();
    this.fractalSpiralStates = new Map();
    this.stepSequencerStates = new Map();
    this.triggerCounterStates = new Map();
    this.triggerDividerStates = new Map();
    this.triangleStates = new Map();
    this.visualSinks = [];
    this.resetVisualControls();
  }

  setPlan(plan, message = {}) {
    const patchFingerprint = message.patchFingerprint || plan?.patchFingerprint || "";
    this.patchFingerprint = patchFingerprint;
    this.planSerial = message.planSerial || 0;
    this.sessionId = message.sessionId || 0;
    this.autoSmoothingSeconds = 0.016;
    this.hostSampleRate = Math.max(1, Number(message.sampleRate) || sampleRate || 44100);
    const requestedRatio = Number(message.oversamplingRatio) ||
      ((Number(message.engineSampleRate) || this.hostSampleRate) / this.hostSampleRate);
    this.oversamplingRatio = Math.max(1, Math.min(4, Math.round(requestedRatio) || 1));
    this.engineSampleRate = this.hostSampleRate * this.oversamplingRatio;
    this.timing = this.normalizePatchTiming(plan?.timing);
    this.metronomePhase = 0;
    this.metronomeBeatCount = 0;
    if (this.raptEllipticDecimatorRatio !== this.oversamplingRatio) {
      this.resetRaptEllipticDecimator();
    }
    const nodes = Array.isArray(plan?.nodes) ? plan.nodes : [];
    this.audioPlayerNodeIds = nodes
      .filter((node) => node?.type === "audioPlayer")
      .map((node) => String(node.id || ""))
      .filter(Boolean);
    const ids = new Set(nodes.map((node) => node.id));
    this.nodes = new Map(nodes.map((node) => [node.id, {
      id: node.id,
      codeblock: this.normalizeCodeblock(node.codeblock),
      moduleGroup: node.moduleGroup || null,
      moduleGroupPlan: node.moduleGroupPlan || null,
      paramMeta: node.paramMeta || {},
      params: node.params || {},
      sample: node.sample || null,
      type: node.type,
    }]));
    this.samples = new Map((Array.isArray(plan?.samples) ? plan.samples : []).map((sample) => [
      String(sample?.id || ""),
      {
        ...sample,
        channelData: (Array.isArray(sample?.channelData) ? sample.channelData : []).map((channel) =>
          channel instanceof Float32Array ? channel : new Float32Array(channel || [])),
        samples: sample?.samples instanceof Float32Array ? sample.samples : new Float32Array(sample?.samples || []),
      },
    ]).filter(([id]) => id));
    this.order = Array.isArray(plan?.order) ? [...plan.order] : [...ids];
    this.outputNode = plan?.outputNode || "output";
    this.scopeCaptureNodeIds = Array.isArray(plan?.scopeCaptureNodeIds)
      ? plan.scopeCaptureNodeIds.map((nodeId) => String(nodeId || "")).filter(Boolean)
      : [];
    this.visualSinks = (Array.isArray(plan?.visualSinks) ? plan.visualSinks : []).map((sink) => ({
      ...sink,
      bufferedInputs: Array.isArray(sink?.bufferedInputs) ? [...sink.bufferedInputs] : [],
      inputs: (Array.isArray(sink?.inputs) ? sink.inputs : []).map((input) => ({ ...input })),
    }));
    this.syncVisualInputBuffers();
    const newInputConnections = this.buildInputConnectionMap(plan?.connections, ids);
    this.inputConnections = newInputConnections;
    this.graphInputConnections = this.buildGraphInputConnectionMap(plan?.graphConnections, ids);
    this.modulationConnections = this.buildModulationConnectionMap(plan?.modulations, ids);
    this.resetVisualControls();

    for (const id of ids) {
      if (!this.nodeOutputs.has(id)) {
        this.nodeOutputs.set(id, 0);
      }
      const node = this.nodes.get(id);
      if (nodeLiveIsPolyBlepOscillatorType(node?.type) && !this.phases.has(id)) {
        this.phases.set(id, 0);
      }
      if (nodeLiveIsPolyBlepOscillatorType(node?.type) && !this.oscResetStates.has(id)) {
        this.oscResetStates.set(id, this.createOscResetState());
      }
      if (nodeLiveIsPolyBlepOscillatorType(node?.type) && !this.triangleStates.has(id)) {
        this.triangleStates.set(id, 0);
      }
      if (nodeLiveIsPolyBlepOscillatorType(node?.type) && !this.noiseSeeds.has(id)) {
        this.noiseSeeds.set(id, this.stableSeed(id));
      }
      if (node?.type === "spiral" && !this.spiralStates.has(id)) {
        this.spiralStates.set(id, this.createSpiralState());
      }
      if (node?.type === "fractalSpiral" && !this.fractalSpiralStates.has(id)) {
        this.fractalSpiralStates.set(id, this.createFractalSpiralState());
      }
      if (node?.type === "logSpiral" && !this.logSpiralStates.has(id)) {
        this.logSpiralStates.set(id, this.createLogSpiralState());
      }
      this.instantiateNativeStatefulModuleStateIfNeeded(this, node, id);
      this.instantiateNativeStatefulModuleStateIfNeeded(this, node, id);
      if (node?.type === "clock" && !this.clockStates.has(id)) {
        this.clockStates.set(id, this.createClockState());
      }
      if ((node?.type === "graph" || node?.type === "graph2") && !this.graphLfoStates.has(id)) {
        this.graphLfoStates.set(id, this.createGraphLfoState());
      }
      if (node?.type === "clockDivider" && !this.clockDividerStates.has(id)) {
        this.clockDividerStates.set(id, this.createTriggerDividerState());
      }
      if (node?.type === "delayedTrigger" && !this.delayedTriggerStates.has(id)) {
        this.delayedTriggerStates.set(id, this.createDelayedTriggerState());
      }
      if (node?.type === "randomClock" && !this.randomClockStates.has(id)) {
        this.randomClockStates.set(id, this.createRandomClockState());
      }
      if ((node?.type === "samplePlayer" || node?.type === "sampleLooper" || node?.type === "audioPlayer") && !this.samplePlaybackStates.has(id)) {
        this.samplePlaybackStates.set(id, this.createSamplePlaybackState());
      }
      if ((node?.type === "nextPatch" || node?.type === "previousPatch") && !this.patchCommandStates.has(id)) {
        this.patchCommandStates.set(id, this.createPatchCommandState());
      }
      if (node?.type === "stepSequencer" && !this.stepSequencerStates.has(id)) {
        this.stepSequencerStates.set(id, this.createStepSequencerState());
      }
      if (node?.type === "triggerCounter" && !this.triggerCounterStates.has(id)) {
        this.triggerCounterStates.set(id, this.createTriggerCounterState());
      }
      if (node?.type === "triggerDivider" && !this.triggerDividerStates.has(id)) {
        this.triggerDividerStates.set(id, this.createTriggerDividerState());
      }
      if (node?.type === "moduleGroup" && node.moduleGroupPlan && !this.moduleGroupRuntimes.has(id)) {
        this.moduleGroupRuntimes.set(id, this.createNestedRuntime(node.moduleGroupPlan));
      }
      for (const [key, value] of Object.entries(node?.params || {})) {
        const smootherKey = this.parameterKey(id, key);
        const metadata = node.paramMeta?.[key];
        if (!this.smoothers.has(smootherKey)) {
          this.smoothers.set(smootherKey, this.createSmoother(value, metadata));
        } else {
          this.updateSmoother(this.smoothers.get(smootherKey), value, metadata);
        }
      }
    }

    for (const id of [...this.phases.keys()]) {
      if (!ids.has(id)) {
        this.phases.delete(id);
      }
    }
    for (const id of [...this.oscResetStates.keys()]) {
      if (!ids.has(id)) {
        this.oscResetStates.delete(id);
      }
    }
    for (const id of [...this.graphLfoStates.keys()]) {
      if (!ids.has(id)) {
        this.graphLfoStates.delete(id);
      }
    }
    for (const id of [...this.triangleStates.keys()]) {
      if (!ids.has(id)) {
        this.triangleStates.delete(id);
      }
    }
    for (const id of [...this.oscillatorLastPhaseIncrements.keys()]) {
      const nodeId = String(id).split(":")[0];
      if (!ids.has(nodeId)) {
        this.oscillatorLastPhaseIncrements.delete(id);
      }
    }
    for (const id of [...this.oscillatorStoppedSamples.keys()]) {
      const nodeId = String(id).split(":")[0];
      if (!ids.has(nodeId)) {
        this.oscillatorStoppedSamples.delete(id);
      }
    }
    for (const id of [...this.noiseSeeds.keys()]) {
      const nodeId = String(id).split(":")[0];
      if (!ids.has(nodeId)) {
        this.noiseSeeds.delete(id);
      }
    }
    for (const id of [...this.noiseSeedKeys.keys()]) {
      const nodeId = String(id).split(":")[0];
      if (!ids.has(nodeId)) {
        this.noiseSeedKeys.delete(id);
      }
    }
    for (const id of [...this.nodeOutputs.keys()]) {
      if (!ids.has(id)) {
        this.nodeOutputs.delete(id);
      }
    }
    for (const id of [...this.fractalSpiralStates.keys()]) {
      if (!ids.has(id)) {
        this.fractalSpiralStates.delete(id);
      }
    }
    for (const id of [...this.spiralStates.keys()]) {
      if (!ids.has(id)) {
        this.spiralStates.delete(id);
      }
    }
    for (const id of [...this.logSpiralStates.keys()]) {
      if (!ids.has(id)) {
        this.logSpiralStates.delete(id);
      }
    }
    for (const id of [...this.lorenzAttractorStates.keys()]) {
      if (!ids.has(id)) {
        this.lorenzAttractorStates.delete(id);
      }
    }
    this.pruneRemovedNativeStatefulModuleStates(this, ids);
    for (const id of [...this.chordMemoryStates.keys()]) {
      if (!ids.has(id)) {
        this.chordMemoryStates.delete(id);
      }
    }
    for (const id of [...this.turingMachineStates.keys()]) {
      if (!ids.has(id)) {
        this.turingMachineStates.delete(id);
      }
    }
    for (const id of [...this.chaoticPhaseLockingFilterStates.keys()]) {
      if (!ids.has(id)) {
        this.chaoticPhaseLockingFilterStates.delete(id);
      }
    }
    for (const id of [...this.linearEnvelopeStates.keys()]) {
      if (!ids.has(id)) {
        this.linearEnvelopeStates.delete(id);
      }
    }
    for (const id of [...this.clockStates.keys()]) {
      if (!ids.has(id)) {
        this.clockStates.delete(id);
      }
    }
    for (const id of [...this.codeblockFunctions.keys()]) {
      if (!ids.has(id)) {
        this.codeblockFunctions.delete(id);
      }
    }
    for (const id of [...this.cookbookFilterStates.keys()]) {
      if (!ids.has(id)) {
        this.cookbookFilterStates.delete(id);
      }
    }
    for (const id of [...this.clockDividerStates.keys()]) {
      if (!ids.has(id)) {
        this.clockDividerStates.delete(id);
      }
    }
    for (const id of [...this.delayedTriggerStates.keys()]) {
      if (!ids.has(id)) {
        this.delayedTriggerStates.delete(id);
      }
    }
    for (const id of [...this.delayEffectStates.keys()]) {
      if (!ids.has(id)) {
        this.delayEffectStates.delete(id);
      }
    }
    for (const id of [...this.reverbEffectStates.keys()]) {
      if (!ids.has(id)) {
        this.destroySabrinaReverbState(this.reverbEffectStates.get(id));
        this.reverbEffectStates.delete(id);
      }
    }
    for (const id of [...this.pllStates.keys()]) {
      if (!ids.has(id)) {
        this.destroyPllState(this.pllStates.get(id));
        this.pllStates.delete(id);
      }
    }
    for (const id of [...this.helmholtzStates.keys()]) {
      if (!ids.has(id)) {
        this.destroyHelmholtzState(this.helmholtzStates.get(id));
        this.helmholtzStates.delete(id);
      }
    }
    for (const id of [...this.sampleHoldStates.keys()]) {
      if (!ids.has(id)) {
        this.sampleHoldStates.delete(id);
      }
    }
    for (const id of [...this.samplePlaybackStates.keys()]) {
      if (!ids.has(id)) {
        this.samplePlaybackStates.delete(id);
      }
    }
    for (const id of [...this.patchCommandStates.keys()]) {
      if (!ids.has(id)) {
        this.patchCommandStates.delete(id);
      }
    }
    for (const id of [...this.slewLimiterStates.keys()]) {
      if (!ids.has(id)) {
        this.slewLimiterStates.delete(id);
      }
    }
    for (const id of [...this.expAdsrStates.keys()]) {
      if (!ids.has(id)) {
        this.expAdsrStates.delete(id);
      }
    }
    for (const id of [...this.randomWalkStates.keys()]) {
      if (!ids.has(id)) {
        this.randomWalkStates.delete(id);
      }
    }
    for (const id of [...this.randomClockStates.keys()]) {
      if (!ids.has(id)) {
        this.randomClockStates.delete(id);
      }
    }
    for (const id of [...this.flowerChildEnvelopeFollowerStates.keys()]) {
      if (!ids.has(id)) {
        this.flowerChildEnvelopeFollowerStates.delete(id);
      }
    }
    for (const id of [...this.pluckEnvelopeStates.keys()]) {
      if (!ids.has(id)) {
        this.pluckEnvelopeStates.delete(id);
      }
    }
    for (const id of [...this.stepSequencerStates.keys()]) {
      if (!ids.has(id)) {
        this.stepSequencerStates.delete(id);
      }
    }
    for (const id of [...this.triggerCounterStates.keys()]) {
      if (!ids.has(id)) {
        this.triggerCounterStates.delete(id);
      }
    }
    for (const id of [...this.triggerDividerStates.keys()]) {
      if (!ids.has(id)) {
        this.triggerDividerStates.delete(id);
      }
    }
    for (const id of [...this.moduleGroupRuntimes.keys()]) {
      if (!ids.has(id)) {
        this.moduleGroupRuntimes.delete(id);
      }
    }
    for (const key of [...this.smoothers.keys()]) {
      const [nodeId, parameter] = key.split(".");
      if (!ids.has(nodeId) || !(parameter in (this.nodes.get(nodeId)?.params || {}))) {
        this.smoothers.delete(key);
      }
    }
    this.port.postMessage({
      connectionCount: Array.isArray(plan?.connections) ? plan.connections.length : 0,
      feedbackConnectionCount: Array.isArray(plan?.feedbackConnections) ? plan.feedbackConnections.length : 0,
      feedbackModulationCount: Array.isArray(plan?.feedbackModulations) ? plan.feedbackModulations.length : 0,
      feedbackModulations: (Array.isArray(plan?.feedbackModulations) ? plan.feedbackModulations : []).map(
        (modulation) =>
          `${modulation.sourceNode}.${modulation.sourcePort} -> ${modulation.destinationNode}.${modulation.destinationParam}`,
      ),
      feedbackSignals: (Array.isArray(plan?.feedbackConnections) ? plan.feedbackConnections : []).map(
        (connection) =>
          `${connection.sourceNode}.${connection.sourcePort} -> ${connection.destinationNode}.${connection.destinationPort}`,
      ),
      modulationCount: Array.isArray(plan?.modulations) ? plan.modulations.length : 0,
      engineSampleRate: this.engineSampleRate,
      nodeCount: this.nodes.size,
      order: [...this.order],
      oversamplingRatio: this.oversamplingRatio,
      patchFingerprint,
      planSerial: this.planSerial,
      sampleRate: this.hostSampleRate,
      sessionId: this.sessionId,
      speakerOutputActive: Boolean(plan?.speakerOutputActive),
      stateReadCount: (
        (Array.isArray(plan?.feedbackConnections) ? plan.feedbackConnections.length : 0) +
        (Array.isArray(plan?.feedbackModulations) ? plan.feedbackModulations.length : 0)
      ),
      type: "planApplied",
      visualSinkCount: Array.isArray(plan?.visualSinks) ? plan.visualSinks.length : 0,
      visualSinks: Array.isArray(plan?.visualSinks) ? plan.visualSinks : [],
    });
  }

  setConnections(plan, message = {}) {
    this.patchFingerprint = message.patchFingerprint || plan?.patchFingerprint || this.patchFingerprint || "";
    this.planSerial = message.planSerial || this.planSerial || 0;
    this.sessionId = message.sessionId || this.sessionId || 0;
    this.outputNode = plan?.outputNode || this.outputNode || "output";
    this.scopeCaptureNodeIds = Array.isArray(plan?.scopeCaptureNodeIds)
      ? plan.scopeCaptureNodeIds.map((nodeId) => String(nodeId || "")).filter(Boolean)
      : this.scopeCaptureNodeIds;
    this.visualSinks = (Array.isArray(plan?.visualSinks) ? plan.visualSinks : this.visualSinks).map((sink) => ({
      ...sink,
      bufferedInputs: Array.isArray(sink?.bufferedInputs) ? [...sink.bufferedInputs] : [],
      inputs: (Array.isArray(sink?.inputs) ? sink.inputs : []).map((input) => ({ ...input })),
    }));
    this.syncVisualInputBuffers();
    const ids = new Set([...this.nodes.keys()]);
    this.inputConnections = this.buildInputConnectionMap(plan?.connections, ids);
    this.graphInputConnections = this.buildGraphInputConnectionMap(plan?.graphConnections, ids);
    this.modulationConnections = this.buildModulationConnectionMap(plan?.modulations, ids);
  }

  setParams(nodes, message = {}) {
    const patchFingerprint = message.patchFingerprint || "";
    this.patchFingerprint = patchFingerprint || this.patchFingerprint;
    this.planSerial = message.planSerial || 0;
    this.sessionId = message.sessionId || 0;
    this.autoSmoothingSeconds = this.clampAutoSmoothingSeconds(message.autoSmoothingSeconds);
    this.syncNestedAutoSmoothingSeconds(this.autoSmoothingSeconds);
    let parameterCount = 0;
    for (const node of Array.isArray(nodes) ? nodes : []) {
      const current = this.nodes.get(node.id);
      if (!current) {
        continue;
      }
      current.params = { ...(node.params || {}) };
      current.paramMeta = { ...(node.paramMeta || {}) };
      parameterCount += Object.keys(current.params || {}).length;
      for (const [key, value] of Object.entries(current.params || {})) {
        const smootherKey = this.parameterKey(node.id, key);
        const metadata = current.paramMeta?.[key];
        if (!this.smoothers.has(smootherKey)) {
          this.smoothers.set(smootherKey, this.createSmoother(value, metadata));
        } else {
          this.updateSmoother(this.smoothers.get(smootherKey), value, metadata);
        }
      }
    }
    this.port.postMessage({
      nodeCount: this.nodes.size,
      order: [...this.order],
      parameterCount,
      patchFingerprint,
      planSerial: this.planSerial,
      sessionId: this.sessionId,
      type: "paramsApplied",
    });
  }

  setMidiKeyboardSignal(signal) {
    const source = signal && typeof signal === "object" ? signal : {};
    const midi = this.clampValue(Math.round(Number(source.midi) || 60), 0, 127);
    const keyIndex = this.clampValue(Number(source.keyIndex) || 0, 0, 24);
    const keyQuantized = this.clampValue(Number(source.keyQuantized) || keyIndex / 24, 0, 1);
    const frequency = Math.max(0, Number(source.frequency) || 440 * (2 ** ((midi - 69) / 12)));
    if (Number(source.gatePulse) > 0) {
      this.midiKeyboardGatePulseSamples = 1;
    }
    this.midiKeyboardSignal = {
      gate: Number(source.gate) > 0 ? 1 : 0,
      gatePulse: Number(source.gatePulse) > 0 ? 1 : 0,
      x: this.clampValue(Number(source.x) || keyQuantized, 0, 1),
      y: this.clampValue(Number(source.y) || 0, 0, 1),
      keyIndex,
      keyQuantized,
      midi,
      pitchValue: this.clampValue(Number(source.pitchValue) || midi, 0, 127),
      midiNormalized: this.clampValue(Number(source.midiNormalized) || midi / 127, 0, 1),
      tenthVoltPerOctave: this.clampValue(Number(source.tenthVoltPerOctave) || midi / 120, 0, 1),
      increment: Math.max(0, Number(source.increment) || frequency / Math.max(1, this.engineSampleRate || sampleRate)),
      frequency,
    };
  }

  setMacroControls(values) {
    this.macroControls = Array.from({ length: 10 }, (_, index) => (
      this.clampValue(Number(values?.[index]) || 0, 0, 1)
    ));
  }

  setPitchModWheelSignal(signal) {
    const source = signal && typeof signal === "object" ? signal : {};
    const pitch = Number(source.pitch);
    this.pitchModWheelSignal = {
      mod: this.clampValue(Number(source.mod) || 0, 0, 1),
      pitch: this.clampValue(Number.isFinite(pitch) ? pitch : 0, -1, 1),
    };
  }

  normalizeExternalButtonEventName(name) {
    const key = String(name || "").trim().toLowerCase();
    if (key === "mousedown" || key === "pointerdown") return "down";
    if (key === "mouseup" || key === "pointerup") return "up";
    if (key === "mouseenter" || key === "pointerenter") return "enter";
    if (key === "mouseleave" || key === "pointerleave") return "leave";
    return ["click", "hover", "down", "up", "enter", "leave"].includes(key) ? key : "";
  }

  setExternalButtonEvent(name) {
    const key = this.normalizeExternalButtonEventName(name);
    if (!key) return;
    const samples = Math.max(1, Math.round(Math.max(1, this.engineSampleRate || sampleRate) * 0.02));
    this.externalButtonEvents.set(key, Math.max(Number(this.externalButtonEvents.get(key)) || 0, samples));
  }

  externalButtonEventPulse(name) {
    const remaining = Number(this.externalButtonEvents.get(name)) || 0;
    if (remaining <= 0) {
      this.externalButtonEvents.delete(name);
      return 0;
    }
    this.externalButtonEvents.set(name, remaining - 1);
    return 1;
  }

  wireBreakGateSamples() {
    return Math.max(1, Math.round(Math.max(1, this.engineSampleRate || sampleRate) * 0.52));
  }

  gameTriggerPulseSamples() {
    return Math.max(1, Math.round(Math.max(1, this.engineSampleRate || sampleRate) * 0.02));
  }

  setWireBreakEvent() {
    const event = this.wireBreakEvent && typeof this.wireBreakEvent === "object"
      ? this.wireBreakEvent
      : { pulseSamples: 0, gateSamples: 0 };
    event.pulseSamples = Math.max(Number(event.pulseSamples) || 0, this.gameTriggerPulseSamples());
    event.gateSamples = Math.max(Number(event.gateSamples) || 0, this.wireBreakGateSamples());
    this.wireBreakEvent = event;
  }

  wireBreakEventSample() {
    const event = this.wireBreakEvent && typeof this.wireBreakEvent === "object"
      ? this.wireBreakEvent
      : { pulseSamples: 0, gateSamples: 0 };
    const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
    const gateSamples = Math.max(0, Number(event.gateSamples) || 0);
    event.pulseSamples = Math.max(0, pulseSamples - 1);
    event.gateSamples = Math.max(0, gateSamples - 1);
    this.wireBreakEvent = event;
    return {
      Pulse: pulseSamples > 0 ? 1 : 0,
      Gate: gateSamples > 0 ? 1 : 0,
    };
  }

  setWireConnectEvent() {
    const event = this.wireConnectEvent && typeof this.wireConnectEvent === "object"
      ? this.wireConnectEvent
      : { pulseSamples: 0 };
    event.pulseSamples = Math.max(Number(event.pulseSamples) || 0, this.gameTriggerPulseSamples());
    this.wireConnectEvent = event;
  }

  wireConnectEventSample() {
    const event = this.wireConnectEvent && typeof this.wireConnectEvent === "object"
      ? this.wireConnectEvent
      : { pulseSamples: 0 };
    const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
    event.pulseSamples = Math.max(0, pulseSamples - 1);
    this.wireConnectEvent = event;
    return { Pulse: pulseSamples > 0 ? 1 : 0 };
  }

  setWireDisconnectEvent() {
    const event = this.wireDisconnectEvent && typeof this.wireDisconnectEvent === "object"
      ? this.wireDisconnectEvent
      : { pulseSamples: 0 };
    event.pulseSamples = Math.max(Number(event.pulseSamples) || 0, this.gameTriggerPulseSamples());
    this.wireDisconnectEvent = event;
  }

  wireDisconnectEventSample() {
    const event = this.wireDisconnectEvent && typeof this.wireDisconnectEvent === "object"
      ? this.wireDisconnectEvent
      : { pulseSamples: 0 };
    const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
    event.pulseSamples = Math.max(0, pulseSamples - 1);
    this.wireDisconnectEvent = event;
    return { Pulse: pulseSamples > 0 ? 1 : 0 };
  }

  setShootingStarExplosionEvent(speed = null) {
    const event = this.shootingStarExplosionEvent && typeof this.shootingStarExplosionEvent === "object"
      ? this.shootingStarExplosionEvent
      : { pulseSamples: 0, speed: null };
    event.pulseSamples = Math.max(0, Number(event.pulseSamples) || 0) + 1;
    const normalizedSpeed = Number(speed);
    event.speed = Number.isFinite(normalizedSpeed) ? normalizedSpeed : null;
    this.shootingStarExplosionEvent = event;
  }

  nativeShootingStarExplosionPower(speed, lowRange = 0, highRange = 1) {
    const low = Number(lowRange) || 0;
    const high = Number(highRange) || 0;
    const lo = Math.min(low, high);
    const hi = Math.max(low, high);
    const fallback = () => {
      // speed is expected 0-1 (the site's trigger intensity), interpolated
      // linearly into [lowRange, highRange] to get the actual pulse amplitude.
      // No speed data (not finite) keeps the pulse at max amplitude.
      if (!Number.isFinite(speed)) return hi;
      const normalizedSpeed = Math.max(0, Math.min(1, speed));
      return lo + normalizedSpeed * (hi - lo);
    };
    if (!this.nativeShootingStarExplosionReady || !this.nativeShootingStarExplosion?.soemdsp_shooting_star_explosion_power) {
      return fallback();
    }
    try {
      return this.safeFilterNumber(
        this.nativeShootingStarExplosion.soemdsp_shooting_star_explosion_power(
          Number.isFinite(speed) ? speed : -1,
          low,
          high,
        ),
        null,
      );
    } catch (error) {
      this.nativeShootingStarExplosionReady = false;
      this.port.postMessage({
        type: "nativeModuleStatus",
        name: "shooting_star_explosion",
        status: "disabled",
        message: String(error?.message || error || "native Shooting Star Explosion failed"),
      });
      return fallback();
    }
  }

  shootingStarExplosionEventSample(lowRange = 0, highRange = 1) {
    const event = this.shootingStarExplosionEvent && typeof this.shootingStarExplosionEvent === "object"
      ? this.shootingStarExplosionEvent
      : { pulseSamples: 0 };
    const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
    const speed = Number(event.speed);
    const power = this.nativeShootingStarExplosionPower(speed, lowRange, highRange);
    event.pulseSamples = Math.max(0, pulseSamples - 1);
    this.shootingStarExplosionEvent = event;
    return { Pulse: pulseSamples > 0 ? power : 0 };
  }

  windowReopenGateSamples() {
    return Math.max(1, Math.round(Math.max(1, this.engineSampleRate || sampleRate) * 1));
  }

  setWindowReopenEvent() {
    const samples = this.windowReopenGateSamples();
    this.windowReopenEvent = {
      gateSamples: samples,
      pulseSamples: this.gameTriggerPulseSamples(),
      totalSamples: samples,
    };
  }

  windowReopenEventSample() {
    const event = this.windowReopenEvent && typeof this.windowReopenEvent === "object"
      ? this.windowReopenEvent
      : { pulseSamples: 0, gateSamples: 0, totalSamples: 0 };
    const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
    const gateSamples = Math.max(0, Number(event.gateSamples) || 0);
    const totalSamples = Math.max(1, Number(event.totalSamples) || gateSamples || 1);
    const progress = gateSamples > 0 ? 1 - gateSamples / totalSamples : 1;
    const sine = gateSamples > 0 ? Math.sin(Math.PI * Math.max(0, Math.min(1, progress))) : 0;
    event.pulseSamples = Math.max(0, pulseSamples - 1);
    event.gateSamples = Math.max(0, gateSamples - 1);
    this.windowReopenEvent = event;
    return {
      Pulse: pulseSamples > 0 ? 1 : 0,
      Gate: gateSamples > 0 ? 1 : 0,
      Sine: sine,
    };
  }

  buildConnectionMap(items, ids, keyForItem) {
    const map = new Map();
    for (const item of Array.isArray(items) ? items : []) {
      if (!ids.has(item.sourceNode) || !ids.has(item.destinationNode)) {
        continue;
      }
      const key = keyForItem(item);
      const list = map.get(key) || [];
      list.push({ ...item });
      map.set(key, list);
    }
    return map;
  }

  buildInputConnectionMap(connections, ids) {
    return this.buildConnectionMap(
      connections,
      ids,
      (connection) => this.inputKey(connection.destinationNode, connection.destinationPort),
    );
  }

  buildModulationConnectionMap(modulations, ids) {
    return this.buildConnectionMap(
      modulations,
      ids,
      (modulation) => this.parameterKey(modulation.destinationNode, modulation.destinationParam),
    );
  }

  buildGraphInputConnectionMap(graphConnections, ids) {
    return this.buildConnectionMap(
      graphConnections,
      ids,
      (connection) => this.graphInputKey(connection.destinationNode, connection.destinationGraphInput),
    );
  }

  inputKey(node, port) {
    return `${node}.${port}`;
  }

  graphInputKey(node, graphInput) {
    return `${node}.${graphInput}`;
  }

  parameterKey(node, parameter) {
    return `${node}.${parameter}`;
  }

  stableSeed(text) {
    let seed = 0x12345678;
    for (const character of String(text)) {
      seed = (Math.imul(seed ^ character.charCodeAt(0), 16777619)) >>> 0;
    }
    return seed || 0x12345678;
  }

  wrapValue(value, min, max) {
    const range = max - min;
    if (!Number.isFinite(range) || range <= 0) {
      return min;
    }
    return min + ((((value - min) % range) + range) % range);
  }

  clampValue(value, min, max) {
    const number = Number(value);
    const reason = this.badValueReason(number);
    if (reason) {
      this.badNumberCount += 1;
      if (!this.lastBadValueNodeId) {
        this.lastBadValueReason = reason;
        this.lastBadValueSource = "";
      }
      return 0;
    }
    return Math.max(min, Math.min(max, number));
  }

  normalizeGraphNumber(value, fallback = 0, min = 0, max = 1) {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.max(min, Math.min(max, number))
      : fallback;
  }

  normalizeGraphShape(value) {
    const shape = String(value || "").trim();
    return shape === "linear" || shape === "smooth" || shape === "exponential" || shape === "rational" || shape === "hold"
      ? shape
      : "rational";
  }

  normalizeGraphNode(value = {}, index = 0) {
    const source = value && typeof value === "object" ? value : {};
    const fallback = index <= 0
      ? { c: 0, shape: "linear", x: 0, y: 0 }
      : { c: 0, shape: "rational", x: 1, y: 1 };
    return {
      c: this.normalizeGraphNumber(source.c, fallback.c, -0.999, 0.999),
      shape: this.normalizeGraphShape(source.shape ?? fallback.shape),
      x: this.normalizeGraphNumber(source.x, fallback.x),
      y: this.normalizeGraphNumber(source.y, fallback.y),
    };
  }

  normalizeGraph(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const inputNodes = Array.isArray(source.nodes) && source.nodes.length >= 2
      ? source.nodes
      : [{ c: 0, shape: "linear", x: 0, y: 0 }, { c: 0, shape: "rational", x: 1, y: 1 }];
    const nodes = inputNodes
      .slice(0, 32)
      .map((node, index) => this.normalizeGraphNode(node, index))
      .sort((left, right) => left.x - right.x);
    if (nodes.length < 2) {
      nodes.push(
        this.normalizeGraphNode({ c: 0, shape: "linear", x: 0, y: 0 }, 0),
        this.normalizeGraphNode({ c: 0, shape: "rational", x: 1, y: 1 }, 1),
      );
    }
    return { nodes };
  }

  graphEndpointYLockEnabledForNode(node) {
    return (node?.type === "graph" || node?.type === "graph2") && Number(node?.params?.lockEndpointY) >= 0.5;
  }

  graphWithLockedEndpointY(graphValue) {
    const graph = this.normalizeGraph(graphValue);
    if (graph.nodes.length < 2) {
      return graph;
    }
    const lastIndex = graph.nodes.length - 1;
    const anchorY = this.normalizeGraphNumber(graph.nodes[0]?.y, 0);
    const nodes = graph.nodes.map((node, index) => (
      index === 0 || index === lastIndex
        ? this.normalizeGraphNode({ ...node, y: anchorY }, index)
        : node
    ));
    return this.normalizeGraph({ ...graph, nodes });
  }

  graphForNode(node) {
    return this.graphEndpointYLockEnabledForNode(node)
      ? this.graphWithLockedEndpointY(node?.graph)
      : this.normalizeGraph(node?.graph);
  }

  graphRationalCurve(position, contour = 0) {
    const p = this.normalizeGraphNumber(position, 0, 0, 1);
    const c = this.normalizeGraphNumber(contour, 0, -0.999, 0.999);
    if (Math.abs(c) < 0.000001) {
      return p;
    }
    return c < 0
      ? (p * (1 + c)) / (1 + c * p)
      : p / (1 - c + c * p);
  }

  graphExponentialCurve(position, contour = 0) {
    const p = this.normalizeGraphNumber(position, 0, 0, 1);
    const c = this.normalizeGraphNumber(0.5 * (contour + 1), 0.5, 0.001, 0.999);
    const a = 2 * Math.log((1 - c) / c);
    if (!Number.isFinite(a) || Math.abs(a) < 0.000001) {
      return p;
    }
    const denominator = 1 - Math.exp(a);
    return Math.abs(denominator) < 0.000001 ? p : (1 - Math.exp(p * a)) / denominator;
  }

  graphSmoothCurve(position) {
    const p = this.normalizeGraphNumber(position, 0, 0, 1);
    return p * p * (3 - 2 * p);
  }

  normalizeGraph2SmoothingMode(value) {
    if (Number.isFinite(Number(value))) {
      return ["linear", "smooth", "meander", "quadratic", "cubic"][Math.max(0, Math.min(4, Math.round(Number(value))))];
    }
    const mode = String(value || "").trim().toLowerCase();
    return ["linear", "smooth", "meander", "quadratic", "cubic"].includes(mode) ? mode : "smooth";
  }

  graphMeanderCurve(position, index = 0) {
    const p = this.graphSmoothCurve(position);
    const wobblePhase = (index * 0.371) % 1;
    const wobble = Math.sin(Math.PI * p) * Math.sin((p * 1.5 + wobblePhase) * Math.PI * 2) * 0.075;
    return this.normalizeGraphNumber(p + wobble, p, 0, 1);
  }

  graphModeCurve(position, mode, index = 0) {
    const normalizedMode = this.normalizeGraph2SmoothingMode(mode);
    if (normalizedMode === "linear") {
      return this.normalizeGraphNumber(position, 0, 0, 1);
    }
    if (normalizedMode === "meander") {
      return this.graphMeanderCurve(position, index);
    }
    return this.graphSmoothCurve(position);
  }

  graphBezierPointAt(nodes, position = 0) {
    const t = this.normalizeGraphNumber(position, 0, 0, 1);
    let points = nodes.map((node) => ({
      x: this.normalizeGraphNumber(node.x, 0),
      y: this.normalizeGraphNumber(node.y, 0),
    }));
    if (!points.length) {
      return { x: 0, y: 0 };
    }
    while (points.length > 1) {
      points = points.slice(0, -1).map((point, index) => {
        const next = points[index + 1];
        return {
          x: point.x + (next.x - point.x) * t,
          y: point.y + (next.y - point.y) * t,
        };
      });
    }
    return points[0];
  }

  graphBezierValueAt(graph, xValue) {
    const x = this.normalizeGraphNumber(xValue, 0, -Infinity, Infinity);
    if (graph.nodes.length < 2) {
      return graph.nodes[0]?.y ?? 0;
    }
    if (x <= graph.nodes[0].x) {
      return graph.nodes[0].y;
    }
    const last = graph.nodes[graph.nodes.length - 1];
    if (x >= last.x) {
      return last.y;
    }
    let low = 0;
    let high = 1;
    let point = this.graphBezierPointAt(graph.nodes, x);
    for (let iteration = 0; iteration < 28; iteration += 1) {
      const t = (low + high) * 0.5;
      point = this.graphBezierPointAt(graph.nodes, t);
      if (point.x < x) {
        low = t;
      } else {
        high = t;
      }
    }
    return point.y;
  }

  graphInterpolationWindowStart(nodes, x, degree) {
    const targetCount = Math.max(2, Math.min(nodes.length, degree + 1));
    let segmentIndex = 0;
    for (let index = 0; index < nodes.length - 1; index += 1) {
      if (x <= nodes[index + 1].x) {
        segmentIndex = index;
        break;
      }
      segmentIndex = index;
    }
    const start = segmentIndex - Math.max(0, Math.floor((targetCount - 2) * 0.5));
    return Math.max(0, Math.min(nodes.length - targetCount, start));
  }

  graphLagrangeValueAt(graph, xValue, degree = 3) {
    const x = this.normalizeGraphNumber(xValue, 0, -Infinity, Infinity);
    const nodes = graph.nodes;
    if (nodes.length < 2) {
      return nodes[0]?.y ?? 0;
    }
    for (const node of nodes) {
      if (Math.abs(x - node.x) < 0.000001) {
        return node.y;
      }
    }
    const targetCount = Math.max(2, Math.min(nodes.length, degree + 1));
    const start = this.graphInterpolationWindowStart(nodes, x, degree);
    const windowNodes = nodes.slice(start, start + targetCount);
    let value = 0;
    for (let index = 0; index < windowNodes.length; index += 1) {
      const point = windowNodes[index];
      let basis = 1;
      for (let otherIndex = 0; otherIndex < windowNodes.length; otherIndex += 1) {
        if (otherIndex === index) {
          continue;
        }
        const other = windowNodes[otherIndex];
        const denominator = point.x - other.x;
        if (Math.abs(denominator) < 0.000001) {
          continue;
        }
        basis *= (x - other.x) / denominator;
      }
      value += point.y * basis;
    }
    return value;
  }

  graphSmoothingModeForNode(node) {
    return node?.type === "graph2" ? this.normalizeGraph2SmoothingMode(node?.params?.smoothingMode) : "legacy";
  }

  graphSegmentValue(graph, x, index, smoothingMode = "legacy") {
    const left = graph.nodes[index];
    const right = graph.nodes[index + 1];
    const dx = right.x - left.x;
    if (Math.abs(dx) < 0.000001) {
      return 0.5 * (left.y + right.y);
    }
    const p = this.normalizeGraphNumber((x - left.x) / dx, 0, 0, 1);
    if (smoothingMode !== "legacy") {
      const shaped = this.graphModeCurve(p, smoothingMode, index);
      return left.y + (right.y - left.y) * shaped;
    }
    const contour = this.normalizeGraphNumber(right.c, 0, -0.999, 0.999);
    const shaped = right.shape === "exponential"
      ? this.graphExponentialCurve(p, contour)
      : right.shape === "hold"
        ? (p >= 1 ? 1 : 0)
      : right.shape === "smooth"
        ? this.graphSmoothCurve(p)
      : right.shape === "linear"
        ? p
        : this.graphRationalCurve(p, contour);
    return left.y + (right.y - left.y) * shaped;
  }

  graphValueAt(graphValue, xValue, smoothingMode = "legacy") {
    const graph = this.normalizeGraph(graphValue);
    const x = this.normalizeGraphNumber(xValue, 0, -Infinity, Infinity);
    if (!graph.nodes.length) {
      return 0;
    }
    const normalizedMode = this.normalizeGraph2SmoothingMode(smoothingMode);
    if (normalizedMode === "meander") {
      return this.safeFilterNumber(this.graphBezierValueAt(graph, x), null);
    }
    if (x < graph.nodes[0].x) {
      return graph.nodes[0].y;
    }
    if (x > graph.nodes[graph.nodes.length - 1].x) {
      return graph.nodes[graph.nodes.length - 1].y;
    }
    if (normalizedMode === "quadratic") {
      return this.safeFilterNumber(this.graphLagrangeValueAt(graph, x, 2), null);
    }
    if (normalizedMode === "cubic") {
      return this.safeFilterNumber(this.graphLagrangeValueAt(graph, x, 3), null);
    }
    for (let index = 0; index < graph.nodes.length - 1; index += 1) {
      if (x <= graph.nodes[index + 1].x) {
        return this.safeFilterNumber(this.graphSegmentValue(graph, x, index, smoothingMode), null);
      }
    }
    return graph.nodes[graph.nodes.length - 1].y;
  }

  outputSampleClipped(value) {
    return this.badValueReason(value) || value < -0.95 || value > 0.95;
  }

  outputSampleTripsEarProtection(value) {
    const number = Number(value);
    return !Number.isFinite(number) || Math.abs(number) > 1;
  }

  speakerProtectionSample(value, nodeId) {
    const number = Number(value);
    const unsafe = !Number.isFinite(number) || Math.abs(number) > 1;
    if (unsafe) {
      this.meterProtectionMuteCount += 1;
      this.speakerProtectionPeak = Math.max(
        Number(this.speakerProtectionPeak) || 0,
        Number.isFinite(number) ? Math.abs(number) : Infinity,
      );
      this.speakerProtectionNodeId = String(nodeId || "");
    }
    return unsafe ? 0 : number;
  }

  badValueReason(value) {
    const number = Number(value);
    if (Number.isNaN(number)) {
      return "NaN";
    }
    if (!Number.isFinite(number)) {
      return "inf";
    }
    if (Math.abs(number) > 999999999) {
      return "exploded";
    }
    if (number !== 0 && Math.abs(number) < 1.1754943508222875e-38) {
      return "denormal";
    }
    return "";
  }

  scopeScalarValue(value) {
    const readNumber = (candidate) => {
      const number = Number(candidate);
      if (this.badValueReason(number)) {
        return null;
      }
      return this.clampValue(number, -1, 1);
    };
    if (typeof value === "number") {
      return readNumber(value) ?? 0;
    }
    if (!value || typeof value !== "object") {
      return 0;
    }
    for (const key of ["Out", "Out X", "Out Y", "Out Z", "Left", "Right", "X", "Y", "Z", "Pulse", "Gate", "Count"]) {
      const number = readNumber(value[key]);
      if (number !== null) {
        return number;
      }
    }
    for (const candidate of Object.values(value)) {
      const number = readNumber(candidate);
      if (number !== null) {
        return number;
      }
    }
    return 0;
  }

  captureModuleScopeFrame(frameValues = null, frame = 0, frames = 1) {
    this.scopeSampleStride = Math.max(1, Math.floor((Number(this.engineSampleRate) || sampleRate || 44100) / 12000));
    const captureDebugScope = (this.scopeCounter % this.scopeSampleStride) === 0;
    if (captureDebugScope) {
      const captureNodeIds = Array.isArray(this.scopeCaptureNodeIds)
        ? this.scopeCaptureNodeIds
        : this.order;
      for (const nodeId of captureNodeIds) {
        if (!this.nodeOutputs.has(nodeId)) {
          continue;
        }
        this.captureModuleScopeOutput(nodeId, this.nodeOutputs.get(nodeId));
      }
    }
    for (const sink of this.visualSinks || []) {
      const nodeId = String(sink?.nodeId || "");
      if (!nodeId) {
        continue;
      }
      if (
        Array.isArray(this.scopeCaptureNodeIds) &&
        !this.scopeCaptureNodeIds.includes(nodeId)
      ) {
        continue;
      }
      let value = 0;
      for (const input of sink.inputs || []) {
        if (!input?.connected) {
          continue;
        }
        const inputValue = (input.connections || []).reduce(
          (connectionSum, connection) => connectionSum + this.readRuntimePortOutput(
            frameValues,
            connection.sourceNode,
            connection.sourcePort,
            frame,
            frames,
          ),
          0,
        );
        value += inputValue;
        const inputPort = String(input.port || "").trim();
        if (input?.buffered && inputPort) {
          this.writeVisualInputBufferSample(nodeId, inputPort, inputValue, sink.bufferSampleLimit);
        }
        if (captureDebugScope && inputPort && !input?.buffered) {
          const portId = `${nodeId}:${inputPort}`;
          this.appendScopeBufferSample(portId, inputValue);
        }
      }
      if (captureDebugScope) {
        this.appendScopeBufferSample(nodeId, value);
      }
    }
  }

  appendScopeBufferSample(id, value) {
    const key = String(id || "");
    if (!key) {
      return;
    }
    const limit = 4096;
    let samples = this.scopeBuffers.get(key);
    if (!(samples instanceof Float32Array)) {
      samples = new Float32Array(limit);
      samples.nodeGraphScopeWriteIndex = 0;
      samples.nodeGraphScopeLength = 0;
      this.scopeBuffers.set(key, samples);
    }
    const writeIndex = Math.max(0, Math.min(limit - 1, Number(samples.nodeGraphScopeWriteIndex) || 0));
    samples[writeIndex] = this.scopeScalarValue(value);
    samples.nodeGraphScopeWriteIndex = (writeIndex + 1) % limit;
    samples.nodeGraphScopeLength = Math.min(limit, (Number(samples.nodeGraphScopeLength) || 0) + 1);
  }

  createVisualInputBuffer(capacity = 262144) {
    const safeCapacity = this.normalizeVisualInputBufferCapacity(capacity);
    return {
      absoluteFrame: 0,
      buffer: new Float32Array(safeCapacity),
      capacity: safeCapacity,
      length: 0,
      postedFrame: 0,
      writeIndex: 0,
    };
  }

  normalizeVisualInputBufferCapacity(capacity = 262144) {
    return Math.max(1, Math.round(Number(capacity) || 262144));
  }

  resizeVisualInputBufferState(state, capacity = 262144) {
    const safeCapacity = this.normalizeVisualInputBufferCapacity(capacity);
    if (!state || state.capacity !== safeCapacity || !(state.buffer instanceof Float32Array)) {
      const next = this.createVisualInputBuffer(safeCapacity);
      if (!state?.buffer?.length || !state?.length) {
        return next;
      }
      const oldCapacity = state.capacity || state.buffer.length;
      const oldLength = Math.min(Number(state.length) || 0, oldCapacity);
      const copyCount = Math.min(oldLength, safeCapacity);
      const first = ((Number(state.writeIndex) || 0) - oldLength + oldCapacity) % oldCapacity;
      for (let index = 0; index < copyCount; index += 1) {
        const oldIndex = (first + oldLength - copyCount + index) % oldCapacity;
        next.buffer[index] = state.buffer[oldIndex] || 0;
      }
      next.length = copyCount;
      next.writeIndex = copyCount % safeCapacity;
      next.absoluteFrame = Math.max(Number(state.absoluteFrame) || 0, copyCount);
      next.postedFrame = Math.min(Math.max(Number(state.postedFrame) || 0, 0), next.absoluteFrame);
      return next;
    }
    return state;
  }

  syncVisualInputBuffers() {
    const expected = new Map();
    for (const sink of this.visualSinks || []) {
      const nodeId = String(sink?.nodeId || "");
      if (!nodeId) {
        continue;
      }
      for (const input of sink.inputs || []) {
        if (!input?.buffered) {
          continue;
        }
        const port = String(input.port || "").trim();
        if (!port) {
          continue;
        }
        const key = `${nodeId}:${port}`;
        expected.set(key, this.normalizeVisualInputBufferCapacity(sink.bufferSampleLimit));
      }
    }
    for (const [key, capacity] of expected) {
      const current = this.visualInputBuffers.get(key);
      if (!current || current.capacity !== capacity) {
        this.visualInputBuffers.set(key, this.resizeVisualInputBufferState(current, capacity));
      }
    }
    for (const key of [...this.visualInputBuffers.keys()]) {
      if (!expected.has(key)) {
        this.visualInputBuffers.delete(key);
      }
    }
  }

  writeVisualInputBufferSample(nodeId, port, value, capacity = 262144) {
    const key = `${nodeId}:${port}`;
    let buffer = this.visualInputBuffers.get(key);
    const safeCapacity = this.normalizeVisualInputBufferCapacity(capacity);
    if (!buffer || buffer.capacity !== safeCapacity) {
      buffer = this.resizeVisualInputBufferState(buffer, safeCapacity);
      this.visualInputBuffers.set(key, buffer);
    }
    buffer.buffer[buffer.writeIndex] = this.scopeScalarValue(value);
    buffer.writeIndex = (buffer.writeIndex + 1) % buffer.capacity;
    buffer.length = Math.min(buffer.capacity, buffer.length + 1);
    buffer.absoluteFrame += 1;
  }

  captureModuleScopeOutput(nodeId, output) {
    const id = String(nodeId || "");
    if (!id) {
      return;
    }
    this.appendScopeBufferSample(id, output);
    if (!output || typeof output !== "object") {
      return;
    }
    for (const [port, value] of Object.entries(output)) {
      if (!port || !Number.isFinite(Number(value))) {
        continue;
      }
      const portId = `${id}:${port}`;
      this.appendScopeBufferSample(portId, value);
    }
  }

  postModuleScopeSnapshot() {
    const values = [];
    const engineSampleRate = Math.max(1, Number(this.engineSampleRate) || sampleRate || 44100);
    const scopeSampleStride = Math.max(1, Number(this.scopeSampleStride) || 1);
    const decimatedScopeSampleRate = engineSampleRate / scopeSampleStride;
    for (const [nodeId, samples] of this.scopeBuffers) {
      const length = samples instanceof Float32Array
        ? Math.min(samples.length, Number(samples.nodeGraphScopeLength) || 0)
        : samples?.length || 0;
      if (!length) {
        continue;
      }
      if (samples instanceof Float32Array) {
        const writeIndex = Number(samples.nodeGraphScopeWriteIndex) || 0;
        const ordered = new Float32Array(length);
        const start = (writeIndex - length + samples.length) % samples.length;
        for (let index = 0; index < length; index += 1) {
          ordered[index] = samples[(start + index) % samples.length] || 0;
        }
        values.push([nodeId, ordered, {
          sampleRate: decimatedScopeSampleRate,
          sampleStride: scopeSampleStride,
          sourceSampleRate: engineSampleRate,
        }]);
      } else {
        values.push([nodeId, samples, {
          sampleRate: decimatedScopeSampleRate,
          sampleStride: scopeSampleStride,
          sourceSampleRate: engineSampleRate,
        }]);
      }
    }
    for (const [key, state] of this.visualInputBuffers || []) {
      const length = Math.min(Number(state?.length) || 0, state?.capacity || state?.buffer?.length || 0);
      if (!state?.buffer?.length || length <= 0) {
        continue;
      }
      const absoluteFrame = Math.max(0, Math.floor(Number(state.absoluteFrame) || 0));
      const postedFrame = Math.max(0, Math.floor(Number(state.postedFrame) || 0));
      const freshCount = postedFrame > 0
        ? Math.max(0, absoluteFrame - postedFrame)
        : Math.min(length, Math.ceil((Number(this.engineSampleRate) || sampleRate || 44100) / 30));
      const count = Math.min(length, freshCount);
      if (count <= 0) {
        continue;
      }
      const ordered = new Float32Array(count);
      const start = ((Number(state.writeIndex) || 0) - count + state.capacity) % state.capacity;
      for (let index = 0; index < count; index += 1) {
        ordered[index] = state.buffer[(start + index) % state.capacity] || 0;
      }
      values.push([key, ordered, {
        absoluteFrame,
        sampleRate: engineSampleRate,
        sampleStride: 1,
        sourceSampleRate: engineSampleRate,
        startFrame: absoluteFrame - count,
      }]);
      state.postedFrame = absoluteFrame;
    }
    if (!values.length) {
      return;
    }
    this.port.postMessage({
      patchFingerprint: this.patchFingerprint,
      sampleRate: engineSampleRate,
      sessionId: this.sessionId,
      type: "scope",
      values,
    });
    this.scopeBuffers = new Map();
  }

  shortestWrapDelta(from, to, min, max) {
    const range = max - min;
    if (!Number.isFinite(range) || range <= 0) {
      return to - from;
    }
    let delta = to - from;
    if (delta > range / 2) {
      delta -= range;
    } else if (delta < -range / 2) {
      delta += range;
    }
    return delta;
  }

  // metadata.smoothingSeconds is human-readable seconds everywhere it's
  // authored or displayed -- module definitions (e.g. Sabrina Reverb's
  // diffusionSize/delaySize: 0.05, meaning 50ms), the per-parameter
  // metaparameter editor's UI label ("smoothing time... Ns"), tooltips.
  // The rest of this smoothing pipeline (resolveSmoothingSecondsForSamples
  // below) works in sample counts, with 0 meaning "use the current block
  // size" and -1 meaning "bypass smoothing entirely". This function's job
  // is the seconds -> samples conversion between those two domains.
  //
  // A previous version skipped the conversion and rounded the seconds
  // value directly as if it were already a sample count -- Sabrina's
  // 0.05s became Math.round(0.05) = 0 samples, collapsing its configured
  // 50ms smoothing down to a single audio block (~2.9ms). Worse,
  // Number(null) === 0 in JS meant every OTHER parameter's unset
  // smoothingSeconds (metadata value: null, meaning "no override, use the
  // adaptive autoSmoothingSeconds default") also silently landed on that
  // same near-instant one-block behavior instead of actually falling
  // through to the auto-smoothing default -- audibly indistinguishable
  // from no smoothing at all for virtually every parameter in the app.
  smoothingSecondsFromMetadata(metadata = {}) {
    const raw = metadata?.smoothingSeconds;
    if (raw === null || raw === undefined) {
      return null;
    }
    const seconds = Number(raw);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return 0;
    }
    return Math.round(seconds * sampleRate);
  }

  resolveSmoothingSecondsForSamples(smoothingSamples, frames, rate = sampleRate) {
    if (smoothingSamples === null) {
      return this.autoSmoothingSeconds;
    }
    if (smoothingSamples === -1) {
      return -1;
    }
    const samples = smoothingSamples <= 0 ? Math.max(1, Number(frames) || 1) : smoothingSamples;
    return samples / Math.max(1, Number(rate) || 44100);
  }

  createSmoother(initialValue, metadata = {}) {
    const value = Number(initialValue);
    const safeValue = Number.isFinite(value) ? value : 0;
    const signal = this.parameterValueToNormalizedSignal(safeValue, metadata);
    return {
      current: safeValue,
      linearSmoothing: metadata?.linearSmoothing !== false,
      max: Number.isFinite(Number(metadata?.max)) ? Number(metadata.max) : 1,
      metadata,
      min: Number.isFinite(Number(metadata?.min)) ? Number(metadata.min) : 0,
      smoothingSeconds: this.smoothingSecondsFromMetadata(metadata),
      outputBuffer: signal,
      targetSignal: signal,
      target: safeValue,
      lastFrame: -1,
      lastValue: safeValue,
      wraparound: Boolean(metadata?.wraparound),
    };
  }

  clampAutoSmoothingSeconds(seconds) {
    const value = Number(seconds);
    if (!Number.isFinite(value)) {
      return 0.016;
    }
    return Math.max(0, value);
  }

  smoothingFrequencyFromSeconds(seconds) {
    const normalized = this.clampAutoSmoothingSeconds(seconds);
    return normalized <= 0 ? 0 : 1 / normalized;
  }

  syncNestedAutoSmoothingSeconds(seconds = this.autoSmoothingSeconds) {
    const normalized = this.clampAutoSmoothingSeconds(seconds);
    for (const runtime of this.moduleGroupRuntimes?.values?.() || []) {
      runtime.autoSmoothingSeconds = normalized;
      runtime.syncNestedAutoSmoothingSeconds?.(normalized);
    }
  }

  // Mirrors soemdsp::filter::SmootherBase::needsSmoothing() -- once a
  // parameter has settled within epsilon of its target (no live modulation
  // moving it), skip the one-pole recompute entirely rather than running it
  // every sample forever for a value that isn't changing.
  smootherNeedsWork(smoother) {
    return Math.abs((smoother.outputBuffer ?? 0) - (smoother.targetSignal ?? 0)) > 1e-7;
  }

  updateSmoother(smoother, targetValue, metadata = {}) {
    const value = Number(targetValue);
    smoother.target = Number.isFinite(value) ? value : smoother.target;
    smoother.linearSmoothing = metadata?.linearSmoothing !== false;
    smoother.max = Number.isFinite(Number(metadata?.max)) ? Number(metadata.max) : smoother.max;
    smoother.metadata = metadata;
    smoother.min = Number.isFinite(Number(metadata?.min)) ? Number(metadata.min) : smoother.min;
    smoother.smoothingSeconds = this.smoothingSecondsFromMetadata(metadata);
    smoother.targetSignal = this.parameterValueToNormalizedSignal(smoother.target, metadata);
    smoother.wraparound = Boolean(metadata?.wraparound);
    if (!smoother.linearSmoothing) {
      smoother.current = smoother.target;
      smoother.outputBuffer = smoother.targetSignal;
      smoother.lastValue = smoother.target;
    }
  }

  readSmoothedParameter(node, key, fallback, frame, frames) {
    const smoother = this.smoothers.get(this.parameterKey(node?.id, key));
    if (!smoother) {
      const value = Number(node?.params?.[key]);
      return Number.isFinite(value) ? value : fallback;
    }
    if (!smoother.linearSmoothing) {
      return smoother.target;
    }
    if (smoother.lastFrame === frame) {
      return smoother.lastValue;
    }
    if (!this.smootherNeedsWork(smoother)) {
      smoother.current = smoother.target;
      smoother.lastFrame = frame;
      smoother.lastValue = smoother.target;
      return smoother.target;
    }
    const resolvedSmoothingSeconds = this.resolveSmoothingSecondsForSamples(
      smoother.smoothingSeconds ?? null,
      frames,
      sampleRate,
    );
    const smoothingSeconds = resolvedSmoothingSeconds === -1
      ? -1
      : this.clampAutoSmoothingSeconds(resolvedSmoothingSeconds);
    if (smoothingSeconds <= 0) {
      smoother.current = smoother.target;
      smoother.outputBuffer = smoother.targetSignal;
      smoother.lastFrame = frame;
      smoother.lastValue = smoother.target;
      return smoother.target;
    }
    const signal = this.onePoleLowpassSample(
      smoother,
      smoother.targetSignal,
      this.smoothingFrequencyFromSeconds(smoothingSeconds),
      sampleRate,
    );
    const value = this.normalizedSignalToParameterValue(signal, smoother.metadata);
    smoother.current = value;
    smoother.lastFrame = frame;
    smoother.lastValue = value;
    return value;
  }

  finishSmoothing() {
    for (const smoother of this.smoothers.values()) {
      if (!smoother.linearSmoothing) {
        smoother.current = smoother.wraparound
          ? this.wrapValue(smoother.target, smoother.min, smoother.max)
          : smoother.target;
        continue;
      }
      smoother.current = smoother.lastValue ?? smoother.current;
      smoother.lastFrame = -1;
    }
    for (const runtime of this.moduleGroupRuntimes?.values?.() || []) {
      runtime.finishSmoothing();
    }
  }

  applyParameterBounds(value, metadata = {}) {
    const min = Number(metadata.min);
    const max = Number(metadata.max);
    if (metadata.unboundedMin && metadata.unboundedMax) {
      return value;
    }
    if (metadata.unboundedMin && Number.isFinite(max)) {
      return Math.min(value, max);
    }
    if (metadata.unboundedMax && Number.isFinite(min)) {
      return Math.max(value, min);
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      return value;
    }
    return metadata.wraparound
      ? this.wrapValue(value, min, max)
      : this.clampValue(value, min, max);
  }

  readRuntimeOutput(frameValues, nodeId, port = "Out") {
    const output = frameValues?.has(nodeId)
      ? frameValues.get(nodeId)
      : this.nodeOutputs.get(nodeId);
    if (output && typeof output === "object") {
      return Number(output[port] ?? output.Out ?? 0);
    }
    return output === undefined || output === null ? 0 : Number(output);
  }

  parameterOutputExists(node, port) {
    return Boolean(node?.params && Object.hasOwn(node.params, port));
  }

  normalizeParameterOutputValue(value, metadata = {}) {
    return this.parameterValueToNormalizedSignal(value, metadata);
  }

  normalizeParameterModulationInput(value, metadata = {}) {
    const number = Number(value) || 0;
    return metadata?.kind === "frequency" && metadata.nonlinearSlider
      ? this.clampValue(number, -1, 1)
      : this.clampValue(number, 0, 1);
  }

  parameterSkewExponent(metadata = {}) {
    if (!metadata.nonlinearSlider) {
      return 1;
    }
    const min = Number(metadata.min);
    const max = Number(metadata.max);
    const mid = Number(metadata.mid);
    const range = max - min;
    if (!Number.isFinite(range) || range <= 0 || !Number.isFinite(mid)) {
      return 1;
    }
    const normalizedMid = this.clampValue((mid - min) / range, 0.000001, 0.999999);
    return Math.log(normalizedMid) / Math.log(0.5);
  }

  parameterValueToNormalizedSignal(value, metadata = {}) {
    const min = Number(metadata.min);
    const max = Number(metadata.max);
    const range = max - min;
    if (!Number.isFinite(range) || range <= 0) {
      return 0;
    }
    const bounded = metadata.wraparound
      ? this.wrapValue(Number(value) || 0, min, max)
      : this.clampValue(Number(value) || 0, min, max);
    const normalizedValue = this.clampValue((bounded - min) / range, 0, 1);
    return this.clampValue(normalizedValue ** (1 / this.parameterSkewExponent(metadata)), 0, 1);
  }

  normalizedSignalToParameterValue(signal, metadata = {}) {
    const min = Number(metadata.min);
    const max = Number(metadata.max);
    const range = max - min;
    if (!Number.isFinite(range) || range <= 0) {
      return Number.isFinite(min) ? min : 0;
    }
    const normalizedSignal = metadata.wraparound
      ? this.wrapValue(Number(signal) || 0, 0, 1)
      : this.clampValue(Number(signal) || 0, 0, 1);
    const normalizedValue = normalizedSignal ** this.parameterSkewExponent(metadata);
    return this.applyParameterBounds(min + range * normalizedValue, metadata);
  }

  applyParameterModulation(base, modulationSignal, metadata = {}) {
    if (metadata?.kind === "frequency" && metadata.nonlinearSlider) {
      const baseFrequency = Math.max(0.000001, Number(base) || 0.000001);
      const octaves = (Number(modulationSignal) || 0) / 0.1;
      return this.applyParameterBounds(baseFrequency * (2 ** octaves), metadata);
    }
    const baseSignal = this.parameterValueToNormalizedSignal(base, metadata);
    return this.normalizedSignalToParameterValue(baseSignal + modulationSignal, metadata);
  }

  readRuntimePortOutput(frameValues, nodeId, port = "Out", frame = 0, frames = 1) {
    const node = this.nodes.get(nodeId);
    if (!this.parameterOutputExists(node, port)) {
      return this.readRuntimeOutput(frameValues, nodeId, port);
    }
    const value = this.readSmoothedParameter(node, port, 0, frame, frames);
    return this.normalizeParameterOutputValue(value, node?.paramMeta?.[port] || {});
  }

  readEffectiveParameter(node, key, fallback, frame, frames, frameValues) {
    const base = this.readSmoothedParameter(node, key, fallback, frame, frames);
    const modulations = this.modulationConnections.get(this.parameterKey(node?.id, key));
    // Most parameters have no modulation wired to them at all. Skip the
    // normalize/denormalize round trip (parameterSkewExponent alone runs two
    // Math.log() calls) entirely in that case instead of paying it on every
    // sample for every parameter, modulated or not -- this was the actual
    // per-sample cost behind Sabrina Reverb's real-time audio underruns
    // (measured, not guessed: 8 parameters x this unconditional work was
    // enough to push ctx.currentTime ~5% behind wall-clock).
    if (!modulations || !modulations.length) {
      return base;
    }
    const metadata = node?.paramMeta?.[key] || {};
    const min = Number(metadata.min);
    const max = Number(metadata.max);
    const hasMetadataRange = Number.isFinite(min) && Number.isFinite(max) && max > min;
    const modulationSignal = modulations.reduce(
      (sum, modulation) => sum + this.normalizeParameterModulationInput(this.readRuntimePortOutput(
        frameValues,
        modulation.sourceNode,
        modulation.sourcePort,
        frame,
        frames,
      ), metadata),
      0,
    );
    if (!hasMetadataRange) {
      return base + modulationSignal;
    }
    return this.applyParameterModulation(base, modulationSignal, metadata);
  }

  phaseRadians(value) {
    return this.wrapValue(Number(value) || 0, 0, 1) * Math.PI * 2;
  }

  nextNoiseSample(nodeId) {
    const seed = (Math.imul(1664525, this.noiseSeeds.get(nodeId) || 0x12345678) + 1013904223) >>> 0;
    this.noiseSeeds.set(nodeId, seed);
    return (seed / 0xffffffff) * 2 - 1;
  }

  currentNoiseSample(nodeId) {
    if (!this.noiseSeeds.has(nodeId)) {
      return this.nextNoiseSample(nodeId);
    }
    return ((this.noiseSeeds.get(nodeId) || 0) / 0xffffffff) * 2 - 1;
  }

  noiseSeedKey(nodeId, seedValue, channel = "") {
    const seed = Math.max(0, Math.min(99999, Math.floor(Number(seedValue) || 0)));
    return `${nodeId}${channel ? `:${channel}` : ""}:seed:${seed}`;
  }

  polyBlep(phaseCycle, phaseIncrement) {
    const dt = this.clampValue(Math.abs(Number(phaseIncrement) || 0), 1e-6, 0.5);
    if (phaseCycle < dt) {
      const t = phaseCycle / dt;
      return t + t - t * t - 1;
    }
    if (phaseCycle > 1 - dt) {
      const t = (phaseCycle - 1) / dt;
      return t * t + t + t + 1;
    }
    return 0;
  }

  polyBlepSquare(phaseCycle, phaseIncrement) {
    let value = phaseCycle < 0.5 ? 1 : -1;
    value += this.polyBlep(phaseCycle, phaseIncrement);
    value -= this.polyBlep(this.wrapValue(phaseCycle + 0.5, 0, 1), phaseIncrement);
    return value;
  }

  oscillatorSample(nodeId, phase, phaseIncrement, waveform) {
    const phaseDelta = Number(phaseIncrement) || 0;
    const phaseStopped = Math.abs(phaseDelta) <= 1e-12;
    if (phaseStopped && this.oscillatorStoppedSamples.has(nodeId)) {
      return this.oscillatorStoppedSamples.get(nodeId) || 0;
    }
    const renderPhaseIncrement = phaseStopped
      ? Number(this.oscillatorLastPhaseIncrements.get(nodeId)) || 0
      : phaseDelta;
    const phaseCycle = this.wrapValue(phase / (Math.PI * 2), 0, 1);
    let sample = 0;
    switch (Math.round(Number(waveform) || 0)) {
      case 1:
        sample = -1 + phaseCycle * 2 - this.polyBlep(phaseCycle, renderPhaseIncrement);
        break;
      case 2:
        sample = this.polyBlepSquare(phaseCycle, renderPhaseIncrement);
        break;
      case 3:
        {
          const triangle = this.triangleStates.get(nodeId) || 0;
          if (phaseStopped) {
            sample = triangle;
            break;
          }
          const nextTriangle = (triangle + this.polyBlepSquare(phaseCycle, renderPhaseIncrement) * phaseDelta * 4) * 0.995;
          this.triangleStates.set(nodeId, this.clampValue(nextTriangle, -1, 1));
          sample = this.clampValue(nextTriangle, -1, 1);
          break;
        }
      case 4:
        sample = Math.sin(phase);
        break;
      case 5:
        sample = phaseStopped ? this.currentNoiseSample(nodeId) : this.nextNoiseSample(nodeId);
        break;
      case 0:
      default:
        sample = 1 - phaseCycle * 2 + this.polyBlep(phaseCycle, renderPhaseIncrement);
        break;
    }
    if (phaseStopped) {
      this.oscillatorStoppedSamples.set(nodeId, sample);
    } else {
      this.oscillatorStoppedSamples.delete(nodeId);
      this.oscillatorLastPhaseIncrements.set(nodeId, phaseDelta);
    }
    return sample;
  }

  forwardBackwardPolyBlepOscillatorSample(nodeId, phase, phaseIncrement, waveform) {
    return this.oscillatorSample(nodeId, phase, phaseIncrement, waveform);
  }

  polyBlepNativeVectorSample(state, phase, phaseIncrement, waveform, level, resetEdge) {
    if (!this.nativePolyBlepReady) {
      return null;
    }
    try {
      if (!state.nativeHandle) {
        state.nativeHandle = this.nativePolyBlep.soemdsp_polyblep_create();
      }
      if (!state.nativeHandle) {
        return null;
      }
      if (resetEdge) {
        this.nativePolyBlep.soemdsp_polyblep_reset(state.nativeHandle);
      }
      this.nativePolyBlep.soemdsp_polyblep_sample(
        state.nativeHandle,
        Number(phase) || 0,
        Number(phaseIncrement) || 0,
        Math.round(Number(waveform) || 0),
        Number(level) || 0,
      );
      return {
        out: this.safeFilterNumber(this.nativePolyBlep.soemdsp_polyblep_out(state.nativeHandle), null),
        saw: this.safeFilterNumber(this.nativePolyBlep.soemdsp_polyblep_saw(state.nativeHandle), null),
        ramp: this.safeFilterNumber(this.nativePolyBlep.soemdsp_polyblep_ramp(state.nativeHandle), null),
        square: this.safeFilterNumber(this.nativePolyBlep.soemdsp_polyblep_square(state.nativeHandle), null),
        tri: this.safeFilterNumber(this.nativePolyBlep.soemdsp_polyblep_tri(state.nativeHandle), null),
        sine: this.safeFilterNumber(this.nativePolyBlep.soemdsp_polyblep_sine(state.nativeHandle), null),
      };
    } catch (error) {
      this.nativePolyBlepReady = false;
      this.port.postMessage({
        type: "nativeModuleStatus",
        name: "polyblep",
        status: "disabled",
        message: String(error?.message || error || "native PolyBLEP failed"),
      });
      return null;
    }
  }

  ellipsoidSample(phase, offset = 0, shape = 0, scale = 1) {
    const phaseRadians = Number(phase) || 0;
    const sinPhase = Math.sin(phaseRadians);
    const cosPhase = Math.cos(phaseRadians);
    const shapeRadians = (Number(shape) || 0) * Math.PI;
    const shapeSin = Math.sin(shapeRadians);
    const shapeCos = Math.cos(shapeRadians);
    const safeOffset = this.clampValue(Number(offset) || 0, -1, 1);
    const safeScale = Math.max(0, Number(scale) || 0);
    const x = safeOffset + cosPhase;
    const y = safeScale * sinPhase;
    const denominator = Math.sqrt((x * x) + (y * y));
    if (denominator <= 1e-12) {
      return 0;
    }
    return this.clampValue(((x * shapeCos) + (y * shapeSin)) / denominator, -1, 1);
  }

  ellipsoidVectorSample(
    target,
    phase,
    levelValue = 1,
    offsetX = 0,
    offsetY = 0,
    scaleX = 1,
    scaleY = 1,
    shapeX = 0,
    shapeY = 0,
  ) {
    const level = Number(levelValue) || 0;
    const x = this.ellipsoidSample(phase, offsetX, shapeX, scaleX) * level;
    const y = this.ellipsoidSample(phase - Math.PI * 0.5, offsetY, shapeY, scaleY) * level;
    const output = target || {};
    output.Out = x;
    output.Mono = x;
    output.X = x;
    output.Y = y;
    output.Wave = x;
    output["Wave Out"] = x;
    return output;
  }

  nativeEllipsoidVectorSample(
    target,
    phase,
    levelValue = 1,
    offsetX = 0,
    offsetY = 0,
    scaleX = 1,
    scaleY = 1,
    shapeX = 0,
    shapeY = 0,
  ) {
    const native = this.nativeEllipsoidReady ? this.nativeEllipsoid : null;
    if (!native?.soemdsp_ellipsoid_vector_sample) {
      return this.ellipsoidVectorSample(
        target,
        phase,
        levelValue,
        offsetX,
        offsetY,
        scaleX,
        scaleY,
        shapeX,
        shapeY,
      );
    }
    native.soemdsp_ellipsoid_vector_sample(
      Number(phase) || 0,
      Number(levelValue) || 0,
      Number(offsetX) || 0,
      Number(offsetY) || 0,
      Number(scaleX) || 0,
      Number(scaleY) || 0,
      Number(shapeX) || 0,
      Number(shapeY) || 0,
    );
    const x = this.clampValue(Number(native.soemdsp_ellipsoid_x?.()) || 0, -1, 1);
    const y = this.clampValue(Number(native.soemdsp_ellipsoid_y?.()) || 0, -1, 1);
    const output = target || {};
    output.Out = x;
    output.Mono = x;
    output.X = x;
    output.Y = y;
    output.Wave = x;
    output["Wave Out"] = x;
    return output;
  }

  additiveWaveformHarmonic(waveform, harmonic, modA = 0.5) {
    const n = Math.max(1, Math.floor(Number(harmonic) || 1));
    const h = n;
    const mod = this.clampValue(Number(modA) || 0, 0, 1);
    switch (Math.round(Number(waveform) || 0)) {
      case 0:
        return { amplitude: n === Math.max(1, Math.floor(99 * mod + 1)) ? 1 : 0, phase: 0 };
      case 2:
        return { amplitude: n % 2 === 1 ? 1 / h : 0, phase: mod * 0.5 };
      case 3:
        return { amplitude: n % 2 === 1 ? 1 / (h * h) : 0, phase: n % 4 === 1 ? 0 : 0.5 };
      case 4:
        return { amplitude: n % 2 === 1 ? 1 / h : (1 / h) * (1 - mod), phase: 0 };
      case 5:
        return { amplitude: Math.cos(h * mod * 0.5) / h, phase: 0 };
      case 6:
        {
          const peak = this.clampValue(mod, 0.001, 0.999);
          return { amplitude: (Math.sin(0.5 * h * peak) / (peak * (1 - peak) * h * h)) * 0.2, phase: 0 };
        }
      case 7:
        {
          const octaves = Math.max(2, Math.floor(2 + mod * 11));
          let target = 1;
          while (target < n) {
            target *= octaves;
          }
          return { amplitude: target === n ? 1 / h : 0, phase: 0 };
        }
      case 1:
      default:
        return { amplitude: 1 / h, phase: n % 2 === 1 ? 0.5 : 0 };
    }
  }

  additiveDampingCurveValue(value = 0) {
    return this.clampValue(Number(value) || 0, 0, 1);
  }

  additiveDampingAlgorithmValue(value = 0) {
    return Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  }

  additiveFilterFrequencyValue(value = 20000, rate = this.engineSampleRate || sampleRate || 44100) {
    const nyquist = Math.max(1, (Number(rate) || this.engineSampleRate || sampleRate || 44100) * 0.5);
    return this.clampValue(Number(value) || 20000, 1, nyquist);
  }

  rationalCurveValue(value = 0, skew = 0) {
    const t = this.clampValue(Number(value) || 0, 0, 1);
    if (t <= 0) {
      return 0;
    }
    if (t >= 1) {
      return 1;
    }
    const safeSkew = this.clampValue(Number(skew) || 0, -0.999999, 0.999999);
    return this.clampValue(
      ((1 + safeSkew) * t) / (1 - safeSkew + 2 * safeSkew * t),
      0,
      1,
    );
  }

  additiveHarmonicDamping(harmonic, frequency, rate, curveValue = 0, algorithm = 0, filterFrequency = 20000) {
    const safeRate = Math.max(1, Number(rate) || this.engineSampleRate || sampleRate || 44100);
    const safeFrequency = Math.max(0, Number(frequency) || 0);
    const safeFilterFrequency = this.additiveFilterFrequencyValue(filterFrequency, safeRate);
    if (safeFilterFrequency <= 0 || safeFrequency <= 0) {
      return 1;
    }
    const ratio = this.clampValue((Math.max(1, Number(harmonic) || 1) * safeFrequency) / safeFilterFrequency, 0, 1);
    return this.additiveDampingAmplitude({
      algorithm,
      curveValue,
      harmonic,
      maxHarmonics: Math.max(1, Math.floor(safeFilterFrequency / Math.max(1, safeFrequency))),
      ratio,
    });
  }

  additiveDampingAmplitude({
    algorithm = 0,
    curveValue = 0,
    harmonic = 1,
    maxHarmonics = 1,
    ratio = 0,
  } = {}) {
    const curve = this.additiveDampingCurveValue(curveValue);
    const mode = this.additiveDampingAlgorithmValue(algorithm);
    const t = this.clampValue(Number(ratio) || 0, 0, 1);
    if (t <= 0) {
      return 1;
    }
    if (t >= 1) {
      return 0;
    }
    if (mode === 1) {
      return this.clampValue((1 - t) ** (1 + curve * 7), 0, 1);
    }
    if (mode === 2) {
      const amount = 0.5 + curve * 12;
      const end = Math.exp(-amount);
      return this.clampValue((Math.exp(-t * amount) - end) / Math.max(0.0001, 1 - end), 0, 1);
    }
    if (mode === 3) {
      const cutoff = this.clampValue(0.95 - curve * 0.82, 0.08, 0.95);
      const order = 1 + Math.round(curve * 5);
      const raw = 1 / Math.sqrt(1 + (t / cutoff) ** (2 * order));
      const end = 1 / Math.sqrt(1 + (1 / cutoff) ** (2 * order));
      return this.clampValue((raw - end) / Math.max(0.0001, 1 - end), 0, 1);
    }
    if (mode === 4) {
      const knee = this.clampValue(0.78 - curve * 0.68, 0.04, 0.78);
      if (t <= knee) {
        return 1;
      }
      const local = (t - knee) / Math.max(0.0001, 1 - knee);
      return this.clampValue((1 - local) ** (1 + curve * 7), 0, 1);
    }
    if (mode === 5) {
      const tilt = curve * 4;
      if (tilt <= 0) {
        return 1 - t;
      }
      const h = Math.max(1, Number(harmonic) || 1);
      const maxH = Math.max(h, Number(maxHarmonics) || h);
      const raw = 1 / (h ** tilt);
      const end = 1 / (maxH ** tilt);
      return this.clampValue((raw - end) / Math.max(0.0001, 1 - end), 0, 1);
    }
    return this.clampValue(1 - this.rationalCurveValue(t, curve), 0, 1);
  }

  additiveHarmonicCurveAmount({
    algorithm = 0,
    curveValue = 0,
    harmonic = 1,
    maxHarmonics = 1,
    ratio = 0,
  } = {}) {
    return this.clampValue(1 - this.additiveDampingAmplitude({
      algorithm,
      curveValue,
      harmonic,
      maxHarmonics,
      ratio,
    }), 0, 1);
  }

  additiveOscillatorSample(phase, params = {}, rate = this.engineSampleRate || sampleRate) {
    const safeRate = Math.max(1, Number(rate) || this.engineSampleRate || sampleRate || 44100);
    if (this.nativeAdditiveOscReady && !params.hasGraphInput) {
      try {
        return this.safeFilterNumber(
          this.nativeAdditiveOsc.soemdsp_additive_osc_sample(
            phase,
            Math.max(0, Number(params.frequency) || 0),
            Math.max(1, Math.min(nodeLiveAdditiveHardMaxHarmonics, Math.round(Number(params.harmonics) || 32))),
            Math.round(Number(params.waveform) || 0),
            this.clampValue(Number(params.modA) || 0, 0, 1),
            this.clampValue(Number(params.harmonicPhaseAdd) || 0, 0, 1),
            this.clampValue(Number(params.harmonicPhaseMultiply) || 0, 0, 4),
            this.clampValue(Number(params.level) || 0, 0, 1),
            this.additiveFilterFrequencyValue(params.dampingFilterFrequency, safeRate),
            safeRate,
          ),
          null,
        );
      } catch (error) {
        this.nativeAdditiveOscReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "additive_osc",
          status: "disabled",
          message: String(error?.message || error || "native Additive Osc failed"),
        });
      }
    }
    const frequency = Math.max(0, Number(params.frequency) || 0);
    const maxHarmonics = Math.max(
      1,
      Math.min(nodeLiveAdditiveHardMaxHarmonics, Math.round(Number(params.harmonics) || 32)),
    );
    const waveform = Math.round(Number(params.waveform) || 0);
    const modA = this.clampValue(Number(params.modA) || 0, 0, 1);
    const harmonicPhaseAdd = this.clampValue(Number(params.harmonicPhaseAdd) || 0, 0, 1);
    const harmonicPhaseMultiply = this.clampValue(Number(params.harmonicPhaseMultiply) || 0, 0, 4);
    const level = this.clampValue(Number(params.level) || 0, 0, 1);
    const dampingFilterFrequency = this.additiveFilterFrequencyValue(params.dampingFilterFrequency, safeRate);
    const dampingGraphValueAt = typeof params.dampingGraphValueAt === "function"
      ? params.dampingGraphValueAt
      : () => 1;
    const phaseGraphValueAt = typeof params.phaseGraphValueAt === "function"
      ? params.phaseGraphValueAt
      : () => 0;
    const harmonicLimit = Math.max(1, Math.min(maxHarmonics, Math.floor(Math.min(20000, safeRate * 0.45) / Math.max(1, frequency))));
    let total = 0;
    let norm = 0;
    for (let harmonic = 1; harmonic <= harmonicLimit; harmonic += 1) {
      const partial = this.additiveWaveformHarmonic(waveform, harmonic, modA);
      const dampingX = this.clampValue((frequency * harmonic) / dampingFilterFrequency, 0, 1);
      const amplitude = (Number(partial.amplitude) || 0) *
        this.clampValue(Number(dampingGraphValueAt(dampingX)) || 0, 0, 1);
      if (amplitude === 0) {
        continue;
      }
      const harmonicRatio = harmonicLimit > 1
        ? (harmonic - 1) / (harmonicLimit - 1)
        : 0;
      const phaseCurve = this.clampValue(Number(phaseGraphValueAt(harmonicRatio)) || 0, 0, 1);
      const phaseMultiplier = 1 + phaseCurve * harmonicPhaseMultiply;
      const phaseOffset = (Number(partial.phase) || 0) + phaseCurve * harmonicPhaseAdd;
      total += Math.sin((phase * harmonic * phaseMultiplier) + phaseOffset * Math.PI * 2) * amplitude;
      norm += Math.abs(amplitude);
    }
    if (norm <= 0) {
      return 0;
    }
    return this.clampValue((total / Math.max(1, norm * 0.72)) * level, -1, 1);
  }

  createHighpassState() {
    return {
      inputBuffer: 0,
      outputBuffer: 0,
    };
  }

  createLowpassState() {
    return {
      outputBuffer: 0,
    };
  }

  createCookbookFilterState() {
    return {
      lastStages: 2,
      x1: [0, 0, 0, 0, 0],
      x2: [0, 0, 0, 0, 0],
      y1: [0, 0, 0, 0, 0],
      y2: [0, 0, 0, 0, 0],
      nativeHandle: 0,
    };
  }

  createLadderFilterState() {
    return { y: [0, 0, 0, 0, 0], nativeHandle: 0 };
  }

  resetCookbookFilterState(state) {
    for (const key of ["x1", "x2", "y1", "y2"]) {
      if (Array.isArray(state?.[key])) {
        state[key].fill(0);
      }
    }
  }

  createOscResetState() {
    return {
      lastReset: 0,
    };
  }

  createGraphLfoState() {
    return {
      lastReset: 0,
      resetFrame: 0,
    };
  }

  sineWavetableSample(phaseRadians, frequency, amplitude, sampleRate) {
    if (this.nativeSineWavetableReady) {
      try {
        return {
          cos: this.safeFilterNumber(
            this.nativeSineWavetable.soemdsp_sine_wavetable_cos(phaseRadians, frequency, amplitude, sampleRate),
            null,
          ),
          sin: this.safeFilterNumber(
            this.nativeSineWavetable.soemdsp_sine_wavetable_sin(phaseRadians, frequency, amplitude, sampleRate),
            null,
          ),
        };
      } catch (error) {
        this.nativeSineWavetableReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "sine_wavetable",
          status: "disabled",
          message: String(error?.message || error || "native SinCos failed"),
        });
      }
    }
    return nodeLiveSineCosWavetableSample(phaseRadians, frequency, amplitude, sampleRate);
  }

  // Shared helpers for the RSMET/Yellowjacket/SuperLove/ChaoticPhaseLocking/
  // Resonator/Human filter family below (ingested from soemdsp-sandbox master).

  analogLadderTapStep(y, input, a, mode, stages) {
    const c = [0, 0, 0, 0, 0];
    if (mode === 1) {
      c[stages] = 1;
    } else if (mode === 2) {
      const hp = [[1, -1, 0, 0, 0], [1, -2, 1, 0, 0], [1, -3, 3, -1, 0], [1, -4, 6, -4, 1]];
      for (let i = 0; i <= stages; i++) c[i] = hp[stages - 1][i];
    } else if (mode === 3) {
      const bp = [[0, 2, -2, 0, 0], [0, 2, -2, 0, 0], [0, 0, 3, -3, 0], [0, 0, 4, -8, 4]];
      for (let i = 0; i < 5; i++) c[i] = bp[stages - 1][i];
    }
    let y0 = input;
    y0 = y0 / (1 + y0 * y0);
    y[1] = y0 + a * (y0 - y[1]);
    y[2] = y[1] + a * (y[1] - y[2]);
    y[3] = y[2] + a * (y[2] - y[3]);
    y[4] = y[3] + a * (y[3] - y[4]);
    y[0] = y0;
    return c[0] * y[0] + c[1] * y[1] + c[2] * y[2] + c[3] * y[3] + c[4] * y[4];
  }

  analogLadderCoefficient(cutoffHz, sampleRateValue) {
    const wc = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * cutoffHz / sampleRateValue));
    const s = Math.sin(wc);
    const c = Math.cos(wc);
    const t = Math.tan(0.25 * (wc - Math.PI));
    let denom = s - c * t;
    if (denom > -1e-12 && denom < 1e-12) denom = denom >= 0 ? 1e-12 : -1e-12;
    return t / denom;
  }

  analogRationalCurve(p, skew) {
    return ((1 + skew) * p) / (1 - skew + 2 * skew * p);
  }

  analogEvalGraph(nodes, x) {
    if (nodes.length === 0) return 0;
    if (x < nodes[0].x) return nodes[0].y;
    let i = -1;
    for (let k = 0; k < nodes.length; k++) {
      if (nodes[k].x > x) { i = k; break; }
    }
    if (i < 0) return nodes[nodes.length - 1].y;
    if (i === 0) return nodes[0].y;
    const n1 = nodes[i - 1];
    const n2 = nodes[i];
    if (n2.x - n1.x < 1e-9) return 0.5 * (n1.y + n2.y);
    const p = (x - n1.x) / (n2.x - n1.x);
    if (n2.shape === 1) return n1.y + (n2.y - n1.y) * this.analogRationalCurve(p, n2.skew);
    if (n2.shape === 2) {
      const c = 0.5 * (n2.skew + 1);
      const a = 2 * Math.log((1 - c) / c);
      return n1.y + (n2.y - n1.y) * (1 - Math.exp(p * a)) / (1 - Math.exp(a));
    }
    return n1.y + (n2.y - n1.y) * p;
  }

  analogWaveEllipseFull(phaseCycles, A, bSin, bCos, C) {
    const sinX = Math.sin(phaseCycles * 2 * Math.PI);
    const cosX = Math.cos(phaseCycles * 2 * Math.PI);
    const apc = A + cosX;
    let sqrtVal = Math.sqrt(apc * apc + (C * sinX) * (C * sinX));
    if (sqrtVal < 1e-12) sqrtVal = 1e-12;
    return (apc * bCos + (C * sinX) * bSin) / sqrtVal;
  }

  analogWaveEllipse(phaseCycles, ellipseC) {
    return this.analogWaveEllipseFull(phaseCycles, 0, 0, 1, ellipseC);
  }

  analogWaveTrisaw(phaseCycles, morph) {
    let phaseRad = phaseCycles * 2 * Math.PI;
    phaseRad = phaseRad - 2 * Math.PI * Math.floor(phaseRad / (2 * Math.PI));
    const morphRad = morph * 2 * Math.PI;
    let sourceMin, sourceMax, targetMin, targetRange;
    if (phaseRad > morphRad) {
      sourceMin = morphRad; sourceMax = 2 * Math.PI; targetMin = 1; targetRange = -1;
    } else {
      sourceMin = 0; sourceMax = morphRad; targetMin = 0; targetRange = 1;
    }
    const sourceRange = sourceMax - sourceMin;
    let uni;
    if (sourceMin === sourceMax) uni = sourceMin;
    else uni = targetMin + (targetRange * (phaseRad - sourceMin)) / sourceRange;
    return 2 * uni - 1;
  }

  analogPitchToFreq(pitch) {
    return 440 * Math.pow(2, (pitch - 69) / 12);
  }

  // --- Change Detector ---

  createChangeDetectorState() {
    return { lastValue: 0, nativeHandle: 0 };
  }

  destroyChangeDetectorNativeState(state) {
    if (state.nativeHandle && this.nativeChangeDetector?.soemdsp_change_detector_destroy) {
      this.nativeChangeDetector.soemdsp_change_detector_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  changeDetectorSampleJs(state, input) {
    const safeInput = this.safeFilterNumber(input, state);
    let up = 0, same = 0, down = 0, changed = 0;
    if (safeInput > state.lastValue) {
      up = 1;
      changed = 1;
    } else if (safeInput < state.lastValue) {
      down = 1;
      changed = 1;
    } else {
      same = 1;
    }
    state.lastValue = safeInput;
    return { up, same, down, changed };
  }

  changeDetectorSample(state, input) {
    if (this.nativeChangeDetectorReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeChangeDetector.soemdsp_change_detector_create();
        }
        if (state.nativeHandle) {
          const safeInput = this.safeFilterNumber(input, state);
          this.nativeChangeDetector.soemdsp_change_detector_sample(state.nativeHandle, safeInput);
          return {
            up: Number(this.nativeChangeDetector.soemdsp_change_detector_up(state.nativeHandle)) || 0,
            same: Number(this.nativeChangeDetector.soemdsp_change_detector_same(state.nativeHandle)) || 0,
            down: Number(this.nativeChangeDetector.soemdsp_change_detector_down(state.nativeHandle)) || 0,
            changed: Number(this.nativeChangeDetector.soemdsp_change_detector_changed(state.nativeHandle)) || 0,
          };
        }
      } catch (error) {
        this.nativeChangeDetectorReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "change_detector",
          status: "disabled",
          message: String(error?.message || error || "native Change Detector failed"),
        });
      }
    }
    return this.changeDetectorSampleJs(state, input);
  }

  // --- Yellowjacket Filter ---

  createYellowjacketFilterState() {
    return { phase: 0, filterY1: 0, oscSelfMod: 0, lastOutValue: 0, nativeHandle: 0 };
  }

  destroyYellowjacketFilterNativeState(state) {
    if (state.nativeHandle && this.nativeYellowjacketFilter?.soemdsp_yellowjacket_filter_destroy) {
      this.nativeYellowjacketFilter.soemdsp_yellowjacket_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  yellowjacketFilterSampleJs(state, input, params, rate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freqNorm = this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1);
    const reso = this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1);
    const chaos = this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1);

    let maxPitch, resDropPoint;
    if (safeRate <= 44100) { maxPitch = 87.7; resDropPoint = 0.77; }
    else if (safeRate <= 88200) { maxPitch = 96.0; resDropPoint = 0.82; }
    else if (safeRate <= 132300) { maxPitch = 96.0; resDropPoint = 0.83; }
    else if (safeRate <= 176400) { maxPitch = 96.0; resDropPoint = 0.86; }
    else if (safeRate <= 220500) { maxPitch = 96.0; resDropPoint = 0.89; }
    else if (safeRate <= 264600) { maxPitch = 96.0; resDropPoint = 0.90; }
    else { maxPitch = 96.0; resDropPoint = 0.95; }

    const pitch = -156 + (96 - -156) * freqNorm;
    const frequencyHz = this.analogPitchToFreq(Math.min(pitch, maxPitch));
    const cutoffHz = frequencyHz * (4.56415 + (0.972007 - 4.56415) * chaos);

    const resGraph = [{x:0,y:reso,skew:0,shape:0},{x:resDropPoint,y:reso,skew:0,shape:0},{x:1,y:0.2,skew:0.57,shape:1}];
    const newResNormalized = this.analogEvalGraph(resGraph, freqNorm);
    const ellipseCGraph = [{x:0,y:7.6024,skew:0,shape:0},{x:1,y:0.00001,skew:0.99,shape:2}];
    const feedbackGainGraph = [{x:0,y:20.0,skew:0,shape:0},{x:1,y:-0.0429102,skew:0.99,shape:2}];
    const ellipseC = this.analogEvalGraph(ellipseCGraph, newResNormalized);
    const feedbackGain = this.analogEvalGraph(feedbackGainGraph, newResNormalized);

    const a = this.analogLadderCoefficient(cutoffHz, safeRate);

    const safeInput = this.safeFilterNumber(input, state);
    let inputSignal = Math.max(-7, Math.min(7, safeInput * 4));
    inputSignal = state.oscSelfMod + 1.04025 * inputSignal + state.lastOutValue;

    state.phase += (frequencyHz * 1.9400625 * inputSignal) / safeRate;
    state.phase -= Math.floor(state.phase);

    let oscValue = this.analogWaveEllipseFull(state.phase, 0.0, -0.71286768918541499, 0.70129855105756955, ellipseC);
    oscValue *= 0.635417;

    let y0 = oscValue;
    y0 = y0 / (1 + y0 * y0);
    state.filterY1 = y0 + a * (y0 - state.filterY1);
    inputSignal = state.filterY1;

    state.oscSelfMod = inputSignal * 20.0;

    const out = 1.3892758936011171 * oscValue;
    state.lastOutValue = out * 0.5 * feedbackGain;

    return this.safeFilterNumber(out, state);
  }

  yellowjacketFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeYellowjacketFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeYellowjacketFilter.soemdsp_yellowjacket_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeYellowjacketFilter.soemdsp_yellowjacket_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeYellowjacketFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "yellowjacket_filter",
          status: "disabled",
          message: String(error?.message || error || "native Yellowjacket Filter failed"),
        });
      }
    }
    return this.yellowjacketFilterSampleJs(state, input, params, rate);
  }

  // --- SuperLove Filter ---

  createSuperloveFilterState() {
    return { feedbackSignal: 0, filterY: [0,0,0,0,0], dcY: [0,0,0,0,0], nativeHandle: 0 };
  }

  destroySuperloveFilterNativeState(state) {
    if (state.nativeHandle && this.nativeSuperloveFilter?.soemdsp_superlove_filter_destroy) {
      this.nativeSuperloveFilter.soemdsp_superlove_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  superloveFilterSampleJs(state, input, params, rate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freqNorm = this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1);
    const reso = this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1);
    const chaos = this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1);
    const mode = Math.max(0, Math.min(3, Math.round(Number(params.mode) || 0)));
    const safeInput = this.safeFilterNumber(input, state);

    if (mode <= 1) {
      const resGraph = [{x:0,y:0,skew:0,shape:0},{x:1,y:-2.7175,skew:-0.85,shape:2}];
      const noiseGraph = [{x:0,y:0.00,skew:0,shape:0},{x:0.75,y:0.05,skew:-0.7,shape:2},{x:1,y:0.10,skew:0.6,shape:2}];
      const cutoffHz = Math.max(0, Math.min(0.5 * safeRate, this.analogPitchToFreq(-12 + (135 - -12) * freqNorm)));
      const mod = this.analogEvalGraph(resGraph, reso);
      const noiseAmp = this.analogEvalGraph(noiseGraph, chaos);
      const shape = chaos;

      state.feedbackSignal = mod * state.feedbackSignal + safeInput;
      const pm = (Math.random() * 2 - 1) * noiseAmp;
      const oscValue = -this.analogWaveTrisaw(state.feedbackSignal + 0.25725 + pm, shape);

      const a = this.analogLadderCoefficient(cutoffHz, safeRate);
      const stages = mode === 0 ? 3 : 4;
      state.feedbackSignal = this.analogLadderTapStep(state.filterY, oscValue, a, 1, stages);

      const dcCutoff = mode === 0 ? 10.0 : 5.0;
      const dcStages = mode === 0 ? 3 : 1;
      const dcA = this.analogLadderCoefficient(dcCutoff, safeRate);
      const dcOut = this.analogLadderTapStep(state.dcY, state.feedbackSignal, dcA, 2, dcStages);

      return this.safeFilterNumber(dcOut * 1.02, state);
    } else if (mode === 2) {
      const resGraph = [{x:0,y:-0.2,skew:0,shape:0},{x:1,y:1.3,skew:-0.85,shape:2}];
      const mod = this.analogEvalGraph(resGraph, reso);
      const shape = 1 - chaos;

      state.feedbackSignal = mod * state.feedbackSignal + safeInput;
      const oscValue = -this.analogWaveTrisaw(state.feedbackSignal + 0.75, shape);

      const lpA = this.analogLadderCoefficient(safeRate * 0.5, safeRate);
      let fb = this.analogLadderTapStep(state.filterY, oscValue * 0.1, lpA, 1, 1);

      const cutoffHz = Math.max(0, Math.min(0.5 * safeRate, this.analogPitchToFreq(-12 + (135 - -12) * freqNorm)));
      const hpA = this.analogLadderCoefficient(cutoffHz, safeRate);
      fb = this.analogLadderTapStep(state.dcY, fb, hpA, 2, 1);
      fb *= 10;

      state.feedbackSignal = fb;
      return this.safeFilterNumber(-fb * 0.31, state);
    } else {
      const resGraph = [{x:0,y:-0.2,skew:0,shape:0},{x:1,y:1.3,skew:-0.85,shape:2}];
      const mod = this.analogEvalGraph(resGraph, reso);
      const shape = 1 - chaos;

      state.feedbackSignal = mod * state.feedbackSignal + safeInput;
      const oscValue = -this.analogWaveTrisaw(state.feedbackSignal + 0.75, shape);

      const cutoffHz = Math.max(0, Math.min(0.5 * safeRate, this.analogPitchToFreq(-12 + (135 - -12) * freqNorm)));
      const a = this.analogLadderCoefficient(cutoffHz, safeRate);
      let fb = this.analogLadderTapStep(state.filterY, oscValue * 0.1, a, 3, 1);
      fb *= 10;

      state.feedbackSignal = fb;
      return this.safeFilterNumber(fb, state);
    }
  }

  superloveFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeSuperloveFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeSuperloveFilter.soemdsp_superlove_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeSuperloveFilter.soemdsp_superlove_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1),
              Math.max(0, Math.min(3, Math.round(Number(params.mode) || 0))),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeSuperloveFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "superlove_filter",
          status: "disabled",
          message: String(error?.message || error || "native SuperLove Filter failed"),
        });
      }
    }
    return this.superloveFilterSampleJs(state, input, params, rate);
  }

  // --- RSMET Filter ---

  createRsmetFilterState() {
    return { y: [0, 0, 0, 0, 0], nativeHandle: 0 };
  }

  destroyRsmetFilterNativeState(state) {
    if (state.nativeHandle && this.nativeRsmetFilter?.soemdsp_rsmet_filter_destroy) {
      this.nativeRsmetFilter.soemdsp_rsmet_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  rsmetFilterModeToLadder(rsmetMode) {
    const table = [[1,1],[1,2],[1,3],[1,4],[2,1],[2,2],[2,3],[2,4],[3,1],[3,4]];
    const idx = Math.max(0, Math.min(9, Math.round(rsmetMode)));
    return table[idx];
  }

  rsmetFilterSampleJs(state, input, params, rate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freqNorm = this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1);
    const resoNorm = this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1);
    const chaos = this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1);

    const freqGraph = [{x:0,y:3.0,skew:0,shape:0},{x:1,y:20000,skew:-0.95,shape:2}];
    const resoGraph = [{x:0,y:0.0,skew:0,shape:0},{x:1,y:1.0,skew:0.5,shape:2}];
    const cutoffHz = Math.max(0.000001, Math.min(safeRate * 0.49, this.analogEvalGraph(freqGraph, freqNorm)));
    const feedback = Math.max(0, Math.min(0.999, this.analogEvalGraph(resoGraph, resoNorm)));

    const [ladderMode, stages] = this.rsmetFilterModeToLadder(Number(params.mode) || 0);

    const wc = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * cutoffHz / safeRate));
    const sine = Math.sin(wc), cosine = Math.cos(wc), tangent = Math.tan(0.25 * (wc - Math.PI));
    let a = sine - cosine * tangent;
    a = (a > -1e-12 && a < 1e-12) ? (a >= 0 ? 1e-12 : -1e-12) : a;
    a = tangent / a;

    let mixS;
    const c = [0, 0, 0, 0, 0];
    if (ladderMode === 1) { c[stages] = 1; mixS = stages * 0.25; }
    else if (ladderMode === 2) {
      const hp = [[1,-1,0,0,0],[1,-2,1,0,0],[1,-3,3,-1,0],[1,-4,6,-4,1]];
      for (let i = 0; i <= stages; i++) c[i] = hp[stages-1][i];
      mixS = stages * 0.25;
    } else {
      const bp = [[0,2,-2,0,0],[0,2,-2,0,0],[0,0,3,-3,0],[0,0,4,-8,4]];
      for (let i = 0; i < 5; i++) c[i] = bp[stages-1][i];
      mixS = 0.125;
    }

    const b = 1 + a;
    const denom = Math.max(1e-12, 1 + a * a + 2 * a * cosine);
    const g2 = (b * b) / denom;
    const k = feedback / Math.max(1e-12, g2 * g2);
    const g = 1 + mixS * k;

    const safeInput = this.safeFilterNumber(input, state);
    let inputSignal = Math.tanh(safeInput * 2);
    if (chaos > 0) inputSignal += (Math.random() * 2 - 1) * chaos;

    const y = state.y;
    y[0] = (g * inputSignal - k * y[4]);
    y[0] = y[0] / (1 + y[0] * y[0]);
    y[1] = y[0] + a * (y[0] - y[1]);
    y[2] = y[1] + a * (y[1] - y[2]);
    y[3] = y[2] + a * (y[2] - y[3]);
    y[4] = y[3] + a * (y[3] - y[4]);

    const out = c[0]*y[0] + c[1]*y[1] + c[2]*y[2] + c[3]*y[3] + c[4]*y[4];
    return this.safeFilterNumber(out * 0.41, state);
  }

  rsmetFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeRsmetFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeRsmetFilter.soemdsp_rsmet_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeRsmetFilter.soemdsp_rsmet_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1),
              Math.max(0, Math.min(9, Math.round(Number(params.mode) || 0))),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeRsmetFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "rsmet_filter",
          status: "disabled",
          message: String(error?.message || error || "native RSMET Filter failed"),
        });
      }
    }
    return this.rsmetFilterSampleJs(state, input, params, rate);
  }

  // --- Chaotic Phase Locking Filter ---

  createChaoticPhaseLockingFilterState() {
    return { feedbackSignal: 0, filterY: [0,0,0,0,0], dcY: [0,0,0,0,0], nativeHandle: 0 };
  }

  chaoticPhaseLockingFilterSampleJs(state, input, params, rate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freqNorm = this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1);
    const reso = this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1);
    const chaos = this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1);

    const cutoffHz = Math.max(0, Math.min(0.5 * safeRate, this.analogPitchToFreq(-12 + (135 - -12) * freqNorm)));
    const resGraph = [{x:0,y:0.1,skew:0,shape:0},{x:1,y:20.0,skew:-0.85,shape:2}];
    const mod = this.analogEvalGraph(resGraph, reso);
    const shape = 1 - chaos;

    const safeInput = this.safeFilterNumber(input, state);
    state.feedbackSignal = mod * state.feedbackSignal + (-safeInput);
    const oscValue = this.analogWaveEllipse(state.feedbackSignal, shape);

    const a = this.analogLadderCoefficient(cutoffHz, safeRate);
    state.feedbackSignal = this.analogLadderTapStep(state.filterY, oscValue, a, 1, 2);

    const dcA = this.analogLadderCoefficient(5.0, safeRate);
    const dcOut = this.analogLadderTapStep(state.dcY, state.feedbackSignal, dcA, 2, 1);

    return this.safeFilterNumber(-dcOut, state);
  }

  chaoticPhaseLockingFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeChaoticPhaseLockingFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeChaoticPhaseLockingFilter.soemdsp_chaotic_phase_locking_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeChaoticPhaseLockingFilter.soemdsp_chaotic_phase_locking_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeChaoticPhaseLockingFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "chaotic_phase_locking_filter",
          status: "disabled",
          message: String(error?.message || error || "native Chaotic Phase Locking Filter failed"),
        });
      }
    }
    return this.chaoticPhaseLockingFilterSampleJs(state, input, params, rate);
  }

  // --- DSF Oscillator ---

  createDsfOscillatorState() {
    return { t: 0, sawAcc: 0, sqAcc: 0, blendSqAcc: 0, triAcc: 0, triPeak: 1, nativeHandle: 0 };
  }

  destroyDsfOscillatorNativeState(state) {
    if (state?.nativeHandle && this.nativeDsfOscillator?.soemdsp_dsf_oscillator_destroy) {
      this.nativeDsfOscillator.soemdsp_dsf_oscillator_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  dsfPureSawEng(t, n) {
    const denom = Math.sin(Math.PI * t);
    if (denom > -1e-9 && denom < 1e-9) return (2 * n + 1) - 1;
    return Math.sin(Math.PI * t * (2 * n + 1)) / denom - 1;
  }

  dsfPureSawEngMorphed(t, nMax, morph) {
    const m = this.clampValue(Number(morph) || 0, 0, 1);
    const target = 1 + m * (nMax - 1);
    const lowN = Math.max(1, Math.floor(target));
    const highN = Math.min(lowN + 1, nMax);
    const frac = target - lowN;
    return this.dsfPureSawEng(t, lowN) * (1 - frac) + this.dsfPureSawEng(t, highN) * frac;
  }

  dsfAdaptiveRetention(dt) {
    return Math.exp(-0.23026 * dt);
  }

  dsfOscillatorSampleJs(state, options = {}) {
    const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
    const safeFrequency = Number(options.frequencyHz) > 1 ? Number(options.frequencyHz) : 1;
    const dt = this.clampValue((Number(options.frequencyHz) || 0) / sampleRate, -0.5, 0.5);
    const waveform = Math.round(Number(options.waveform) || 0);
    const level = Number(options.level) || 0;

    let sample;
    if (waveform === 0) {
      state.t = this.wrapValue(state.t + dt, 0, 1);
      sample = Math.sin(state.t * Math.PI * 2);
    } else {
      const nyquist = sampleRate * 0.5;
      const nMax = Math.max(1, Math.floor(nyquist / safeFrequency));
      state.t = this.wrapValue(state.t + dt * 0.9999, 0, 1);

      const retention = this.dsfAdaptiveRetention(dt);
      const rawSaw = this.dsfPureSawEngMorphed(state.t, nMax, options.morph);
      state.sawAcc = state.sawAcc * retention + rawSaw * dt;

      if (waveform === 1) {
        sample = state.sawAcc;
      } else if (waveform === 4) {
        const rawBlendSquare = rawSaw - this.dsfPureSawEngMorphed(this.wrapValue(state.t - 0.5, 0, 1), nMax, options.morph);
        state.blendSqAcc = state.blendSqAcc * retention + rawBlendSquare * dt;
        const blend = this.clampValue(Number(options.blend) ?? 0.5, 0, 1);
        sample = state.sawAcc * (1 - blend) + state.blendSqAcc * blend;
      } else {
        const pw = this.clampValue(Number(options.pulseWidth) ?? 0.5, 0.01, 0.99);
        const rawShiftedSaw = this.dsfPureSawEngMorphed(this.wrapValue(state.t - pw, 0, 1), nMax, options.morph);
        const rawSquare = rawSaw - rawShiftedSaw;
        state.sqAcc = state.sqAcc * retention + rawSquare * dt;

        if (waveform === 2) {
          sample = state.sqAcc;
        } else {
          state.triAcc = state.triAcc * retention + state.sqAcc * dt * 4;
          const compensation = 1 / this.clampValue(Math.abs(Math.sin(Math.PI * pw)), 0.05, 1);
          const compensatedTri = state.triAcc * compensation;
          state.triPeak = Math.max(1, state.triPeak * 0.999 + Math.abs(compensatedTri) * 0.001);
          sample = compensatedTri / state.triPeak;
        }
      }
    }

    if (!Number.isFinite(sample)) sample = 0;
    const out = this.clampValue(sample, -1.5, 1.5) * level;
    return { Out: out };
  }

  dsfOscillatorSample(state, options = {}) {
    if (this.nativeDsfOscillatorReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeDsfOscillator.soemdsp_dsf_oscillator_create();
        }
        if (state.nativeHandle) {
          const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
          const frequencyHz = Number(options.frequencyHz) || 0;
          const waveform = Math.round(Number(options.waveform) || 0);
          const morph = Number(options.morph) || 0;
          const pulseWidth = Number(options.pulseWidth) ?? 0.5;
          const blend = Number(options.blend) ?? 0.5;
          const level = Number(options.level) || 0;
          this.nativeDsfOscillator.soemdsp_dsf_oscillator_sample(
            state.nativeHandle,
            frequencyHz,
            sampleRate,
            waveform,
            morph,
            pulseWidth,
            blend,
            level,
          );
          return {
            Out: Number(this.nativeDsfOscillator.soemdsp_dsf_oscillator_out(state.nativeHandle)) || 0,
          };
        }
      } catch (error) {
        this.nativeDsfOscillatorReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "dsf_oscillator",
          status: "disabled",
          message: String(error?.message || error || "native DSF Oscillator failed"),
        });
      }
    }
    return this.dsfOscillatorSampleJs(state, options);
  }

  // --- Quadrature Oscillator ---
  // The coupled-form ("magic circle") two-multiply recurrence:
  //   u[n] = u[n-1] - k*v[n-1]; v[n] = v[n-1] + k*u[n]; k = 2*sin(w/2).
  // See native_modules/quadrature_oscillator/quadrature_oscillator.cpp for
  // the full derivation. JS fallback mirrors that file exactly, including
  // the periodic renormalization against float amplitude drift.

  createQuadratureOscillatorState() {
    return { u: 1, v: 0, lastReset: 0, nativeHandle: 0 };
  }

  destroyQuadratureOscillatorNativeState(state) {
    if (state?.nativeHandle && this.nativeQuadratureOscillator?.soemdsp_quadrature_oscillator_destroy) {
      this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  quadratureOscillatorSampleJs(state, options = {}) {
    const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
    const frequencyHz = Number(options.frequencyHz) || 0;
    const amplitude = Number(options.amplitude) || 0;
    const resetGate = Number(options.resetGate) || 0;
    const phaseCycles = Number(options.phaseCycles) || 0;

    if (resetGate > 0.5 && state.lastReset <= 0) {
      const angle = phaseCycles * Math.PI * 2;
      state.u = Math.cos(angle);
      state.v = Math.sin(angle);
    }
    state.lastReset = resetGate;

    const w = (Math.PI * 2 * frequencyHz) / sampleRate;
    const k = 2 * Math.sin(w * 0.5);

    const nextU = state.u - k * state.v;
    const nextV = state.v + k * nextU;

    const r2 = nextU * nextU + nextV * nextV;
    let correctedU = nextU;
    let correctedV = nextV;
    if (r2 > 1e-12 && (r2 < 0.999 || r2 > 1.001)) {
      const scale = 1 / Math.sqrt(r2);
      correctedU = nextU * scale;
      correctedV = nextV * scale;
    }

    if (!Number.isFinite(correctedU) || !Number.isFinite(correctedV)) {
      const angle = phaseCycles * Math.PI * 2;
      correctedU = Math.cos(angle);
      correctedV = Math.sin(angle);
    }

    state.u = correctedU;
    state.v = correctedV;

    return {
      cos: this.clampValue(correctedU, -1.5, 1.5) * amplitude,
      sin: this.clampValue(correctedV, -1.5, 1.5) * amplitude,
    };
  }

  quadratureOscillatorSample(state, options = {}) {
    if (this.nativeQuadratureOscillatorReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_create();
        }
        if (state.nativeHandle) {
          const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
          const frequencyHz = Number(options.frequencyHz) || 0;
          const amplitude = Number(options.amplitude) || 0;
          const resetGate = Number(options.resetGate) || 0;
          const phaseCycles = Number(options.phaseCycles) || 0;
          this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_sample(
            state.nativeHandle,
            resetGate,
            phaseCycles,
            frequencyHz,
            sampleRate,
            amplitude,
          );
          return {
            cos: this.safeFilterNumber(
              this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_cos(state.nativeHandle),
              null,
            ),
            sin: this.safeFilterNumber(
              this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_sin(state.nativeHandle),
              null,
            ),
          };
        }
      } catch (error) {
        this.nativeQuadratureOscillatorReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "quadrature_oscillator",
          status: "disabled",
          message: String(error?.message || error || "native Quadrature Oscillator failed"),
        });
      }
    }
    return this.quadratureOscillatorSampleJs(state, options);
  }

  // RobinSupersaw -- see native_modules/robin_supersaw/robin_supersaw.cpp
  // for the full derivation (Robin Schmidt's pitch dithering,
  // RobinSchmidt/RS-MET). This worklet's JS fallback is fully self-
  // contained (not calling the shared public/node-graph-robin-supersaw.js
  // globals) -- the AudioWorkletProcessor runs in its own isolated global
  // scope that never loads that file. Calling those globals here silently
  // threw a ReferenceError inside the audio thread whenever the native
  // path wasn't active, producing total silence with no visible console
  // error -- the same pitfall DSF Oscillator's fallback already avoids by
  // inlining its own copy instead of sharing one.
  createRobinSupersawDitherVoice() {
    return { sampleCount: 0, lenNow: 100, lenMid: 100, probShort: 0, probMid: 1, phaseSlope: 1 / 99 };
  }

  createRobinSupersawState() {
    const left = [];
    const right = [];
    for (let i = 0; i < 9; i++) {
      left.push(this.createRobinSupersawDitherVoice());
      right.push(this.createRobinSupersawDitherVoice());
    }
    return { left, right, nativeHandle: 0 };
  }

  destroyRobinSupersawNativeState(state) {
    if (state?.nativeHandle && this.nativeRobinSupersaw?.soemdsp_robin_supersaw_destroy) {
      this.nativeRobinSupersaw.soemdsp_robin_supersaw_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  // rsPitchDitherOsc<T>::calcCycleDistribution(), transcribed.
  robinSupersawCalcCycleDistribution(c) {
    const ci = Math.floor(c);
    const cf = c - ci;
    let c2 = ci;
    if (cf >= 0.5) c2 += 1;
    const c1 = c2 - 1;
    const c3 = c2 + 1;
    const e1 = c1 - c;
    const e2 = c2 - c;
    const e3 = c3 - c;
    const v1 = e1 * e1;
    const v2 = e2 * e2;
    const v3 = e3 * e3;
    const v = 0.25;
    const d1 = v - v1;
    const d2 = v - v2;
    const d3 = v - v3;
    const s = 1 / (e3 * (v1 - v2) - e2 * (v1 - v3) + e1 * (v2 - v3));
    return { lenMid: c2, probShort: (d2 * e3 - d3 * e2) * s, probMid: (d3 * e1 - d1 * e3) * s };
  }

  // rsPitchDitherOsc<T>::updateCycleLength(), transcribed.
  robinSupersawUpdateCycleLength(voice) {
    const r = Math.random();
    if (r < voice.probShort) {
      voice.lenNow = voice.lenMid - 1;
    } else if (r < voice.probShort + voice.probMid) {
      voice.lenNow = voice.lenMid;
    } else {
      voice.lenNow = voice.lenMid + 1;
    }
    voice.phaseSlope = 1 / Math.max(1, voice.lenNow - 1);  // phasorRangeClosed = true
  }

  // rsPitchDitherOsc<T>::getSamplePhasor() + updateSampleCount(), transcribed.
  robinSupersawGetSamplePhasor(voice) {
    const p = voice.phaseSlope * voice.sampleCount;
    voice.sampleCount += 1;
    if (voice.sampleCount >= voice.lenNow) {
      voice.sampleCount = 0;
      this.robinSupersawUpdateCycleLength(voice);
    }
    return p;
  }

  robinSupersawSumVoiceBank(bank, numVoices, safeFrequency, sampleRate, spreadCents) {
    let sum = 0;
    for (let i = 0; i < numVoices; i++) {
      let centsOffset = 0;
      if (numVoices > 1) {
        const t = i / (numVoices - 1);
        centsOffset = (t - 0.5) * spreadCents;
      }
      const ratio = Math.pow(2, centsOffset / 1200);
      const voiceFreq = safeFrequency * ratio;
      const meanCycleLength = sampleRate / Math.max(1, voiceFreq);
      const voice = bank[i];
      const dist = this.robinSupersawCalcCycleDistribution(meanCycleLength);
      voice.lenMid = dist.lenMid;
      voice.probShort = dist.probShort;
      voice.probMid = dist.probMid;
      sum += 2 * this.robinSupersawGetSamplePhasor(voice) - 1;  // WF::saw(phasor)
    }
    return sum / numVoices;
  }

  robinSupersawSampleJs(state, options = {}) {
    const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
    const safeFrequency = Number(options.frequencyHz) > 1 ? Number(options.frequencyHz) : 1;
    const numVoices = this.clampValue(Math.round(Number(options.voices) || 1), 1, 9);
    const spreadCents = this.clampValue(Number(options.detuneCents) || 0, 0, 100);
    const level = Number(options.level) || 0;

    let left = this.robinSupersawSumVoiceBank(state.left, numVoices, safeFrequency, sampleRate, spreadCents);
    let right = this.robinSupersawSumVoiceBank(state.right, numVoices, safeFrequency, sampleRate, spreadCents);
    if (!Number.isFinite(left)) left = 0;
    if (!Number.isFinite(right)) right = 0;

    const outLeft = this.clampValue(left, -1.5, 1.5) * level;
    const outRight = this.clampValue(right, -1.5, 1.5) * level;
    // Arithmetic average, not a raw sum -- matches this sandbox's own
    // Output module convention, so mono doesn't come out twice as loud.
    const outMono = (outLeft + outRight) * 0.5;
    return { Mono: outMono, Left: outLeft, Right: outRight };
  }

  robinSupersawSample(state, options = {}) {
    if (
      this.nativeRobinSupersawReady &&
      this.nativeRobinSupersaw?.soemdsp_robin_supersaw_create &&
      this.nativeRobinSupersaw?.soemdsp_robin_supersaw_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeRobinSupersaw.soemdsp_robin_supersaw_create();
        }
        if (state.nativeHandle) {
          const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
          const frequencyHz = Number(options.frequencyHz) || 0;
          const detuneCents = Number(options.detuneCents) || 0;
          const voices = Math.round(Number(options.voices) || 1);
          const level = Number(options.level) || 0;
          this.nativeRobinSupersaw.soemdsp_robin_supersaw_sample(
            state.nativeHandle,
            frequencyHz,
            sampleRate,
            detuneCents,
            voices,
            level,
          );
          return {
            Mono: Number(this.nativeRobinSupersaw.soemdsp_robin_supersaw_mono(state.nativeHandle)) || 0,
            Left: Number(this.nativeRobinSupersaw.soemdsp_robin_supersaw_left(state.nativeHandle)) || 0,
            Right: Number(this.nativeRobinSupersaw.soemdsp_robin_supersaw_right(state.nativeHandle)) || 0,
          };
        }
      } catch (error) {
        this.nativeRobinSupersawReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "robin_supersaw",
          status: "disabled",
          message: String(error?.message || error || "native RobinSupersaw failed"),
        });
      }
    }
    return this.robinSupersawSampleJs(state, options);
  }


  // --- Flower Child Filter ---

  createFlowerChildFilterState() {
    return {
      phase: 0, phaseOffset: 0, stage1: 0, stage2: 0, selfMod: 0,
      rev3Feedback: 0, rev3Lpf1Y1: 0, rev3Lpf2Y1: 0, dsPhase: 0, dsHeld: 0,
      nativeHandle: 0,
    };
  }

  destroyFlowerChildFilterNativeState(state) {
    if (state.nativeHandle && this.nativeFlowerChildFilter?.soemdsp_flower_child_filter_destroy) {
      this.nativeFlowerChildFilter.soemdsp_flower_child_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  flowerChildFilterCurveShape(v, tension) {
    const denom = 2 * tension * v - tension - 1;
    if (denom === 0) return v;
    return (tension * v - v) / denom;
  }

  flowerChildFilterRationalCurve(p, skew) {
    return ((1 + skew) * p) / (1 - skew + 2 * skew * p);
  }

  flowerChildFilterEvalResonanceGraph(x, n0y, breakpoint, n2y, skew) {
    if (x < 0) return n0y;
    if (x >= 1) return n2y;
    if (x < breakpoint) return n0y;
    const p = (x - breakpoint) / (1 - breakpoint);
    return n0y + (n2y - n0y) * this.flowerChildFilterRationalCurve(p, skew);
  }

  flowerChildFilterOnePoleCoefficient(cutoffHz, sampleRateValue) {
    const rawWc = (2 * Math.PI * cutoffHz) / sampleRateValue;
    const wc = this.clampValue(rawWc, 1e-9, Math.PI * 0.98);
    const s = Math.sin(wc);
    const c = Math.cos(wc);
    const t = Math.tan(0.25 * (wc - Math.PI));
    let denom = s - c * t;
    if (denom > -1e-12 && denom < 1e-12) denom = denom >= 0 ? 1e-12 : -1e-12;
    return t / denom;
  }

  flowerChildFilterOnePoleStep(prevY1, input, a) {
    let y0 = input;
    y0 = y0 / (1 + y0 * y0);
    return y0 + a * (y0 - prevY1);
  }

  flowerChildFilterEllipse(phase, ellipseC) {
    const sinX = Math.sin(phase * 2 * Math.PI);
    const cosX = Math.cos(phase * 2 * Math.PI);
    let sqrtVal = Math.sqrt(cosX * cosX + (ellipseC * sinX) * (ellipseC * sinX));
    if (sqrtVal < 1e-12) sqrtVal = 1e-12;
    return cosX / sqrtVal;
  }

  flowerChildFilterEvalGraph(nodes, x) {
    if (nodes.length === 0) return 0;
    if (x < nodes[0].x) return nodes[0].y;
    let i = -1;
    for (let k = 0; k < nodes.length; k++) {
      if (nodes[k].x > x) { i = k; break; }
    }
    if (i < 0) return nodes[nodes.length - 1].y;
    if (i === 0) return nodes[0].y;
    const n1 = nodes[i - 1];
    const n2 = nodes[i];
    if (n2.x - n1.x < 1e-9) return 0.5 * (n1.y + n2.y);
    const p = (x - n1.x) / (n2.x - n1.x);
    if (n2.shape === 1) return n1.y + (n2.y - n1.y) * this.flowerChildFilterRationalCurve(p, n2.skew);
    if (n2.shape === 2) {
      const c = 0.5 * (n2.skew + 1);
      const a = 2 * Math.log((1 - c) / c);
      return n1.y + (n2.y - n1.y) * (1 - Math.exp(p * a)) / (1 - Math.exp(a));
    }
    return n1.y + (n2.y - n1.y) * p;
  }

  flowerChildFilterOnePoleIitCoefficient(cutoffHz, sampleRateValue) {
    const w = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * cutoffHz / sampleRateValue));
    return Math.exp(-w);
  }

  flowerChildFilterOnePoleIitStep(prevY1, input, a1) {
    const b0 = 1 - a1;
    return b0 * input + a1 * prevY1;
  }

  flowerChildFilterSampleAndHold(state, incoming, samplingFreq, sampleRateValue) {
    state.dsPhase += samplingFreq / sampleRateValue;
    if (state.dsPhase >= 1) {
      state.dsPhase -= Math.floor(state.dsPhase);
      state.dsHeld = incoming;
    }
    return state.dsHeld;
  }

  flowerChildFilterSampleJs(state, input, params, rate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freqNorm = this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1);
    const reso = this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1);
    const modeNum = Math.round(Number(params.mode) || 0);

    if (modeNum === 2) {
      const masterPitch = -120 + (105 - -120) * freqNorm;
      const masterFrequency = 440 * Math.pow(2, (masterPitch - 69) / 12);
      const fmAmount = 440 * Math.pow(2, (-48.377 - 69) / 12);
      const lpf1Cutoff = 440 * Math.pow(2, ((90 + (180 - 90) * (masterPitch - -120) / (120 - -120)) - 69) / 12);
      const lpf2Cutoff = 440 * Math.pow(2, ((80 + (130 - 80) * (masterPitch - -120) / (120 - -120)) - 69) / 12);
      const lpf1A = this.flowerChildFilterOnePoleIitCoefficient(lpf1Cutoff, safeRate);
      const lpf2A = this.flowerChildFilterOnePoleIitCoefficient(lpf2Cutoff, safeRate);

      const phaseModGraph = [{x:0,y:0.0,skew:0,shape:0},{x:0.5,y:-0.017446,skew:0.9,shape:1},{x:0.6,y:-0.017575,skew:0.0,shape:1},{x:1.0,y:-0.0147,skew:0.6,shape:1}];
      const sineAmpGraph = [{x:0,y:4.44777,skew:0,shape:0},{x:0.5,y:8.6687,skew:0.9,shape:1},{x:0.6,y:8.6687,skew:0.0,shape:1},{x:1.0,y:2.0,skew:0.6,shape:1}];
      const sineToSquareGraph = [{x:0,y:0.6792,skew:0,shape:0},{x:0.5,y:0.9552,skew:0.9,shape:1},{x:0.6,y:0.9552,skew:0.0,shape:1},{x:1.0,y:0.001,skew:0.6,shape:1}];
      const clipLevelGraph = [{x:0.0,y:7.0,skew:0,shape:0},{x:0.7,y:7.0,skew:0.0,shape:1},{x:1.0,y:2.0,skew:0.6,shape:1}];

      const pmAmount = this.flowerChildFilterEvalGraph(phaseModGraph, reso);
      const sineAmp = this.flowerChildFilterEvalGraph(sineAmpGraph, reso);
      const sineToSquare = this.flowerChildFilterEvalGraph(sineToSquareGraph, reso);
      const clipLevelRaw = this.flowerChildFilterEvalGraph(clipLevelGraph, reso);
      const clipLevel = Math.min(sineAmp, clipLevelRaw);

      const safeInput = this.safeFilterNumber(input, state);
      const inSig = state.rev3Feedback + this.clampValue(-1 * safeInput, -clipLevel, clipLevel);
      const f = masterFrequency * inSig * fmAmount;

      state.phase = state.phase + f / safeRate;
      state.phase = state.phase - Math.floor(state.phase);
      const bipolarPhasor = 2 * state.phase - 1;
      const phasorOut = bipolarPhasor + pmAmount * state.rev3Feedback;

      const ellipseOut = sineAmp * this.flowerChildFilterEllipse(phasorOut, sineToSquare);

      let feedback = this.flowerChildFilterOnePoleIitStep(state.rev3Lpf1Y1, ellipseOut, lpf1A);
      state.rev3Lpf1Y1 = feedback;
      feedback = this.flowerChildFilterOnePoleIitStep(state.rev3Lpf2Y1, feedback, lpf2A);
      state.rev3Lpf2Y1 = feedback;
      state.rev3Feedback = feedback;

      return this.safeFilterNumber(feedback * 0.15, state);
    }

    if (modeNum === 3) {
      const maxNormFreq3 = safeRate <= 44100 ? 0.928 : 1;
      const normalizedFreqInUse3 = Math.min(freqNorm, maxNormFreq3) * (161 - 3) + 3;
      const frequencyHz3 = 440 * Math.pow(2, (normalizedFreqInUse3 - 69) / 12);

      const cutoff1 = frequencyHz3 * 0.4;
      const a1 = this.flowerChildFilterOnePoleCoefficient(cutoff1, safeRate);

      let breakpoint, cap;
      if (safeRate <= 44100) { breakpoint = 0.732441; cap = 0.649123; }
      else if (safeRate <= 88200) { breakpoint = 0.816054; cap = 0.818713; }
      else { breakpoint = 0.879599; cap = 0.807018; }
      const cappedTarget = Math.min(reso, cap);
      const graphValue = this.flowerChildFilterEvalResonanceGraph(reso, reso, breakpoint, cappedTarget, -0.38);
      const selfModAmp = 0.0368 + (0.6333 - 0.0368) * this.flowerChildFilterCurveShape(graphValue, 0.4);

      const safeInput = this.safeFilterNumber(input, state);
      let inputSignal = this.clampValue(-safeInput, -1, 1) * 0.036;
      inputSignal += state.selfMod;

      const mod = 1.4 * inputSignal;
      const fm = mod;

      state.phase = state.phase + (frequencyHz3 * fm * 6.0) / safeRate;
      state.phase = state.phase - Math.floor(state.phase);

      const dsf = [{x:0,y:0,skew:0,shape:0},{x:1,y:0.025*safeRate,skew:-0.09,shape:2}];
      const samplingFreq = frequencyHz3 * 2.0 + this.flowerChildFilterEvalGraph(dsf, 10.0 * Math.abs(mod));

      const downsampledPhase = this.flowerChildFilterSampleAndHold(state, state.phase, samplingFreq, safeRate);
      const current_osc_value = Math.sin(downsampledPhase * 2 * Math.PI) * 1.3;

      const filtered = this.flowerChildFilterOnePoleStep(state.stage1, current_osc_value, a1);
      state.stage1 = filtered;
      state.selfMod = filtered * selfModAmp;

      return this.safeFilterNumber(filtered * 1.4, state);
    }

    const dirty = modeNum !== 0;

    const maxNormFreq = safeRate <= 44100 ? 0.928 : 1;
    const normalizedFreqInUse = Math.min(freqNorm, maxNormFreq) * (161 - 3) + 3;
    const frequencyHz = 440 * Math.pow(2, (normalizedFreqInUse - 69) / 12);

    const cutoff1 = frequencyHz * 0.164312;
    const cutoff2 = frequencyHz * 0.366131;
    const a1 = this.flowerChildFilterOnePoleCoefficient(cutoff1, safeRate);
    const a2 = this.flowerChildFilterOnePoleCoefficient(cutoff2, safeRate);

    let breakpoint, cap;
    if (dirty) {
      if (safeRate <= 44100) { breakpoint = 0.816054; cap = 0.602339; }
      else if (safeRate <= 88200) { breakpoint = 0.902657; cap = 0.654971; }
      else { breakpoint = 0.977649; cap = 0.760234; }
    } else {
      if (safeRate <= 44100) { breakpoint = 0.732441; cap = 0.649123; }
      else if (safeRate <= 88200) { breakpoint = 0.816054; cap = 0.818713; }
      else { breakpoint = 0.879599; cap = 0.807018; }
    }
    const cappedTarget = Math.min(reso, cap);

    let selfModAmp = 1;
    let ellipseC = -1;
    if (!dirty) {
      const graphValue = this.flowerChildFilterEvalResonanceGraph(reso, reso, breakpoint, cappedTarget, -0.38);
      selfModAmp = 0.0368 + (0.6333 - 0.0368) * this.flowerChildFilterCurveShape(graphValue, 0.4);
    } else {
      const graphValue = this.flowerChildFilterEvalResonanceGraph(freqNorm, reso, breakpoint, cappedTarget, -0.38);
      ellipseC = -1 + (0.00001 - -1) * this.flowerChildFilterCurveShape(graphValue, -0.6);
    }

    const clampLimit = dirty ? 1.198 : 1;
    const safeInput = this.safeFilterNumber(input, state);
    let inputSignal = this.clampValue(-safeInput, -clampLimit, clampLimit);

    inputSignal = state.selfMod + 0.035848699999999845 * inputSignal;

    const mod = 1.4 * inputSignal;
    const fm = mod;

    state.phaseOffset = 0;
    const incAmt = (frequencyHz * fm) / safeRate;
    state.phase = state.phase + incAmt;
    state.phase = state.phase - Math.floor(state.phase);
    let unipolarPhase = state.phase + state.phaseOffset;
    unipolarPhase = unipolarPhase - Math.floor(unipolarPhase);

    const oscValue = dirty
      ? this.flowerChildFilterEllipse(unipolarPhase, ellipseC) * 0.1
      : Math.sin(unipolarPhase * 2 * Math.PI) * 1.3;

    let out = this.flowerChildFilterOnePoleStep(state.stage1, oscValue, a1);
    state.stage1 = out;
    out = this.flowerChildFilterOnePoleStep(state.stage2, out, a2);
    state.stage2 = out;

    state.selfMod = dirty ? out * 0.465 : out * selfModAmp;

    const output = dirty ? out * 5.22 : out * 1.31;
    return this.safeFilterNumber(output, state);
  }

  flowerChildFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeFlowerChildFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeFlowerChildFilter.soemdsp_flower_child_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeFlowerChildFilter.soemdsp_flower_child_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1),
              Math.max(0, Math.min(3, Math.round(Number(params.mode) || 0))),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeFlowerChildFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "flower_child_filter",
          status: "disabled",
          message: String(error?.message || error || "native Flower Child Filter failed"),
        });
      }
    }
    return this.flowerChildFilterSampleJs(state, input, params, rate);
  }

  // --- Resonator Filter ---

  createResonatorFilterState() {
    return {
      phase1: 0, phase2: 0, filterY: [0,0,0,0,0], dcY: [0,0,0,0,0],
      osc1Value: 0, osc2Value: 0, osc1SelfMod: 0, osc2SelfMod: 0, sawFeedback: 0,
      nativeHandle: 0,
    };
  }

  destroyResonatorFilterNativeState(state) {
    if (state.nativeHandle && this.nativeResonatorFilter?.soemdsp_resonator_filter_destroy) {
      this.nativeResonatorFilter.soemdsp_resonator_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  resonatorFilterSampleJs(state, input, params, rate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freqNorm = this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1);
    const reso = this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1);
    const chaos = this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1);
    const mode = Math.max(0, Math.min(2, Math.round(Number(params.mode) || 0)));
    const safeInput = this.safeFilterNumber(input, state);

    if (mode === 0 || mode === 1) {
      const triangle = mode === 1;
      const inputAmplitude = triangle ? 3.0 : 2.0;

      let maxFreqNorm, resDropPoint;
      if (safeRate <= 44100) { maxFreqNorm = 0.855; resDropPoint = 0.74; }
      else if (safeRate <= 88200) { maxFreqNorm = 0.9; resDropPoint = 0.75; }
      else if (safeRate <= 132300) { maxFreqNorm = 0.9; resDropPoint = 0.82; }
      else if (safeRate <= 176400) { maxFreqNorm = 0.9; resDropPoint = 0.88; }
      else if (safeRate <= 220500) { maxFreqNorm = 0.9; resDropPoint = 0.92; }
      else { maxFreqNorm = 0.955; resDropPoint = 0.92; }

      const freqNormInUse = Math.min(freqNorm, maxFreqNorm);
      const frequencyHz = this.analogPitchToFreq(-72.96 + (69.76 - -72.96) * freqNormInUse);
      const cutoffHz = frequencyHz * (0.248387 + (0.0927813 - 0.248387) * this.flowerChildFilterCurveShape(freqNormInUse, -0.36));
      const osc2Ratio = 0.015625 + (1.58 - 0.015625) * freqNormInUse;
      const osc1Ratio = osc2Ratio - 0.015625;

      const resGraph = [{x:0,y:reso,skew:0,shape:0},{x:resDropPoint,y:reso,skew:0,shape:0},{x:1,y:0.15,skew:0.557,shape:1}];
      const newResNorm = this.analogEvalGraph(resGraph, freqNorm);
      const freqModAmt = 10.0 + (484.43 - 10.0) * newResNorm;
      const phaseModAmt = 0.256 + (0.166 - 0.256) * chaos;

      let inputSignal = inputAmplitude * safeInput;
      inputSignal = state.osc2Value + state.osc1SelfMod + inputSignal;

      const freq1 = frequencyHz * osc1Ratio * freqModAmt * 0.1 * inputSignal;
      const clampedFreq1 = Math.max(-safeRate * 0.5, Math.min(safeRate * 0.5, freq1));
      state.phase1 += clampedFreq1 / safeRate;
      state.phase1 -= Math.floor(state.phase1);
      const phaseOffset1 = inputSignal * phaseModAmt;
      let unipolar1 = state.phase1 + phaseOffset1;
      unipolar1 -= Math.floor(unipolar1);
      state.osc1Value = this.analogWaveEllipse(unipolar1, 0.00749) * 0.5;

      const a = this.analogLadderCoefficient(cutoffHz, safeRate);
      inputSignal = this.analogLadderTapStep(state.filterY, state.osc1Value, a, 1, 1);

      state.osc1SelfMod = inputSignal;
      state.osc2SelfMod = state.osc2Value;

      const fm2 = freqModAmt * 4.53126 * inputSignal + state.osc2SelfMod * 3.0;
      const freq2 = frequencyHz * osc2Ratio * fm2;
      const clampedFreq2 = Math.max(-safeRate * 0.5, Math.min(safeRate * 0.5, freq2));
      state.phase2 += clampedFreq2 / safeRate;
      state.phase2 -= Math.floor(state.phase2);

      let out;
      if (!triangle) {
        out = Math.sin(state.phase2 * 2 * Math.PI);
        state.osc2Value = out * 10.0;
      } else {
        const ellipseCGraph = [{x:0,y:0.3,skew:0,shape:0},{x:1,y:1.0,skew:-0.99,shape:2}];
        const ellipseC = this.analogEvalGraph(ellipseCGraph, freqNormInUse);
        out = this.analogWaveEllipse(state.phase2, ellipseC);
        state.osc2Value = out * 10.0;
      }

      const dcA = this.analogLadderCoefficient(5.0, safeRate);
      const dcOut = this.analogLadderTapStep(state.dcY, -out, dcA, 2, 1);
      return this.safeFilterNumber(dcOut * (triangle ? 10.0 : 4.6), state);
    } else {
      const inputAmplitude = 2.0;
      const frequencyHz = this.analogPitchToFreq(-50 + (108 - -50) * freqNorm);
      const cutoffHz = frequencyHz * 8.87718;

      const mod21Graph = [{x:0,y:-0.00105655,skew:0,shape:0},{x:1,y:-2.52898,skew:-0.99,shape:2}];
      const fmpm12Graph = [{x:0,y:0.0,skew:0,shape:0},{x:1,y:0.012216,skew:0.54,shape:2}];

      let breakpoint2, cap3;
      if (safeRate <= 44100) { breakpoint2 = 0.578595; cap3 = 0.432749; }
      else if (safeRate <= 88200) { breakpoint2 = 0.692308; cap3 = 0.502924; }
      else if (safeRate <= 132300) { breakpoint2 = 0.749164; cap3 = 0.561404; }
      else { breakpoint2 = 0.776273; cap3 = 0.54386; }
      const cappedTarget = Math.min(reso, cap3);
      const resGraph = [{x:0,y:0,skew:0,shape:0},{x:0.0434783,y:reso,skew:0,shape:0},{x:breakpoint2,y:reso,skew:0,shape:0},{x:1,y:cappedTarget,skew:0.195211,shape:1}];
      const resSample = this.analogEvalGraph(resGraph, freqNorm);
      let mod21 = this.analogEvalGraph(mod21Graph, resSample);
      if (mod21 < -1.53) mod21 = -1.53;
      const fmpm12 = this.analogEvalGraph(fmpm12Graph, chaos);

      let inputSignal = (-safeInput) * inputAmplitude + state.sawFeedback * -8.07896613446314289533 + state.osc2Value + state.osc1SelfMod * 20.0;

      const freq1 = frequencyHz * mod21 * inputSignal;
      state.phase1 += freq1 / safeRate;
      state.phase1 -= Math.floor(state.phase1);
      state.osc1Value = Math.sin(state.phase1 * 2 * Math.PI);
      const scaleX = 2 / 0.00873698;
      state.osc1Value = (0.00873698 / 2) * Math.tanh(scaleX * state.osc1Value);

      const a = this.analogLadderCoefficient(cutoffHz, safeRate);
      inputSignal = this.analogLadderTapStep(state.filterY, state.osc1Value, a, 1, 1);

      state.osc1SelfMod = inputSignal;
      state.osc2SelfMod = state.osc2Value;

      const modv = inputSignal * -140.010789331 + state.osc2SelfMod * -1.05208;
      const fm = Math.cos((Math.PI / 2) * fmpm12) * modv;
      const pm = Math.sin((Math.PI / 2) * fmpm12) * modv;
      state.phase2 += (frequencyHz * (-0.425 + fm)) / safeRate;
      state.phase2 -= Math.floor(state.phase2);
      let unipolar2 = state.phase2 + pm;
      unipolar2 -= Math.floor(unipolar2);
      state.osc2Value = Math.sin(unipolar2 * 2 * Math.PI);

      state.sawFeedback = inputSignal + state.osc2Value;

      const dcA = this.analogLadderCoefficient(5.0, safeRate);
      const dcOut = this.analogLadderTapStep(state.dcY, -state.osc2Value * 0.1, dcA, 2, 1);
      return this.safeFilterNumber(dcOut * 80.0, state);
    }
  }

  resonatorFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeResonatorFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeResonatorFilter.soemdsp_resonator_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeResonatorFilter.soemdsp_resonator_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1),
              Math.max(0, Math.min(2, Math.round(Number(params.mode) || 0))),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeResonatorFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "resonator_filter",
          status: "disabled",
          message: String(error?.message || error || "native Resonator Filter failed"),
        });
      }
    }
    return this.resonatorFilterSampleJs(state, input, params, rate);
  }

  // --- Human Filter ---

  createHumanFilterState() {
    return {
      phase1: 0, phase2: 0, osc1Value: 0, osc2Value: 0, lastOutValue: 0,
      osc1ModSelf: 0, osc2ModSelf: 0, fbZ1: 0, fbZ2: 0, dcY: [0,0,0,0,0],
      nativeHandle: 0,
    };
  }

  destroyHumanFilterNativeState(state) {
    if (state.nativeHandle && this.nativeHumanFilter?.soemdsp_human_filter_destroy) {
      this.nativeHumanFilter.soemdsp_human_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  humanFilterDbToAmp(db) {
    return Math.pow(10, db / 20);
  }

  humanFilterSampleJs(state, input, params, rate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freqNorm = this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1);
    const reso = this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1);
    const chaos = this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1);
    const mode = Math.max(0, Math.min(2, Math.round(Number(params.mode) || 0)));

    let maxPitch, resDropPoint, chaosMax;
    if (safeRate <= 44100) { maxPitch = 115.57; resDropPoint = 0.78; chaosMax = 0.64; }
    else if (safeRate <= 88200) { maxPitch = 128.7; resDropPoint = 0.78; chaosMax = 1.0; }
    else if (safeRate <= 132300) { maxPitch = 137.0; resDropPoint = 0.83; chaosMax = 0.856; }
    else if (safeRate <= 176400) { maxPitch = 137.0; resDropPoint = 0.91; chaosMax = 1.0; }
    else if (safeRate <= 220500) { maxPitch = 137.0; resDropPoint = 1.0; chaosMax = 1.0; }
    else { maxPitch = 137.0; resDropPoint = 0.78; chaosMax = 1.0; }

    const pitch = -0.38 + (137.0 - -0.38) * freqNorm;
    const frequencyHz = this.analogPitchToFreq(Math.min(pitch, maxPitch));

    const mod11Graph = [{x:0.0,y:2.92396,skew:0,shape:0},{x:1.0,y:-1.7544,skew:0.785442,shape:1}];
    let mod11;
    if (resDropPoint !== 1.0) {
      const resVfreqGraph = [{x:0.0,y:reso,skew:0,shape:0},{x:resDropPoint,y:reso,skew:0,shape:0},{x:1.0,y:0.2,skew:0.57,shape:1}];
      const newResNormalized = this.analogEvalGraph(resVfreqGraph, freqNorm);
      mod11 = this.analogEvalGraph(mod11Graph, newResNormalized);
    } else {
      mod11 = this.analogEvalGraph(mod11Graph, reso);
    }

    const gainDb = Math.min(chaos, chaosMax) * 14.9;

    const centerHz = 1000.0;
    const Q = 1.0;
    const A = this.humanFilterDbToAmp(gainDb);
    const w = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * centerHz / safeRate));
    const r = 1 / (Q * A);
    const g = Math.tan(0.5 * w);
    const c = g + r;
    const sCoef = 1 / (1 + g * c);
    const aB = A * A * r;

    const safeInput = this.safeFilterNumber(input, state);
    const clampedInput = this.clampValue(safeInput, -2, 2);
    const svfIn = state.osc2Value + state.osc1ModSelf + clampedInput + state.lastOutValue;
    const yH = (svfIn - c * state.fbZ1 - state.fbZ2) * sCoef;
    const yB = state.fbZ1 + g * yH;
    const yL = state.fbZ2 + g * yB;
    state.fbZ1 = 2 * yB - state.fbZ1;
    state.fbZ2 = 2 * yL - state.fbZ2;
    const inputSignal = yH + aB * yB + yL;

    const fm1 = -2.2784975504539248 * inputSignal;
    state.phase1 += (frequencyHz * fm1) / safeRate;
    state.phase1 -= Math.floor(state.phase1);
    state.osc1Value = Math.sin(state.phase1 * 2 * Math.PI) * 0.177898;

    state.osc1ModSelf = state.osc1Value * mod11;
    state.osc2ModSelf = state.osc2Value * -0.395833;

    const fm2 = 0.0333333 + 2.7429968062 * state.osc1Value + state.osc2ModSelf;
    state.phase2 += (frequencyHz * fm2) / safeRate;
    state.phase2 -= Math.floor(state.phase2);
    state.osc2Value = Math.sin(state.phase2 * 2 * Math.PI) * 0.71597;

    state.lastOutValue = (state.osc1Value + state.osc2Value) * 0.1443178;

    const dcA = this.analogLadderCoefficient(5.0, safeRate);
    let out;
    if (mode === 0) out = this.analogLadderTapStep(state.dcY, state.osc1Value, dcA, 2, 1) * 2.0;
    else if (mode === 1) out = this.analogLadderTapStep(state.dcY, state.osc1Value + state.osc2Value, dcA, 2, 1);
    else out = this.analogLadderTapStep(state.dcY, state.osc2Value, dcA, 2, 1);

    return this.safeFilterNumber(out, state);
  }

  humanFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeHumanFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeHumanFilter.soemdsp_human_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeHumanFilter.soemdsp_human_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              this.clampValue(this.safeFilterNumber(params.frequency, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 1),
              this.clampValue(this.safeFilterNumber(params.chaos, state), 0, 1),
              Math.max(0, Math.min(2, Math.round(Number(params.mode) || 0))),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeHumanFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "human_filter",
          status: "disabled",
          message: String(error?.message || error || "native Human Filter failed"),
        });
      }
    }
    return this.humanFilterSampleJs(state, input, params, rate);
  }

  createSlewLimiterState() {
    return {
      initialized: false,
      out: 0,
      nativeHandle: 0,
    };
  }

  createClockState() {
    return {
      hasStarted: false,
      phase: 0,
    };
  }

  createRandomClockState() {
    return {
      intervalSamples: 0,
      lastReset: 0,
      phaseSamples: 0,
      randomState: 0,
      remainingTriggerSamples: 0,
      seedKey: "",
    };
  }

  createDelayedTriggerState() {
    return {
      hasTriggered: true,
      lastReset: 0,
      lastTrigger: 0,
      remainingSamples: 0,
      running: false,
      waitSamples: 0,
    };
  }

  createPatchCommandState() {
    return {
      lastTrigger: 0,
    };
  }

  createDelayEffectState() {
    return {
      buffer: new Float32Array(1),
      bufferSize: 1,
      lfoPhase: 0,
      lfoVariationState: 0,
      position: 0,
      wet: 0,
      nativeHandle: 0,
      nativeSeed: 0,
      nativeSeedNodeId: "",
    };
  }

  createSampleHoldState() {
    return {
      clockPhase: 0,
      held: 0,
      lastTrigger: 0,
      noise: this.createNoiseGeneratorChannelState(),
      nativeHandle: 0,
    };
  }

  createSamplePlaybackState() {
    return {
      lastReset: 0,
      phase: 0,
      playing: false,
      rangeKey: "",
      sampleId: "",
    };
  }

  createStepSequencerState() {
    return {
      gate: 0,
      index: 0,
      lastReset: 0,
      lastTrigger: 0,
      out: 0,
    };
  }

  createTriggerCounterState() {
    return {
      count: 0,
      lastReset: 0,
      lastTrigger: 0,
      remainingSamples: 0,
    };
  }

  createTriggerDividerState() {
    return {
      count: 0,
      lastReset: 0,
      lastTrigger: 0,
      remainingSamples: 0,
    };
  }

  createExpAdsrState() {
    return {
      lastGate: 0,
      out: 0,
      secondsPassed: 0,
      state: "off",
      nativeHandle: 0,
    };
  }

  createLinearEnvelopeState() {
    return {
      lastGate: 0,
      out: 0,
      releaseDecrement: 0,
      secondsPassed: 0,
      state: "off",
      nativeHandle: 0,
    };
  }

  createPluckEnvelopeState() {
    return {
      autoReleasePhasor: 0,
      currentValue: 0,
      decayIncrement: 0,
      lastRelease: 0,
      lastTrigger: 0,
      phasor: 0,
      releaseIncrement: 0,
      secondsPassed: 0,
      state: "off",
      nativeHandle: 0,
    };
  }

  createVactrolEnvelopeState() {
    return {
      nativeHandle: 0,
      out: 0,
      raw: 0,
    };
  }

  createPolyBlepState() {
    return {
      nativeHandle: 0,
    };
  }

  createFlowerChildEnvelopeFollowerState() {
    return {
      currentSlewedValue: 0,
      holdCounter: 0,
      out: 0,
      nativeHandle: 0,
    };
  }

  createNoiseGeneratorChannelState() {
    return { brown: 0, gaussianSpare: null, pink: [0, 0, 0, 0, 0, 0, 0], seed: 0, seedKey: "" };
  }

  createNoiseGeneratorState() {
    return {
      left: this.createNoiseGeneratorChannelState(), nativeHandle: 0, right: this.createNoiseGeneratorChannelState(),
      blockCache: { cursor: 0, size: 0, left: null, right: null },
    };
  }

  destroyNoiseGeneratorNativeState(state) {
    if (state.nativeHandle && this.nativeNoiseGenerator?.soemdsp_noise_generator_destroy) {
      this.nativeNoiseGenerator.soemdsp_noise_generator_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  destroyFbmNativeState(state) {
    if (state.nativeHandle && this.nativeFbm?.soemdsp_fbm_destroy) {
      this.nativeFbm.soemdsp_fbm_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  destroyLadderFilterNativeState(state) {
    if (state.nativeHandle && this.nativeLadderFilter?.soemdsp_ladder_filter_destroy) {
      this.nativeLadderFilter.soemdsp_ladder_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  destroyTb303FilterNativeState(state) {
    if (state.nativeHandle && this.nativeTb303Filter?.soemdsp_tb303_filter_destroy) {
      this.nativeTb303Filter.soemdsp_tb303_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  createTb303FilterState() {
    return { nativeHandle: 0 };
  }

  destroyPassiveFilterNativeState(state) {
    if (state?.nativeHandle && this.nativePassiveFilter?.soemdsp_passive_filter_destroy) {
      this.nativePassiveFilter.soemdsp_passive_filter_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  createPassiveFilterState() {
    return { nativeHandle: 0 };
  }

  passiveFilterSample(state, input, mode, lowFrequency, highFrequency, rate) {
    if (!this.nativePassiveFilterReady) {
      throw new Error("native Passive Filter not ready");
    }
    if (!state.nativeHandle) {
      state.nativeHandle = this.nativePassiveFilter.soemdsp_passive_filter_create();
    }
    if (!state.nativeHandle) {
      throw new Error("native Passive Filter failed to create instance");
    }
    return this.safeFilterNumber(
      this.nativePassiveFilter.soemdsp_passive_filter_sample(
        state.nativeHandle,
        this.safeFilterNumber(input, state),
        Math.round(Number(mode)) || 0,
        Number(lowFrequency) || 0,
        Number(highFrequency) || 0,
        Math.max(1, Number(rate) || sampleRate || 44100),
      ),
      state,
    );
  }

  createRandomWalkState() {
    return {
      lowpass: this.createLowpassState(),
      out: 0,
      seed: 0,
      seedKey: "",
      nativeHandle: 0,
    };
  }

  createFractalBrownianNoiseState() {
    return {
      axes: {},
      nativeHandle: 0,
      resetWasHigh: false,
      // Block-processing cache: resolves params once per
      // FBM_NATIVE_BLOCK_SIZE calls via soemdsp_fbm_process_block instead of
      // once per sample via soemdsp_fbm_sample. cursor >= size means the
      // cache is empty/exhausted and the next read triggers a refill.
      blockCache: { cursor: 0, size: 0, x: null, y: null, z: null, xRaw: null, yRaw: null, zRaw: null },
    };
  }

  resetFractalBrownianNoiseState(state) {
    for (const axisState of Object.values(state.axes || {})) {
      axisState.time = 0;
    }
    if (state.blockCache) {
      state.blockCache.cursor = 0;
      state.blockCache.size = 0;
    }
    if (state.nativeHandle && this.nativeFbm?.soemdsp_fbm_reset) {
      this.nativeFbm.soemdsp_fbm_reset(state.nativeHandle);
    }
  }

  // --- Registry-driven native module lifecycle (proof-of-concept batch) ---
  // See nativeStatefulModuleRegistry above and
  // docs/NATIVE_CPP_WASM_MODULE_GUIDE.md.

  initNativeStatefulModuleMaps(target, { includeNativeFlags = false } = {}) {
    for (const entry of nativeStatefulModuleRegistry) {
      target[entry.stateMapKey] = new Map();
      if (includeNativeFlags) {
        target[entry.nativeFlagKey] = null;
        target[entry.nativeReadyKey] = false;
      }
    }
  }

  destroyAllNativeStatefulModuleHandles(target) {
    for (const entry of nativeStatefulModuleRegistry) {
      if (!entry.destroyNativeState) continue;
      const states = target[entry.stateMapKey];
      if (!states) continue;
      for (const state of states.values()) {
        target[entry.destroyNativeState](state);
      }
    }
  }

  pruneRemovedNativeStatefulModuleStates(target, ids) {
    for (const entry of nativeStatefulModuleRegistry) {
      const states = target[entry.stateMapKey];
      if (!states) continue;
      for (const id of [...states.keys()]) {
        if (!ids.has(id)) {
          if (entry.destroyNativeState) {
            target[entry.destroyNativeState](states.get(id));
          }
          states.delete(id);
        }
      }
    }
  }

  instantiateNativeStatefulModuleStateIfNeeded(target, node, id) {
    const entry = nativeStatefulModuleRegistry.find((candidate) => {
      return Array.isArray(candidate.type) ? candidate.type.includes(node?.type) : candidate.type === node?.type;
    });
    if (!entry) return false;
    const states = target[entry.stateMapKey];
    if (!states || states.has(id)) return Boolean(entry);
    states.set(id, target[entry.createState]());
    return true;
  }

  handleNativeStatefulModuleLoad(name, targetType, exports) {
    const entry = nativeStatefulModuleRegistry.find((candidate) => {
      const typeMatches = Array.isArray(candidate.type) ? candidate.type.includes(targetType) : candidate.type === targetType;
      return candidate.nativeName === name || typeMatches;
    });
    if (!entry) return false;
    const states = this[entry.stateMapKey];
    if (states && entry.destroyNativeState) {
      for (const state of states.values()) {
        this[entry.destroyNativeState](state);
      }
    }
    this[entry.nativeFlagKey] = exports;
    this[entry.nativeReadyKey] = entry.requiredExports.every(
      (exportName) => Boolean(exports?.[exportName]),
    );
    this.port.postMessage({
      type: "nativeModuleStatus",
      name: entry.nativeName,
      status: this[entry.nativeReadyKey] ? "ready" : "missing exports",
    });
    return true;
  }

  safeFilterNumber(value, state) {
    const number = Number(value);
    const reason = this.badValueReason(number);
    if (!reason) {
      return number;
    }
    if (state) {
      state.inputBuffer = 0;
      state.outputBuffer = 0;
    }
    this.badNumberCount += 1;
    if (!this.lastBadValueNodeId) {
      this.lastBadValueReason = reason;
      this.lastBadValueSource = "";
    }
    return 0;
  }

  validCodeblockIdentifier(name) {
    const value = String(name || "").trim();
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) &&
      !new Set([
        "__context",
        "__ctx",
        "__inputs",
        "__outputs",
        "__state",
        "arguments",
        "await",
        "break",
        "case",
        "catch",
        "class",
        "const",
        "continue",
        "debugger",
        "default",
        "delete",
        "do",
        "document",
        "else",
        "eval",
        "export",
        "extends",
        "false",
        "fetch",
        "finally",
        "frame",
        "frames",
        "for",
        "Function",
        "globalThis",
        "if",
        "import",
        "in",
        "instanceof",
        "let",
        "new",
        "null",
        "return",
        "sampleRate",
        "self",
        "super",
        "switch",
        "state",
        "this",
        "throw",
        "time",
        "true",
        "try",
        "typeof",
        "var",
        "void",
        "while",
        "window",
        "with",
        "yield",
        "dt",
      ]).has(value);
  }

  normalizeCodeblockPortList(value, fallbackPrefix = "In") {
    const raw = Array.isArray(value)
      ? value
      : String(value ?? "").split(/[\s,]+/);
    const ports = [];
    const seen = new Set();
    for (const item of raw) {
      const name = String(item || "").trim();
      if (!this.validCodeblockIdentifier(name) || seen.has(name)) {
        continue;
      }
      seen.add(name);
      ports.push(name.slice(0, 32));
    }
    if (!ports.length) {
      ports.push(`${fallbackPrefix}1`);
    }
    return ports;
  }

  normalizeCodeblock(value = {}) {
    const source = value && typeof value === "object" ? value : {};
    const inputs = this.normalizeCodeblockPortList(source.inputs, "In");
    const reserved = new Set(inputs);
    const outputs = this.normalizeCodeblockPortList(source.outputs, "Out")
      .filter((port) => !reserved.has(port));
    if (!outputs.length) {
      let index = 1;
      let name = "Out1";
      while (reserved.has(name)) {
        index += 1;
        name = `Out${index}`;
      }
      outputs.push(name);
    }
    return {
      code: String(source.code ?? "Out1 = In1;"),
      inputs,
      outputs,
    };
  }

  codeblockFunctionBody(codeblock) {
    const shadows = ["window", "document", "fetch", "Function", "globalThis", "self"]
      .map((name) => `const ${name} = undefined;`)
      .join("\n");
    const context = [
      "const state = __state;",
      "const __ctx = __context || {};",
      "const sampleRate = Number(__ctx.sampleRate) || 44100;",
      "const frame = Number(__ctx.frame) || 0;",
      "const frames = Number(__ctx.frames) || 1;",
      "const time = Number(__ctx.time) || 0;",
      "const dt = 1 / sampleRate;",
    ].join("\n");
    const inputs = codeblock.inputs
      .map((port, index) => `const ${port} = __inputs[${index}] || 0;`)
      .join("\n");
    const outputs = codeblock.outputs.map((port) => `let ${port} = 0;`).join("\n");
    const writes = codeblock.outputs
      .map((port) => `__outputs[${JSON.stringify(port)}] = ${port};`)
      .join("\n");
    return `"use strict";\n${shadows}\n${context}\n${inputs}\n${outputs}\n${codeblock.code}\n${writes}\nreturn __outputs;`;
  }

  codeblockCacheKey(codeblock) {
    return `${codeblock.inputs.join(",")}=>${codeblock.outputs.join(",")}::${codeblock.code}`;
  }

  markCodeblockError(nodeId, reason, source) {
    this.badNumberCount += 1;
    this.lastBadValueReason = reason;
    this.lastBadValueNodeId = nodeId || "";
    this.lastBadValueSource = source || "codeblock";
  }

  safeCodeblockNumber(value, nodeId, port) {
    const number = Number(value);
    const reason = this.badValueReason(number);
    if (!reason) {
      return number;
    }
    this.markCodeblockError(nodeId, reason, `codeblock ${port} output`);
    return 0;
  }

  createCodeblockOutputObject(codeblock) {
    const output = {};
    for (const port of codeblock.outputs) {
      output[port] = 0;
    }
    return output;
  }

  compileCodeblockFunction(node) {
    const codeblock = this.normalizeCodeblock(node.codeblock);
    const key = this.codeblockCacheKey(codeblock);
    const cached = this.codeblockFunctions.get(node.id);
    if (cached?.key === key) {
      return cached;
    }
    const fn = Function(
      "__inputs",
      "__outputs",
      "__state",
      "__context",
      this.codeblockFunctionBody(codeblock),
    );
    const compiled = {
      codeblock,
      fn,
      inputs: new Array(codeblock.inputs.length).fill(0),
      key,
      output: this.createCodeblockOutputObject(codeblock),
      state: Object.create(null),
    };
    this.codeblockFunctions.set(node.id, compiled);
    return compiled;
  }

  evaluateCodeblock(node, mixInput, frame = 0, frames = 1, sampleRate = this.engineSampleRate || 44100, inputFrame = frame) {
    let compiled = null;
    try {
      compiled = this.compileCodeblockFunction(node);
    } catch (error) {
      this.markCodeblockError(node.id, "compile error", `codeblock ${error?.message || ""}`);
      return {};
    }
    const { codeblock, fn, inputs, output, state } = compiled;
    try {
      for (let index = 0; index < codeblock.inputs.length; index += 1) {
        inputs[index] = this.safeFilterNumber(mixInput(node.id, codeblock.inputs[index]), null);
      }
      for (const port of codeblock.outputs) {
        output[port] = 0;
      }
      fn(inputs, output, state, {
        frame,
        frames,
        sampleRate,
        time: (Number(inputFrame) || 0) / (Number(sampleRate) || 44100),
      });
      for (const port of codeblock.outputs) {
        output[port] = this.safeCodeblockNumber(output[port], node.id, port);
      }
      return output;
    } catch (error) {
      this.markCodeblockError(node.id, "runtime error", `codeblock ${error?.message || ""}`);
      for (const port of codeblock.outputs) {
        output[port] = 0;
      }
      return output;
    }
  }

  createNestedRuntime(plan) {
    const runtime = Object.create(NodeLiveAudioProcessor.prototype);
    runtime.inputConnections = new Map();
    runtime.triggerPatchBindings = new Map();
    runtime.triggerPatchGates = new Map();
    runtime.autoSmoothingSeconds = this.autoSmoothingSeconds;
    runtime.badNumberCount = 0;
    runtime.lastBadValueReason = "";
    runtime.lastBadValueNodeId = "";
    runtime.lastBadValueSource = "";
    runtime.inputMeterPeak = 0;
    runtime.inputMeterSamples = 0;
    runtime.inputMeterSquareSum = 0;
    runtime.meterClipCount = 0;
    runtime.meterCounter = 0;
    runtime.meterPeak = 0;
    runtime.meterProtectionMuteCount = 0;
    runtime.meterSamples = 0;
    runtime.meterSquareSum = 0;
    runtime.macroControls = this.macroControls;
    runtime.pitchModWheelSignal = this.pitchModWheelSignal;
    runtime.externalButtonEvents = this.externalButtonEvents;
    runtime.wireBreakEvent = this.wireBreakEvent;
    runtime.wireConnectEvent = this.wireConnectEvent;
    runtime.wireDisconnectEvent = this.wireDisconnectEvent;
    runtime.windowReopenEvent = this.windowReopenEvent;
    runtime.shootingStarExplosionEvent = this.shootingStarExplosionEvent;
    runtime.midiKeyboardGatePulseSamples = 0;
    runtime.midiKeyboardSignal = null;
    runtime.moduleGroupRuntimes = new Map();
    runtime.modulationConnections = new Map();
    runtime.nodeOutputs = new Map();
    runtime.nodes = new Map();
    runtime.nativeEllipsoid = this.nativeEllipsoid;
    runtime.nativeEllipsoidReady = this.nativeEllipsoidReady;
    runtime.nativeSabrinaReverb = this.nativeSabrinaReverb;
    runtime.nativeSabrinaReverbReady = this.nativeSabrinaReverbReady;
    runtime.nativePll = this.nativePll;
    runtime.nativePllReady = this.nativePllReady;
    runtime.nativeHelmholtz = this.nativeHelmholtz;
    runtime.nativeHelmholtzReady = this.nativeHelmholtzReady;
    runtime.noiseSeedKeys = new Map();
    runtime.noiseSeeds = new Map();
    runtime.order = [];
    runtime.engineSampleRate = this.engineSampleRate;
    runtime.hostSampleRate = this.hostSampleRate;
    runtime.oversamplingRatio = this.oversamplingRatio;
    runtime.clockDividerStates = new Map();
    runtime.clockStates = new Map();
    runtime.codeblockFunctions = new Map();
    runtime.delayedTriggerStates = new Map();
    runtime.graphInputConnections = new Map();
    this.initNativeStatefulModuleMaps(runtime);
    runtime.oscResetStates = new Map();
    runtime.graphLfoStates = new Map();
    runtime.outputNode = plan?.outputNode || "output";
    runtime.patchFingerprint = plan?.patchFingerprint || "";
    runtime.patchCommandStates = new Map();
    runtime.phases = new Map();
    runtime.planSerial = 0;
    runtime.randomClockStates = new Map();
    runtime.samplePlaybackStates = new Map();
    runtime.samples = this.samples;
    runtime.sessionId = this.sessionId;
    runtime.scopeBuffers = new Map();
    runtime.scopeCounter = 0;
    runtime.smoothers = new Map();
    runtime.spiralStates = new Map();
    runtime.stepSequencerStates = new Map();
    runtime.triggerCounterStates = new Map();
    runtime.triggerDividerStates = new Map();
    runtime.triangleStates = new Map();
    runtime.resetVisualControls();
    runtime.setNestedPlan(plan);
    return runtime;
  }

  setNestedPlan(plan) {
    const nodes = Array.isArray(plan?.nodes) ? plan.nodes : [];
    const ids = new Set(nodes.map((node) => node.id));
    this.nodes = new Map(nodes.map((node) => [node.id, {
      id: node.id,
      codeblock: this.normalizeCodeblock(node.codeblock),
      moduleGroup: node.moduleGroup || null,
      moduleGroupPlan: node.moduleGroupPlan || null,
      paramMeta: node.paramMeta || {},
      params: node.params || {},
      sample: node.sample || null,
      type: node.type,
    }]));
    this.order = Array.isArray(plan?.order) ? [...plan.order] : [...ids];
    this.outputNode = plan?.outputNode || "output";
    this.inputConnections = this.buildInputConnectionMap(plan?.connections, ids);
    this.graphInputConnections = this.buildGraphInputConnectionMap(plan?.graphConnections, ids);
    this.modulationConnections = this.buildModulationConnectionMap(plan?.modulations, ids);
    for (const id of ids) {
      const node = this.nodes.get(id);
      this.nodeOutputs.set(id, 0);
      if (nodeLiveIsPolyBlepOscillatorType(node?.type)) {
        this.phases.set(id, 0);
        this.oscResetStates.set(id, this.createOscResetState());
        this.triangleStates.set(id, 0);
      }
      if (nodeLiveIsPolyBlepOscillatorType(node?.type)) {
        this.noiseSeeds.set(id, this.stableSeed(id));
      }
      if (node?.type === "spiral") this.spiralStates.set(id, this.createSpiralState());
      if (node?.type === "fractalSpiral") this.fractalSpiralStates.set(id, this.createFractalSpiralState());
      if (node?.type === "logSpiral") this.logSpiralStates.set(id, this.createLogSpiralState());
      this.instantiateNativeStatefulModuleStateIfNeeded(this, node, id);
      this.instantiateNativeStatefulModuleStateIfNeeded(this, node, id);
      if (node?.type === "clock") this.clockStates.set(id, this.createClockState());
      if (node?.type === "graph" || node?.type === "graph2") this.graphLfoStates.set(id, this.createGraphLfoState());
      if (node?.type === "clockDivider") this.clockDividerStates.set(id, this.createTriggerDividerState());
      if (node?.type === "delayedTrigger") this.delayedTriggerStates.set(id, this.createDelayedTriggerState());
      if (node?.type === "randomClock") this.randomClockStates.set(id, this.createRandomClockState());
      if (node?.type === "samplePlayer" || node?.type === "sampleLooper" || node?.type === "audioPlayer") {
        this.samplePlaybackStates.set(id, this.createSamplePlaybackState());
      }
      if (node?.type === "nextPatch" || node?.type === "previousPatch") this.patchCommandStates.set(id, this.createPatchCommandState());
      if (node?.type === "stepSequencer") this.stepSequencerStates.set(id, this.createStepSequencerState());
      if (node?.type === "triggerCounter") this.triggerCounterStates.set(id, this.createTriggerCounterState());
      if (node?.type === "triggerDivider") this.triggerDividerStates.set(id, this.createTriggerDividerState());
      if (node?.type === "moduleGroup" && node.moduleGroupPlan) {
        this.moduleGroupRuntimes.set(id, this.createNestedRuntime(node.moduleGroupPlan));
      }
      for (const [key, value] of Object.entries(node?.params || {})) {
        this.smoothers.set(this.parameterKey(id, key), this.createSmoother(value, node.paramMeta?.[key]));
      }
    }
  }

  evaluateModuleGroup(node, mixInput, frame, frames, rate, inputFrame) {
    if (!node.moduleGroupPlan) {
      return {};
    }
    let runtime = this.moduleGroupRuntimes.get(node.id);
    if (!runtime) {
      runtime = this.createNestedRuntime(node.moduleGroupPlan);
      this.moduleGroupRuntimes.set(node.id, runtime);
    }
    runtime.engineSampleRate = rate;
    runtime.hostSampleRate = this.hostSampleRate;
    runtime.oversamplingRatio = this.oversamplingRatio;
    runtime.macroControls = this.macroControls;
    runtime.pitchModWheelSignal = this.pitchModWheelSignal;
    runtime.externalButtonEvents = this.externalButtonEvents;
    runtime.wireBreakEvent = this.wireBreakEvent;
    runtime.wireConnectEvent = this.wireConnectEvent;
    runtime.wireDisconnectEvent = this.wireDisconnectEvent;
    runtime.windowReopenEvent = this.windowReopenEvent;
    runtime.shootingStarExplosionEvent = this.shootingStarExplosionEvent;
    runtime.externalGroupInputs = new Map(
      (node.moduleGroup?.inputs || []).map((input) => [input.nodeId, mixInput(node.id, input.name)]),
    );
    const frameOutput = runtime.evaluateFrame(frame, frames, [], rate, inputFrame);
    const output = {};
    for (const endpoint of node.moduleGroup?.outputs || []) {
      output[endpoint.name] = runtime.readRuntimePortOutput(
        frameOutput.frameValues,
        endpoint.nodeId,
        endpoint.port || "Out",
      );
    }
    return output;
  }

  visualControlIntensity(value, nodeId, source = "visual control") {
    const number = Number(value);
    const reason = this.badValueReason(number);
    if (reason) {
      this.badNumberCount += 1;
      if (!this.lastBadValueNodeId) {
        this.lastBadValueReason = reason;
        this.lastBadValueNodeId = nodeId || "";
        this.lastBadValueSource = source;
      }
      return 0;
    }
    return this.clampValue(Math.abs(number), 0, 1);
  }

  visualControlSigned(value, nodeId, source = "visual control") {
    const number = Number(value);
    const reason = this.badValueReason(number);
    if (reason) {
      this.badNumberCount += 1;
      if (!this.lastBadValueNodeId) {
        this.lastBadValueReason = reason;
        this.lastBadValueNodeId = nodeId || "";
        this.lastBadValueSource = source;
      }
      return 0;
    }
    return this.clampValue(number, -1, 1);
  }

  visualHslToRgb(hue, saturation, lightness) {
    const h = ((Number(hue) || 0) % 1 + 1) % 1;
    const s = this.clampValue(Number(saturation) || 0, 0, 1);
    const l = this.clampValue(Number(lightness) || 0, 0, 1);
    if (s <= 0) {
      return [l, l, l];
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const channel = (offset) => {
      let t = h + offset;
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
    return [channel(1 / 3), channel(0), channel(-1 / 3)];
  }

  smoothVisualControl(key, target, rate = sampleRate, seconds = 0.045, min = 0, max = 1) {
    const safeTarget = this.clampValue(Number(target) || 0, min, max);
    const previous = Number(this.visualControlStates.get(key));
    const current = Number.isFinite(previous) ? previous : 0;
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const time = Math.max(0, Number(seconds) || 0);
    const coefficient = time <= 0 ? 1 : 1 - Math.exp(-1 / Math.max(1, time * safeRate));
    const next = current + (safeTarget - current) * coefficient;
    const cleaned = Math.abs(next) < 0.000001 ? 0 : this.clampValue(next, min, max);
    this.visualControlStates.set(key, cleaned);
    this.visualControls[key] = cleaned;
    return cleaned;
  }

  screenSpaceShaderSample(node, readInput, rate = sampleRate, nodeId = "") {
    const script = node?.screenSpaceShader || {};
    const value = {};
    for (const input of script.visualInputs || []) {
      if (input.mode === "raw") {
        continue;
      }
      const signed = input.mode === "signed";
      const raw = readInput(input.port);
      const target = signed
        ? this.visualControlSigned(raw, nodeId, `screen space shader ${input.port}`)
        : this.visualControlIntensity(raw, nodeId, `screen space shader ${input.port}`);
      value[input.key] = this.smoothVisualControl(
        input.key,
        target,
        rate,
        signed ? 0.045 : 0.025,
        signed ? -1 : 0,
        1,
      );
    }
    return value;
  }

  postVisualControls() {
    this.port.postMessage({
      patchFingerprint: this.patchFingerprint,
      blue: this.clampValue(this.visualControls.blue, 0, 1),
      chromaAlpha: this.clampValue(this.visualControls.chromaAlpha, 0, 1),
      chromaDrift: this.clampValue(this.visualControls.chromaDrift, 0, 1),
      chromaHue: this.clampValue(this.visualControls.chromaHue, 0, 1),
      chromaLightness: this.clampValue(this.visualControls.chromaLightness, 0, 1),
      chromaSaturation: this.clampValue(this.visualControls.chromaSaturation, 0, 1),
      chromaSpread: this.clampValue(this.visualControls.chromaSpread, 0, 1),
      green: this.clampValue(this.visualControls.green, 0, 1),
      red: this.clampValue(this.visualControls.red, 0, 1),
      scopePaused: this.clampValue(this.visualControls.scopePaused, 0, 1),
      scopeTracesOff: this.clampValue(this.visualControls.scopeTracesOff, 0, 1),
      screenDim: this.clampValue(this.visualControls.screenDim, 0, 1),
      screenShake: this.clampValue(this.visualControls.screenShake, 0, 1),
      sessionId: this.sessionId,
      type: "visualControls",
      visualBloom: this.clampValue(this.visualControls.visualBloom, 0, 1),
      visualBrightness: this.clampValue(this.visualControls.visualBrightness, 0, 1),
      visualGlow: this.clampValue(this.visualControls.visualGlow, 0, 1),
      x: this.clampValue(this.visualControls.x, -1, 1),
      y: this.clampValue(this.visualControls.y, -1, 1),
    });
  }

  sampleChannelAt(sample, channelIndex, frameIndex) {
    const channel = sample?.channelData?.[channelIndex] || sample?.samples;
    if (!channel?.length) {
      return 0;
    }
    const maxIndex = channel.length - 1;
    const index = this.clampValue(Number(frameIndex) || 0, 0, maxIndex);
    const low = Math.floor(index);
    const high = Math.min(maxIndex, low + 1);
    const frac = index - low;
    return (Number(channel[low]) || 0) + ((Number(channel[high]) || 0) - (Number(channel[low]) || 0)) * frac;
  }

  sampleStereoAt(sample, frameIndex) {
    const left = this.sampleChannelAt(sample, 0, frameIndex);
    const right = sample?.channelData?.length > 1
      ? this.sampleChannelAt(sample, 1, frameIndex)
      : left;
    return {
      Left: left,
      Mono: (left + right) * 0.5,
      Out: (left + right) * 0.5,
      Right: right,
    };
  }

  audioPlayerSample(node, nodeId, readInput, readParam, rate = sampleRate) {
    const state = this.samplePlaybackStates.get(nodeId) || this.createSamplePlaybackState();
    this.samplePlaybackStates.set(nodeId, state);
    const sampleId = String(node?.sample?.id || "");
    const sample = this.samples.get(sampleId);
    const frames = Math.max(0, Number(sample?.frames) || sample?.samples?.length || sample?.channelData?.[0]?.length || 0);
    this.audioPlayerMeterNodeId = nodeId;
    if (!sample || frames <= 1) {
      this.audioPlayerMeterReason = sampleId ? "engine waiting for sample" : "engine no sample id";
      return { Left: 0, Mono: 0, Out: 0, Phase: 0, Right: 0, Trigger: 0 };
    }
    const start = this.clampValue(readParam("start", 0), 0, 1);
    const end = this.clampValue(readParam("end", 1), 0, 1);
    const collapsedRange = Math.abs(end - start) <= 0.000001;
    const startPhase = collapsedRange ? 0 : Math.min(start, end);
    const endPhase = collapsedRange ? 1 : Math.max(start, end);
    const span = Math.max(0.000001, endPhase - startPhase);
    const rangeKey = `${startPhase}:${endPhase}`;
    if (state.sampleId !== sampleId) {
      state.phase = startPhase;
      state.completed = false;
      state.sampleId = sampleId;
    } else if (state.rangeKey !== rangeKey) {
      const currentPhase = Number(state.phase);
      if (!Number.isFinite(currentPhase) || currentPhase < startPhase || currentPhase > endPhase) {
        state.phase = startPhase;
      }
      state.completed = false;
    }
    if (state.rangeKey !== rangeKey) {
      state.rangeKey = rangeKey;
    }
    const transportFallback = Object.hasOwn(node?.params || {}, "transport")
      ? 4
      : ((Number(node?.params?.loop) || 0) >= 0.5 ? 4 : 0);
    const transportMode = Math.max(0, Math.min(4, Math.round(readParam("transport", transportFallback))));
    const transportReset = transportMode <= 0;
    const transportStopped = transportMode === 1;
    const transportPaused = transportMode === 2;
    const transportLooping = transportMode === 3;
    const transportPlayOnce = transportMode >= 4;
    if (state.transportMode !== transportMode) {
      state.completed = false;
      state.transportMode = transportMode;
    }
    const reset = readInput("Reset");
    const resetEdge = state.lastReset <= 0 && reset > 0;
    if (resetEdge || transportReset || transportStopped) {
      state.phase = startPhase;
      state.completed = false;
    }
    state.playing = (transportPlayOnce || transportLooping) && !state.completed;
    state.lastReset = reset;

    const phaseConnected = this.inputConnections?.has?.(this.inputKey(nodeId, "Phase"));
    const speed = readParam("speed", 1) + readInput("Speed");
    const sampleRateRatio = (Number(sample.sampleRate) || rate || 44100) / Math.max(1, rate || 44100);
    const increment = (speed * sampleRateRatio) / frames;
    const phase = phaseConnected
      ? this.clampValue(readInput("Phase"), 0, 1)
      : this.clampValue(state.phase, 0, 1);
    const boundedPhase = phase < startPhase || phase > endPhase
      ? startPhase
      : phase;
    const stereo = this.sampleStereoAt(sample, boundedPhase * (frames - 1));
    const level = readParam("level", 1);
    const outputActive = state.playing;
    const left = outputActive ? stereo.Left * level : 0;
    const mono = outputActive ? stereo.Mono * level : 0;
    const right = outputActive ? stereo.Right * level : 0;
    this.audioPlayerMeterPhase = boundedPhase;
    this.audioPlayerMeterPeak = Math.max(
      this.audioPlayerMeterPeak,
      Math.abs(left),
      Math.abs(mono),
      Math.abs(right),
    );
    this.audioPlayerMeterReason = state.playing
      ? (transportLooping ? "engine looping" : "engine playing")
      : transportPaused
        ? "engine paused"
        : transportStopped
          ? "engine stopped"
          : state.completed
            ? "engine complete"
            : "engine off reset";
    this.audioPlayerMeterSamples += 1;
    let done = 0;
    if (!phaseConnected && state.playing) {
      const nextPhase = boundedPhase + increment;
      if (transportLooping) {
        const normalizedNext = (nextPhase - startPhase) / span;
        done = normalizedNext < 0 || normalizedNext >= 1 ? 1 : 0;
        state.phase = startPhase + this.wrapValue((nextPhase - startPhase) / span, 0, 1) * span;
      } else if (speed >= 0 && nextPhase >= endPhase) {
        state.phase = endPhase;
        state.completed = true;
        state.playing = false;
        done = 1;
      } else if (speed < 0 && nextPhase <= startPhase) {
        state.phase = startPhase;
        state.completed = true;
        state.playing = false;
        done = 1;
      } else {
        state.phase = this.clampValue(nextPhase, startPhase, endPhase);
      }
    } else if (!phaseConnected && (transportReset || transportStopped)) {
      state.phase = startPhase;
    } else {
      state.phase = boundedPhase;
    }
    return {
      Left: left,
      Mono: mono,
      Out: mono,
      Phase: boundedPhase,
      Right: right,
      Trigger: done,
    };
  }

  monitorBadValueSample(value, nodeId) {
    const number = Number(value);
    const reason = this.badValueReason(number);
    if (reason) {
      this.badNumberCount += 1;
      this.lastBadValueReason = reason;
      this.lastBadValueNodeId = nodeId;
      this.lastBadValueSource = "BADVAL Monitor input";
    }
    return number;
  }

  nativeSoftClipperSample(input, center = 0, width = 2) {
    const dry = Number(input) || 0;
    if (!this.nativeSoftClipperReady || !this.nativeSoftClipper?.soemdsp_soft_clipper_sample) {
      return dry;
    }
    try {
      return this.safeFilterNumber(
        this.nativeSoftClipper.soemdsp_soft_clipper_sample(
          dry,
          Number(center) || 0,
          Number(width) || 2,
        ),
        null,
      );
    } catch (error) {
      this.nativeSoftClipperReady = false;
      this.port.postMessage({
        type: "nativeModuleStatus",
        name: "soft_clipper",
        status: "disabled",
        message: String(error?.message || error || "native Soft Clipper failed"),
      });
      return dry;
    }
  }

  onePoleHighpassSample(state, input, frequency, rate = sampleRate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const safeInput = this.safeFilterNumber(input, state);
    const frequencyValue = Math.max(0, this.safeFilterNumber(frequency, state));
    const w = Math.min((Math.PI * 2) / safeRate, 0.000142475857) * frequencyValue;
    const a1 = Math.exp(-w);
    const b0 = 0.5 * (1 + a1);
    const b1 = -b0;
    state.outputBuffer = this.safeFilterNumber(
      b0 * safeInput + b1 * state.inputBuffer + a1 * state.outputBuffer,
      state,
    );
    state.inputBuffer = safeInput;
    return state.outputBuffer;
  }

  onePoleLowpassSample(state, input, frequency, rate = sampleRate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const safeInput = this.safeFilterNumber(input, state);
    const frequencyValue = Math.max(0, this.safeFilterNumber(frequency, state));
    const w = Math.min((Math.PI * 2) / safeRate, 0.000142475857) * frequencyValue;
    const a1 = Math.exp(-w);
    const b0 = 1 - a1;
    state.outputBuffer = this.safeFilterNumber(b0 * safeInput + a1 * state.outputBuffer, state);
    return state.outputBuffer;
  }

  cookbookFilterStageCount(stages) {
    const value = Math.round(Number(stages));
    return Number.isFinite(value) ? this.clampValue(value, 0, 5) : 2;
  }

  cookbookFilterCoefficients(mode, frequency, q, gainDb, rate = sampleRate) {
    const safeMode = Math.round(this.clampValue(Number(mode) || 0, 0, 9));
    if (safeMode === 0) {
      return { a1: 0, a2: 0, b0: 1, b1: 0, b2: 0 };
    }
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const freq = this.clampValue(Number(frequency) || 1000, 20, Math.min(20000, safeRate * 0.49));
    const safeQ = Math.max(0.0001, Number(q) || 1);
    const omega = 2 * Math.PI * freq / safeRate;
    const sine = Math.sin(omega);
    const cosine = Math.cos(omega);
    const alpha = sine / (2 * safeQ);
    const amplitude = 10 ** (0.025 * (Number(gainDb) || 0));
    const beta = Math.sqrt(amplitude) / safeQ;
    let a0 = 1 + alpha;
    let a1 = -2 * cosine;
    let a2 = 1 - alpha;
    let b0 = 1;
    let b1 = 0;
    let b2 = 0;
    if (safeMode === 1) {
      b1 = 1 - cosine;
      b0 = b1 * 0.5;
      b2 = b0;
    } else if (safeMode === 2) {
      b1 = -(1 + cosine);
      b0 = -b1 * 0.5;
      b2 = b0;
    } else if (safeMode === 3) {
      b0 = safeQ * alpha;
      b2 = -b0;
    } else if (safeMode === 4) {
      b0 = alpha;
      b2 = -alpha;
    } else if (safeMode === 5) {
      b0 = 1;
      b1 = -2 * cosine;
      b2 = 1;
    } else if (safeMode === 6) {
      b0 = 1 - alpha;
      b1 = -2 * cosine;
      b2 = 1 + alpha;
    } else if (safeMode === 7) {
      a0 = 1 + alpha / amplitude;
      a2 = 1 - alpha / amplitude;
      b0 = 1 + alpha * amplitude;
      b1 = -2 * cosine;
      b2 = 1 - alpha * amplitude;
    } else if (safeMode === 8) {
      a0 = (amplitude + 1) + (amplitude - 1) * cosine + beta * sine;
      a1 = -2 * ((amplitude - 1) + (amplitude + 1) * cosine);
      a2 = (amplitude + 1) + (amplitude - 1) * cosine - beta * sine;
      b0 = amplitude * ((amplitude + 1) - (amplitude - 1) * cosine + beta * sine);
      b1 = 2 * amplitude * ((amplitude - 1) - (amplitude + 1) * cosine);
      b2 = amplitude * ((amplitude + 1) - (amplitude - 1) * cosine - beta * sine);
    } else if (safeMode === 9) {
      a0 = (amplitude + 1) - (amplitude - 1) * cosine + beta * sine;
      a1 = 2 * ((amplitude - 1) - (amplitude + 1) * cosine);
      a2 = (amplitude + 1) - (amplitude - 1) * cosine - beta * sine;
      b0 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine + beta * sine);
      b1 = -2 * amplitude * ((amplitude - 1) + (amplitude + 1) * cosine);
      b2 = amplitude * ((amplitude + 1) + (amplitude - 1) * cosine - beta * sine);
    }
    const scale = a0 !== 0 ? 1 / a0 : 1;
    return {
      a1: a1 * scale,
      a2: a2 * scale,
      b0: b0 * scale,
      b1: b1 * scale,
      b2: b2 * scale,
    };
  }

  cookbookFilterSample(state, input, mode, frequency, q, gainDb, stages, rate = sampleRate) {
    if (this.nativeCookbookFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeCookbookFilter.soemdsp_cookbook_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeCookbookFilter.soemdsp_cookbook_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              Math.round(this.clampValue(Number(mode) || 0, 0, 9)),
              Number(frequency) || 1000,
              Number(q) || 1,
              Number(gainDb) || 0,
              Number(stages) || 2,
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeCookbookFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "cookbook_filter",
          status: "disabled",
          message: String(error?.message || error || "native Cookbook Filter failed"),
        });
      }
    }
    const stageCount = this.cookbookFilterStageCount(stages);
    if (!state || stageCount <= 0 || Math.round(Number(mode) || 0) === 0) {
      return Number(input) || 0;
    }
    if (state.lastStages !== stageCount) {
      this.resetCookbookFilterState(state);
      state.lastStages = stageCount;
    }
    const coeff = this.cookbookFilterCoefficients(mode, frequency, q, gainDb, rate);
    let value = this.safeFilterNumber(input, state);
    for (let index = 0; index < stageCount; index += 1) {
      const previousInput = value;
      value = coeff.b0 * value + coeff.b1 * state.x1[index] + coeff.b2 * state.x2[index]
        - coeff.a1 * state.y1[index] - coeff.a2 * state.y2[index];
      state.x2[index] = state.x1[index];
      state.x1[index] = previousInput;
      state.y2[index] = state.y1[index];
      state.y1[index] = value;
    }
    return this.safeFilterNumber(value, state);
  }

  ladderFilterStageCount(stages) {
    const value = Math.round(Number(stages));
    return Number.isFinite(value) ? this.clampValue(value, 1, 4) : 4;
  }

  ladderFilterMix(mode, stages) {
    const safeMode = Math.round(this.clampValue(Number(mode) || 0, 0, 3));
    const stageCount = this.ladderFilterStageCount(stages);
    const c = [0, 0, 0, 0, 0];
    let s = 1;
    if (safeMode === 0) {
      c[0] = 1;
      s = 0.125;
    } else if (safeMode === 1) {
      c[stageCount] = 1;
      s = stageCount * 0.25;
    } else if (safeMode === 2) {
      const coefficients = [
        [1, -1],
        [1, -2, 1],
        [1, -3, 3, -1],
        [1, -4, 6, -4, 1],
      ][stageCount - 1];
      for (let index = 0; index < coefficients.length; index += 1) {
        c[index] = coefficients[index];
      }
      s = stageCount * 0.25;
    } else {
      const coefficients = stageCount <= 2
        ? [0, 2, -2, 0, 0]
        : stageCount === 3
          ? [0, 0, 3, -3, 0]
          : [0, 0, 4, -8, 4];
      for (let index = 0; index < coefficients.length; index += 1) {
        c[index] = coefficients[index];
      }
      s = 0.125;
    }
    return { c, mode: safeMode, s, stageCount };
  }

  ladderFilterFeedbackFactor(feedback, cosWc, a) {
    const b = 1 + a;
    const denominator = Math.max(1e-12, 1 + a * a + 2 * a * cosWc);
    const g2 = (b * b) / denominator;
    return feedback / Math.max(1e-12, g2 * g2);
  }

  ladderFilterCoefficients(frequency, resonance, mode, stages, rate = sampleRate, state = null) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const frequencyValue = Math.max(0, this.safeFilterNumber(frequency, state));
    const safeFrequency = this.clampValue(frequencyValue, 0.000001, Math.min(20000, safeRate * 0.49));
    const feedback = this.clampValue(this.safeFilterNumber(resonance, state), 0, 0.999);
    const wc = this.clampValue((2 * Math.PI * safeFrequency) / safeRate, 1e-9, Math.PI * 0.98);
    const sine = Math.sin(wc);
    const cosine = Math.cos(wc);
    const tangent = Math.tan(0.25 * (wc - Math.PI));
    let a = tangent / Math.max(1e-12, sine - cosine * tangent);
    if (!Number.isFinite(a)) {
      a = -1;
    }
    const mix = this.ladderFilterMix(mode, stages);
    const k = this.ladderFilterFeedbackFactor(feedback, cosine, a);
    const g = 1 + mix.s * k;
    return { ...mix, a, g, k };
  }

  ladderFilterSample(state, input, params, rate = sampleRate) {
    if (this.nativeLadderFilterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeLadderFilter.soemdsp_ladder_filter_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeLadderFilter.soemdsp_ladder_filter_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, state),
              Math.max(0, this.safeFilterNumber(params.frequency, state)),
              this.clampValue(this.safeFilterNumber(params.resonance, state), 0, 0.999),
              Math.max(0, Math.min(3, Math.round(Number(params.mode) || 0))),
              Math.max(1, Math.min(4, Math.round(Number(params.stages) || 4))),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeLadderFilterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "ladder_filter",
          status: "disabled",
          message: String(error?.message || error || "native Ladder Filter failed"),
        });
      }
    }
    const safeInput = this.safeFilterNumber(input, state);
    const coeff = this.ladderFilterCoefficients(
      params.frequency,
      params.resonance,
      params.mode,
      params.stages,
      rate,
      state,
    );
    const y = Array.isArray(state.y) && state.y.length >= 5 ? state.y : [0, 0, 0, 0, 0];
    state.y = y;
    y[0] = coeff.g * safeInput - coeff.k * y[4];
    y[0] = y[0] / (1 + y[0] * y[0]);
    y[1] = y[0] + coeff.a * (y[0] - y[1]);
    y[2] = y[1] + coeff.a * (y[1] - y[2]);
    y[3] = y[2] + coeff.a * (y[2] - y[3]);
    y[4] = y[3] + coeff.a * (y[3] - y[4]);
    for (let index = 0; index < y.length; index += 1) {
      y[index] = this.safeFilterNumber(y[index], state);
    }
    const output = coeff.c[0] * y[0] + coeff.c[1] * y[1] + coeff.c[2] * y[2] + coeff.c[3] * y[3] + coeff.c[4] * y[4];
    return this.safeFilterNumber(output, state);
  }

  tb303FilterSample(state, input, params, rate = sampleRate) {
    if (!this.nativeTb303FilterReady) {
      throw new Error("native TB-303 Filter not ready");
    }
    if (!state.nativeHandle) {
      state.nativeHandle = this.nativeTb303Filter.soemdsp_tb303_filter_create();
    }
    if (!state.nativeHandle) {
      throw new Error("native TB-303 Filter failed to create instance");
    }
    return this.safeFilterNumber(
      this.nativeTb303Filter.soemdsp_tb303_filter_sample(
        state.nativeHandle,
        this.safeFilterNumber(input, state),
        Math.max(200, this.safeFilterNumber(params.cutoff, state)),
        Math.max(0, Math.min(100, this.safeFilterNumber(params.resonance, state))),
        Math.max(0, Math.min(14, Math.round(Number(params.mode) || 4))),
        Number(params.drive) || 0,
        Math.max(1, Number(rate) || sampleRate || 44100),
      ),
      state,
    );
  }

  slewLimiterSample(state, input, upTime, downTime, rate = sampleRate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const safeInput = this.safeFilterNumber(input, state);
    if (this.nativeSlewLimiterReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeSlewLimiter.soemdsp_slew_limiter_create();
        }
        if (state.nativeHandle) {
          state.initialized = true;
          return this.safeFilterNumber(
            this.nativeSlewLimiter.soemdsp_slew_limiter_sample(
              state.nativeHandle,
              safeInput,
              Math.max(0, this.safeFilterNumber(upTime, state)),
              Math.max(0, this.safeFilterNumber(downTime, state)),
              safeRate,
            ),
            state,
          );
        }
      } catch (error) {
        this.nativeSlewLimiterReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "slew_limiter",
          status: "disabled",
          message: String(error?.message || error || "native Slew Limiter failed"),
        });
      }
    }
    const target = safeInput;
    if (!state.initialized) {
      state.initialized = true;
      state.out = target;
      return target;
    }
    const upSeconds = Math.max(0, this.safeFilterNumber(upTime, state));
    const downSeconds = Math.max(0, this.safeFilterNumber(downTime, state));
    const delta = target - state.out;
    const maxRise = upSeconds <= 0 ? Infinity : 1 / Math.max(1, upSeconds * safeRate);
    const maxFall = downSeconds <= 0 ? Infinity : 1 / Math.max(1, downSeconds * safeRate);
    state.out = this.safeFilterNumber(
      state.out + Math.max(-maxFall, Math.min(maxRise, delta)),
      state,
    );
    return state.out;
  }

  clockAnalogWhipSample(phase, level) {
    const p = this.clampValue(Number(phase) || 0, 0, 1);
    const attack = 1 - Math.pow(1 - Math.min(1, p / 0.035), 4);
    const release = Math.pow(Math.max(0, 1 - p), 1.85);
    const snapEnvelope = attack * release;
    const sweepTurns = (3.15 * (1 - Math.exp(-4.2 * p)) / (1 - Math.exp(-4.2))) + (0.18 * Math.sin(Math.PI * p));
    const liquidBend = 0.075 * Math.sin(Math.PI * 2 * p) * Math.pow(Math.max(0, 1 - p), 1.2);
    const body = Math.sin((sweepTurns + liquidBend) * Math.PI * 2);
    const sheen = Math.sin((sweepTurns * 2.02 + 0.17) * Math.PI * 2) * 0.16 * Math.pow(Math.max(0, 1 - p), 2.8);
    return (body + sheen) * snapEnvelope * level;
  }

  clockSample(state, reset, phaseOffset, rate, duty, level, rateHz = sampleRate) {
    const safeReset = this.safeFilterNumber(reset, null);
    const safePhaseOffset = this.wrapValue(this.safeFilterNumber(phaseOffset, null), 0, 1);
    const safeRate = Math.max(0, this.safeFilterNumber(rate, null));
    const safeDuty = this.clampValue(this.safeFilterNumber(duty, null), 0, 1);
    const safeLevel = this.safeFilterNumber(level, null);
    const resetActive = safeReset > 0;
    const rawPhase = resetActive ? 0 : this.wrapValue(Number(state.phase) || 0, 0, 1);
    const phase = this.wrapValue(rawPhase + safePhaseOffset, 0, 1);
    const digital = phase < safeDuty ? safeLevel : 0;
    const analog = this.clockAnalogWhipSample(phase, safeLevel);
    const nextRawPhase = this.wrapValue(rawPhase + safeRate / Math.max(1, rateHz), 0, 1);
    const pulse = safeRate > 0 && !resetActive && (!state.hasStarted || nextRawPhase < rawPhase) ? safeLevel : 0;
    state.hasStarted = !resetActive;
    state.phase = resetActive ? 0 : nextRawPhase;
    return {
      "Analog Out": analog,
      "Digital Out": digital,
      Out: digital,
      Pulse: pulse,
    };
  }

  normalizePatchTiming(timing = {}) {
    const source = timing && typeof timing === "object" ? timing : {};
    return {
      tempoBpm: Math.max(1, Math.round(Number(source.tempoBpm) || 120)),
      timeSignatureDenominator: Math.max(1, Math.round(Number(source.timeSignatureDenominator) || 4)),
      timeSignatureNumerator: Math.max(1, Math.round(Number(source.timeSignatureNumerator) || 4)),
    };
  }

  transportDivisionFactor(divisions) {
    const division = Math.round(Number(divisions) || 0);
    if (division > 0) {
      return division + 1;
    }
    if (division < 0) {
      return 1 / (Math.abs(division) + 1);
    }
    return 1;
  }

  transportSample(params, frame, rateHz = sampleRate) {
    const rate = Math.max(1, Number(rateHz) || sampleRate || 44100);
    const tempoBpm = Math.max(1, Number(this.timing?.tempoBpm) || 120);
    const frequency = (tempoBpm / 60) * this.transportDivisionFactor(params.divisions);
    const amplitude = this.clampValue(this.safeFilterNumber(params.amplitude, null), 0, 1);
    const phase = frequency > 0 ? this.wrapValue((Math.max(0, Number(frame) || 0) / rate) * frequency, 0, 1) : 0;
    const high = phase < 0.5;
    return {
      "-1..1": high ? amplitude : -amplitude,
      "0..1": high ? amplitude : 0,
    };
  }

  randomClockNextUnit(state, nodeId, seed) {
    const seedKey = `${nodeId}:${Math.round(Number(seed) || 0)}`;
    if (state.seedKey !== seedKey) {
      state.seedKey = seedKey;
      state.randomState = this.stableSeed(seedKey);
      state.intervalSamples = 0;
      state.phaseSamples = 0;
      state.remainingTriggerSamples = 0;
    }
    state.randomState = (Math.imul(state.randomState || 1, 1664525) + 1013904223) >>> 0;
    return state.randomState / 4294967296;
  }

  randomClockChooseIntervalSamples(state, params, rateHz, nodeId) {
    const rate = Math.max(1, rateHz || sampleRate || 44100);
    const minSeconds = Math.max(0, this.safeFilterNumber(params.minSeconds, null));
    const maxSeconds = Math.max(0, this.safeFilterNumber(params.maxSeconds, null));
    const low = Math.min(minSeconds, maxSeconds);
    const high = Math.max(minSeconds, maxSeconds);
    const random = this.randomClockNextUnit(state, nodeId, params.seed);
    return Math.max(1, Math.round((low + (high - low) * random) * rate));
  }

  randomClockSample(state, reset, params, rateHz = sampleRate, nodeId = "") {
    const safeReset = this.safeFilterNumber(reset, null);
    const threshold = this.safeFilterNumber(params.threshold, null);
    const rate = Math.max(1, rateHz || sampleRate || 44100);
    const duty = this.clampValue(this.safeFilterNumber(params.duty, null), 0, 1);
    const triggerTime = Math.max(0, this.safeFilterNumber(params.triggerTime, null));
    const level = this.safeFilterNumber(params.level, null);
    const resetEdge = state.lastReset <= threshold && safeReset > threshold;

    if (resetEdge || state.intervalSamples <= 0) {
      state.intervalSamples = this.randomClockChooseIntervalSamples(state, params, rate, nodeId);
      state.phaseSamples = 0;
      state.remainingTriggerSamples = Math.max(1, Math.round(triggerTime * rate));
    } else if (state.phaseSamples >= state.intervalSamples) {
      state.intervalSamples = this.randomClockChooseIntervalSamples(state, params, rate, nodeId);
      state.phaseSamples = 0;
      state.remainingTriggerSamples = Math.max(1, Math.round(triggerTime * rate));
    }

    const gateSamples = Math.round(state.intervalSamples * duty);
    const trigger = state.remainingTriggerSamples > 0 ? level : 0;
    const gate = state.phaseSamples < gateSamples ? level : 0;
    state.remainingTriggerSamples = Math.max(0, state.remainingTriggerSamples - 1);
    state.phaseSamples += 1;
    state.lastReset = safeReset;
    return {
      Gate: this.safeFilterNumber(gate, null),
      Trigger: this.safeFilterNumber(trigger, null),
    };
  }

  delayedTriggerSample(state, trigger, reset, params, rateHz = sampleRate) {
    const safeTrigger = this.safeFilterNumber(trigger, null);
    const safeReset = this.safeFilterNumber(reset, null);
    const threshold = this.safeFilterNumber(params.threshold, null);
    const delay = Math.max(0, this.safeFilterNumber(params.delay, null));
    const pulseTime = Math.max(0, this.safeFilterNumber(params.pulseTime, null));
    const level = this.safeFilterNumber(params.level, null);
    const rate = Math.max(1, rateHz || sampleRate || 44100);

    if (state.lastReset <= threshold && safeReset > threshold) {
      state.hasTriggered = true;
      state.remainingSamples = 0;
      state.running = false;
      state.waitSamples = 0;
    }
    if (state.lastTrigger <= threshold && safeTrigger > threshold) {
      state.hasTriggered = false;
      state.remainingSamples = 0;
      state.running = true;
      state.waitSamples = Math.max(0, Math.round(delay * rate));
    }

    if (state.running && !state.hasTriggered) {
      if (state.waitSamples <= 0) {
        state.hasTriggered = true;
        state.running = false;
        state.remainingSamples = Math.max(1, Math.round(pulseTime * rate));
      } else {
        state.waitSamples -= 1;
      }
    }

    state.lastTrigger = safeTrigger;
    state.lastReset = safeReset;
    const output = state.remainingSamples > 0 ? level : 0;
    state.remainingSamples = Math.max(0, state.remainingSamples - 1);
    return this.safeFilterNumber(output, null);
  }

  patchCommandTriggerSample(state, trigger, threshold, command, nodeId) {
    const safeTrigger = this.safeFilterNumber(trigger, null);
    const safeThreshold = this.safeFilterNumber(threshold, null);
    if (state.lastTrigger <= safeThreshold && safeTrigger > safeThreshold) {
      this.port.postMessage({
        command,
        nodeId,
        sessionId: this.sessionId,
        type: "patchCommand",
      });
    }
    state.lastTrigger = safeTrigger;
    return 0;
  }

  delayParabolSample(phase) {
    const wrapped = phase - Math.floor(phase);
    return wrapped < 0.5 ? wrapped * 4 - 1 : 3 - wrapped * 4;
  }

  delayInterpolateLinear(buffer, where) {
    const length = buffer.length;
    if (!length) {
      return 0;
    }
    const before = Math.floor(where) % length;
    const after = (before + 1) % length;
    const mix = where - Math.floor(where);
    return buffer[before] * (1 - mix) + buffer[after] * mix;
  }

  delayEffectSample(state, input, params, rateHz = sampleRate, nodeId = "") {
    const safeRate = Math.max(1, Number(rateHz) || 44100);
    if (this.nativeDelayEffectReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeDelayEffect.soemdsp_delay_effect_create();
        }
        if (state.nativeHandle) {
          if (state.nativeSeedNodeId !== nodeId) {
            state.nativeSeed = this.stableSeed(`${nodeId}:delayVariation`);
            state.nativeSeedNodeId = nodeId;
          }
          const out = this.safeFilterNumber(
            this.nativeDelayEffect.soemdsp_delay_effect_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, null),
              this.clampValue(this.safeFilterNumber(params.time, null), 0.001, 4.25),
              this.clampValue(this.safeFilterNumber(params.feedback, null), 0, 0.95),
              this.clampValue(this.safeFilterNumber(params.mix, null), 0, 1),
              this.clampValue(this.safeFilterNumber(params.level, null), 0, 2),
              this.clampValue(this.safeFilterNumber(params.modAmount, null), 0, 0.5),
              this.clampValue(this.safeFilterNumber(params.modRate, null), 0, 90),
              this.clampValue(this.safeFilterNumber(params.modVariation, null), 0, 1),
              Math.round(this.safeFilterNumber(params.mode, null)) >= 1 ? 1 : 0,
              state.nativeSeed,
              safeRate,
            ),
            null,
          );
          const wet = this.safeFilterNumber(
            this.nativeDelayEffect.soemdsp_delay_effect_last_wet(state.nativeHandle),
            null,
          );
          return { Out: out, Wet: wet };
        }
      } catch (error) {
        this.nativeDelayEffectReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "delay_effect",
          status: "disabled",
          message: String(error?.message || error || "native Delay Effect failed"),
        });
      }
    }
    const maxDelaySeconds = 4.25;
    const requiredSize = Math.max(2, Math.ceil(safeRate * maxDelaySeconds) + 2);
    if (!state.buffer || state.bufferSize !== requiredSize) {
      state.buffer = new Float32Array(requiredSize);
      state.bufferSize = requiredSize;
      state.position = 0;
      state.lfoPhase = 0;
      state.lfoVariationState = 0;
      state.wet = 0;
    }
    const dry = this.safeFilterNumber(input, null);
    const time = this.clampValue(this.safeFilterNumber(params.time, null), 0.001, maxDelaySeconds);
    const feedback = this.clampValue(this.safeFilterNumber(params.feedback, null), 0, 0.95);
    const mix = this.clampValue(this.safeFilterNumber(params.mix, null), 0, 1);
    const level = this.clampValue(this.safeFilterNumber(params.level, null), 0, 2);
    const modAmount = this.clampValue(this.safeFilterNumber(params.modAmount, null), 0, 0.5);
    const modRate = this.clampValue(this.safeFilterNumber(params.modRate, null), 0, 90);
    const modVariation = this.clampValue(this.safeFilterNumber(params.modVariation, null), 0, 1);
    const mode = Math.round(this.safeFilterNumber(params.mode, null)) >= 1 ? 1 : 0;

    const variationTarget = this.hashBipolar(
      Math.floor(state.lfoPhase * 997) + state.position,
      this.stableSeed(`${nodeId}:delayVariation`),
    );
    state.lfoVariationState += (variationTarget - state.lfoVariationState) * Math.min(1, modRate / safeRate);
    const variedRate = Math.max(0, modRate * (1 + state.lfoVariationState * modVariation));
    state.lfoPhase = (state.lfoPhase + variedRate / safeRate) % 1;
    const lfo = (this.delayParabolSample(state.lfoPhase) + 1) * 0.5;

    const delaySamples = this.clampValue(time * safeRate, 1, state.bufferSize - 2);
    const bufferOffset = delaySamples - delaySamples * lfo * modAmount + 1;
    state.position = (state.position + 1) % state.bufferSize;
    const readPosition = (state.position + state.bufferSize - bufferOffset) % state.bufferSize;
    const wet = this.delayInterpolateLinear(state.buffer, readPosition);
    const write = mode ? ((0 - dry) - wet * feedback) : (dry + wet * feedback);
    state.buffer[state.position] = this.clampValue(write, -8, 8);
    state.wet = mode ? (dry * feedback - wet * (1 - feedback * feedback)) : wet;
    return {
      Out: (dry * (1 - mix) + state.wet * mix) * level,
      Wet: state.wet * level,
    };
  }

  createSabrinaReverbState() {
    return {
      nativeHandle: 0,
      nativeParamKey: "",
      nativeSampleRate: 0,
      idleCounter: 0,
      isIdle: false,
      // Only created lazily if the native WASM SIMD module ever fails to
      // instantiate (see sabrinaReverbSample) -- a hardware/runtime without
      // WASM SIMD128 support, not an ordinary code path.
      jsState: null,
    };
  }

  // ---- Sabrina Reverb: non-SIMD JS fallback -------------------------------
  // Ported directly from sabrina_reverb.cpp's OWN scalar reference path
  // (delaySample/diffuseSample/sabrinaProcessBlockScalar -- "the pre-SIMD
  // algorithm, still present and unused by the live per-sample API" per that
  // file's comments) rather than re-derived from the SIMD kernels, so this
  // is a faithful port of an already-verified-equivalent implementation, not
  // a fresh guess at matching behavior. Only exercised when the native WASM
  // module fails to instantiate (see sabrinaReverbSample below) -- i.e. on a
  // runtime without WASM SIMD128 support.
  sabrinaReverbFinite(value) {
    return Number.isFinite(value) && value > -1.0e12 && value < 1.0e12;
  }

  sabrinaReverbParabol(value) {
    const wrapped = value - Math.floor(value);
    const fit = wrapped * 2.0 - 1.0;
    return 4.0 * fit * (1.0 - Math.abs(fit));
  }

  createSabrinaReverbDelay() {
    return {
      buffer: new Float32Array(192000),
      driver: 0,
      rndNext: 0,
      feedback: 0,
      rndAcc: 0,
      offset: 0,
      modInc: 0,
      modSpeed: 0,
      lfopercent: 0,
      rndOffset: 0,
      rndMod: 0,
    };
  }

  sabrinaReverbRnd(delay) {
    delay.rndNext = (delay.rndNext + 109) % 123094;
    delay.rndAcc = this.sabrinaReverbParabol(
      this.sabrinaReverbParabol((delay.rndNext + delay.rndAcc + 10.0) * 134987.489798 + 1987.19687) * 1987.4987 + 98497.19879,
    );
    return delay.rndAcc * 0.5 + 0.5;
  }

  sabrinaReverbSetOffsetSize(delay, size, maxDelaySize) {
    delay.offset = maxDelaySize * delay.rndOffset * (size * 0.1 + 0.0000001) + 1.0;
  }

  sabrinaReverbInitializeMod(delay, lfoSeconds, lfoVariation, sampleRate) {
    const seconds = lfoSeconds + delay.rndMod * lfoVariation;
    delay.modSpeed = (1.0 / (seconds > 0.000001 ? seconds : 0.000001)) / sampleRate;
  }

  sabrinaReverbInitializeDelay(delay, seed, sampleRate) {
    delay.buffer.fill(0);
    delay.driver = 0;
    delay.feedback = 0;
    delay.rndNext = ((seed % 123094) + 123094) % 123094;
    delay.rndAcc = 0;
    this.sabrinaReverbRnd(delay);
    this.sabrinaReverbRnd(delay);
    this.sabrinaReverbRnd(delay);
    delay.rndOffset = this.sabrinaReverbRnd(delay);
    delay.rndMod = this.sabrinaReverbRnd(delay);
    delay.modInc = 0;
    delay.lfopercent = 0;
    this.sabrinaReverbSetOffsetSize(delay, 0.06, sampleRate * 4.0);
    this.sabrinaReverbInitializeMod(delay, 1.0, 0.001, sampleRate);
  }

  sabrinaReverbReadDelay(delay, where) {
    const size = delay.buffer.length;
    let wrapped = where % size;
    if (wrapped < 0) {
      wrapped += size;
    }
    const before = Math.floor(wrapped);
    const after = (before + 1) % size;
    const mix = wrapped - before;
    return delay.buffer[before] * (1.0 - mix) + delay.buffer[after] * mix;
  }

  sabrinaReverbDelaySample(delay, input) {
    const safeInput = this.sabrinaReverbFinite(input) ? input : 0.0;
    delay.modInc += delay.modSpeed;
    const lfo = this.sabrinaReverbParabol(delay.modInc) * 0.5 + 0.5;
    const readPosition = delay.driver - delay.offset - delay.offset * lfo * delay.lfopercent;
    delay.driver = (delay.driver + 1) % delay.buffer.length;
    const delayed = this.sabrinaReverbReadDelay(delay, readPosition);
    delay.buffer[delay.driver] = safeInput;
    return this.sabrinaReverbFinite(delayed) ? delayed : 0.0;
  }

  sabrinaReverbDiffuseSample(delay, input) {
    const safeInput = this.sabrinaReverbFinite(input) ? input : 0.0;
    delay.modInc += delay.modSpeed;
    const lfo = this.sabrinaReverbParabol(delay.modInc) * 0.5 + 0.5;
    const readPosition = delay.driver - delay.offset - delay.offset * lfo * delay.lfopercent;
    delay.driver = (delay.driver + 1) % delay.buffer.length;
    const delayed = this.sabrinaReverbReadDelay(delay, readPosition);
    delay.buffer[delay.driver] = this.clampValue((0.0 - safeInput) - delayed * delay.feedback, -16.0, 16.0);
    const output = safeInput * delay.feedback - delayed * (1.0 - delay.feedback * delay.feedback);
    return this.sabrinaReverbFinite(output) ? output : 0.0;
  }

  sabrinaReverbReseedDelays(state, seed) {
    state.seed = seed;
    for (let index = 0; index < 14; index += 1) {
      this.sabrinaReverbInitializeDelay(state.delays[index], index * 137 + 7 + seed * 9973, state.sampleRate);
    }
  }

  sabrinaReverbApplyDelayGeometry(state) {
    const maxDelaySize = state.sampleRate * 4.0;
    const lfoSpeed = ((1.0 - state.smoothedLfoBaseSpeed) * 1.95 + 0.5) * 0.5;
    const lfoVariation = (1.0 - state.smoothedLfoVariation) * 0.25;
    const diffusionSizeFactor = state.smoothedDiffusionSize * 0.1 + 0.0000001;
    const sharedFeedback = state.diffusionAmount;
    const sharedLfopercent = state.smoothedLfoAmplitude * 0.1;
    for (let index = 0; index < 12; index += 1) {
      const delay = state.delays[index];
      // Deliberately not sabrinaReverbSetOffsetSize here -- that helper's
      // "size" arg gets a 0.1 folded in internally, and diffusionSizeFactor
      // already has that same 0.1 folded in too (matches applyDelayGeometry's
      // C++ source), so this calls the low-level formula directly instead of
      // applying the 0.1 factor twice.
      delay.offset = maxDelaySize * diffusionSizeFactor * delay.rndOffset + 1.0;
      const seconds = lfoSpeed + delay.rndMod * lfoVariation;
      const safeSeconds = Math.max(seconds, 0.000001);
      delay.modSpeed = (1.0 / safeSeconds) / state.sampleRate;
      delay.feedback = sharedFeedback;
      delay.lfopercent = sharedLfopercent;
    }
    for (let index = 12; index < 14; index += 1) {
      const delay = state.delays[index];
      delay.offset = (maxDelaySize - 2.0) * state.smoothedDelaySize * 0.1 + 1.0;
      delay.lfopercent = state.smoothedLfoAmplitude * 0.1;
      this.sabrinaReverbInitializeMod(delay, lfoSpeed, lfoVariation, state.sampleRate);
    }
  }

  sabrinaReverbSmoothingNeedsWork(state) {
    const epsilon = 1e-6;
    const near = (a, b) => Math.abs(a - b) < epsilon;
    return !(
      near(state.smoothedDiffusionSize, state.diffusionSize) &&
      near(state.smoothedDelaySize, state.delaySize) &&
      near(state.smoothedLfoAmplitude, state.lfoAmplitude) &&
      near(state.smoothedLfoBaseSpeed, state.lfoBaseSpeed) &&
      near(state.smoothedLfoVariation, state.lfoVariation)
    );
  }

  sabrinaReverbAdvanceSmoothing(state) {
    if (!this.sabrinaReverbSmoothingNeedsWork(state)) {
      return;
    }
    const alpha = state.paramSmoothAlpha;
    state.smoothedDiffusionSize += (state.diffusionSize - state.smoothedDiffusionSize) * alpha;
    state.smoothedDelaySize += (state.delaySize - state.smoothedDelaySize) * alpha;
    state.smoothedLfoAmplitude += (state.lfoAmplitude - state.smoothedLfoAmplitude) * alpha;
    state.smoothedLfoBaseSpeed += (state.lfoBaseSpeed - state.smoothedLfoBaseSpeed) * alpha;
    state.smoothedLfoVariation += (state.lfoVariation - state.smoothedLfoVariation) * alpha;
    this.sabrinaReverbApplyDelayGeometry(state);
  }

  createSabrinaReverbJsState(sampleRate) {
    const safeRate = this.clampValue(Number(sampleRate) || 44100, 1, 192000);
    const state = {
      delays: Array.from({ length: 14 }, () => this.createSabrinaReverbDelay()),
      sampleRate: safeRate,
      ch0: 0,
      ch1: 0,
      lastWet: 0,
      mix: 0.43,
      diffusionSize: 0.35,
      diffusionAmount: 0.70,
      delaySize: 0.02,
      recycle: 0.70,
      lfoAmplitude: 0.07,
      lfoBaseSpeed: 0.83,
      lfoVariation: 0.001,
      seed: 0,
      smoothedDiffusionSize: 0.35,
      smoothedDelaySize: 0.02,
      smoothedLfoAmplitude: 0.07,
      smoothedLfoBaseSpeed: 0.83,
      smoothedLfoVariation: 0.001,
      paramSmoothAlpha: 1.0 - Math.exp(-1.0 / (0.05 * safeRate)),
    };
    this.sabrinaReverbReseedDelays(state, 0);
    this.sabrinaReverbApplyDelayGeometry(state);
    return state;
  }

  sabrinaReverbJsSample(state, leftInput, rightInput, params, rateHz) {
    const safeRate = this.clampValue(Number(rateHz) || 44100, 1, 192000);
    if (state.sampleRate !== safeRate) {
      Object.assign(state, this.createSabrinaReverbJsState(safeRate));
    }
    state.mix = this.clampValue(this.safeFilterNumber(params.mix, null), 0, 1);
    state.diffusionSize = this.clampValue(this.safeFilterNumber(params.diffusionSize, null), 0, 1);
    state.diffusionAmount = this.clampValue(this.safeFilterNumber(params.diffusionAmount, null), 0, 0.98);
    state.delaySize = this.clampValue(this.safeFilterNumber(params.delaySize, null), 0, 1);
    state.recycle = this.clampValue(this.safeFilterNumber(params.recycle, null), 0, 0.98);
    state.lfoAmplitude = this.clampValue(this.safeFilterNumber(params.lfoAmplitude, null), 0, 1);
    state.lfoBaseSpeed = this.clampValue(this.safeFilterNumber(params.lfoBaseSpeed, null), 0, 1);
    state.lfoVariation = this.clampValue(this.safeFilterNumber(params.lfoVariation, null), 0, 1);
    const seedInt = Math.round(this.safeFilterNumber(params.seed, null) ?? 0);
    if (seedInt !== state.seed) {
      this.sabrinaReverbReseedDelays(state, seedInt);
    }

    this.sabrinaReverbAdvanceSmoothing(state);
    const dryLeft = this.sabrinaReverbFinite(leftInput) ? leftInput : 0.0;
    const dryRight = this.sabrinaReverbFinite(rightInput) ? rightInput : dryLeft;
    const preLeft = this.sabrinaReverbDelaySample(state.delays[12], state.ch1);
    const preRight = this.sabrinaReverbDelaySample(state.delays[13], state.ch0);
    let left = dryLeft + preLeft * state.recycle;
    let right = dryRight + preRight * state.recycle;
    for (let index = 0; index < 6; index += 1) {
      const outLeft = this.sabrinaReverbDiffuseSample(state.delays[index * 2], left);
      const outRight = this.sabrinaReverbDiffuseSample(state.delays[index * 2 + 1], right);
      left = outLeft;
      right = outRight;
    }
    state.ch0 = this.sabrinaReverbFinite(left) ? this.clampValue(left, -16.0, 16.0) : 0.0;
    state.ch1 = this.sabrinaReverbFinite(right) ? this.clampValue(right, -16.0, 16.0) : 0.0;
    const mixLeft = state.ch0 * state.mix + dryLeft * (1.0 - state.mix);
    const mixRight = state.ch1 * state.mix + dryRight * (1.0 - state.mix);
    state.lastWet = (state.ch0 + state.ch1) * 0.5;
    return {
      "Left Dry": dryLeft,
      "Mono Dry": (dryLeft + dryRight) * 0.5,
      "Right Dry": dryRight,
      "Left Mix": mixLeft,
      "Mono Mix": (mixLeft + mixRight) * 0.5,
      "Right Mix": mixRight,
    };
  }

  createPllState() {
    return { nativeHandle: 0, nativeParamKey: "", nativeSampleRate: 0 };
  }

  destroyPllState(state) {
    if (!state?.nativeHandle || !this.nativePll?.soemdsp_pll_destroy) return;
    this.nativePll.soemdsp_pll_destroy(state.nativeHandle);
    state.nativeHandle = 0;
  }

  pllSample(state, signalIn, cvIn, cvConnected, params, rateHz = sampleRate) {
    const native = this.nativePll;
    if (!this.nativePllReady || !native?.soemdsp_pll_create || !native?.soemdsp_pll_process) {
      return { "VCO Out": 0, "PC Out": 0, "LPF Out": 0, Locked: 0 };
    }
    try {
      const safeRate = Math.max(1, Number(rateHz) || sampleRate || 44100);
      if (!state.nativeHandle || state.nativeSampleRate !== safeRate) {
        if (state.nativeHandle && native.soemdsp_pll_destroy) {
          native.soemdsp_pll_destroy(state.nativeHandle);
        }
        state.nativeHandle = native.soemdsp_pll_create(safeRate) || 0;
        state.nativeSampleRate = safeRate;
        state.nativeParamKey = "";
      }
      if (!state.nativeHandle) {
        return { "VCO Out": 0, "PC Out": 0, "LPF Out": 0, Locked: 0 };
      }
      const range  = Math.max(0, Math.min(2, Math.round(this.safeFilterNumber(params.range,  null) ?? 1)));
      const offset = this.clampValue(this.safeFilterNumber(params.offset, null) ?? 5, 0, 10);
      const type   = Math.max(0, Math.min(2, Math.round(this.safeFilterNumber(params.type,   null) ?? 1)));
      const frequ  = Math.max(0.1, this.safeFilterNumber(params.frequ, null) ?? 10);
      const paramKey = `${range}:${Math.round(offset * 1000)}:${type}:${Math.round(frequ * 1000)}`;
      if (paramKey !== state.nativeParamKey && native.soemdsp_pll_set_params) {
        state.nativeParamKey = paramKey;
        native.soemdsp_pll_set_params(state.nativeHandle, safeRate, range, offset, type, frequ);
      }
      const safeSig = this.safeFilterNumber(signalIn, null) ?? 0;
      const safeCv  = this.clampValue(this.safeFilterNumber(cvIn, null) ?? 0, 0, 1);
      native.soemdsp_pll_process(state.nativeHandle, safeSig, safeCv, cvConnected);
      return {
        "VCO Out": this.safeFilterNumber(native.soemdsp_pll_vco_out?.(state.nativeHandle), null) ?? 0,
        "PC Out":  this.safeFilterNumber(native.soemdsp_pll_pc_out?.(state.nativeHandle),  null) ?? 0,
        "LPF Out": this.safeFilterNumber(native.soemdsp_pll_lpf_out?.(state.nativeHandle), null) ?? 0,
        Locked:    this.safeFilterNumber(native.soemdsp_pll_locked?.(state.nativeHandle),   null) ?? 0,
      };
    } catch {
      this.nativePllReady = false;
      this.destroyPllState(state);
      return { "VCO Out": 0, "PC Out": 0, "LPF Out": 0, Locked: 0 };
    }
  }

  createHelmholtzState() {
    return { nativeHandle: 0, nativeParamKey: "", nativeSampleRate: 0 };
  }

  helmholtzPitchView(frequencyHz) {
    if (!(frequencyHz > 0)) return -1;
    const minHz = 80;
    const octaves = 4;
    const clampedHz = Math.max(minHz, Math.min(minHz * Math.pow(2, octaves), frequencyHz));
    const norm = Math.log2(clampedHz / minHz) / octaves;
    return norm * 2 - 1;
  }

  destroyHelmholtzState(state) {
    if (!state?.nativeHandle || !this.nativeHelmholtz?.soemdsp_helmholtz_destroy) return;
    this.nativeHelmholtz.soemdsp_helmholtz_destroy(state.nativeHandle);
    state.nativeHandle = 0;
  }

  reportHelmholtzStatus(status, message = "") {
    const key = `${status}:${message}`;
    if (this.nativeHelmholtzStatusKey === key) return;
    this.nativeHelmholtzStatusKey = key;
    this.port.postMessage({
      type: "nativeModuleStatus",
      name: "helmholtz",
      status,
      message,
    });
  }

  helmholtzSample(state, input, params, inputConnected = true, rateHz = sampleRate) {
    if (!inputConnected) {
      this.destroyHelmholtzState(state);
      state.nativeSampleRate = 0;
      state.nativeParamKey = "";
      return { Frequency: 0, Fidelity: 0, "Pitch View": -1 };
    }
    const native = this.nativeHelmholtz;
    if (!this.nativeHelmholtzReady || !native?.soemdsp_helmholtz_create || !native?.soemdsp_helmholtz_process) {
      if (native) {
        this.reportHelmholtzStatus("disabled", "native Helmholtz exports missing; analyzer outputs zero");
      }
      return { Frequency: 0, Fidelity: 0, "Pitch View": -1 };
    }
    try {
      const safeRate = Math.max(1, Number(rateHz) || sampleRate || 44100);
      if (!state.nativeHandle || state.nativeSampleRate !== safeRate) {
        if (state.nativeHandle && native.soemdsp_helmholtz_destroy) {
          native.soemdsp_helmholtz_destroy(state.nativeHandle);
        }
        state.nativeHandle = native.soemdsp_helmholtz_create(safeRate) || 0;
        state.nativeSampleRate = safeRate;
        state.nativeParamKey = "";
      }
      if (!state.nativeHandle) {
        this.reportHelmholtzStatus("disabled", "native Helmholtz handle creation failed; analyzer outputs zero");
        return { Frequency: 0, Fidelity: 0, "Pitch View": -1 };
      }
      const windowSize = Math.max(128, Math.min(1024, Math.round(this.safeFilterNumber(params.windowSize, null) ?? 512)));
      const threshold = this.clampValue(this.safeFilterNumber(params.threshold, null) ?? 0.93, 0.5, 0.999);
      const paramKey = `${windowSize}:${Math.round(threshold * 1000)}`;
      if (paramKey !== state.nativeParamKey && native.soemdsp_helmholtz_set_params) {
        state.nativeParamKey = paramKey;
        native.soemdsp_helmholtz_set_params(state.nativeHandle, safeRate, windowSize, threshold);
      }
      const safeIn = this.safeFilterNumber(input, null) ?? 0;
      native.soemdsp_helmholtz_process(state.nativeHandle, safeIn);
      const frequency = this.safeFilterNumber(native.soemdsp_helmholtz_frequency?.(state.nativeHandle), null) ?? 0;
      return {
        Frequency: frequency,
        Fidelity: this.safeFilterNumber(native.soemdsp_helmholtz_fidelity?.(state.nativeHandle), null) ?? 0,
        "Pitch View": this.helmholtzPitchView(frequency),
      };
    } catch (error) {
      this.nativeHelmholtzReady = false;
      this.destroyHelmholtzState(state);
      this.reportHelmholtzStatus(
        "disabled",
        `native Helmholtz failed; analyzer outputs zero: ${String(error?.message || error || "unknown error")}`,
      );
      return { Frequency: 0, Fidelity: 0, "Pitch View": -1 };
    }
  }

  nativeSabrinaReverbSample(state, leftInput, rightInput, params, rateHz = sampleRate, frame = 0) {
    const native = this.nativeSabrinaReverb;
    if (
      !this.nativeSabrinaReverbReady ||
      !native?.soemdsp_sabrina_reverb_create ||
      !native?.soemdsp_sabrina_reverb_process
    ) {
      return null;
    }
    try {
      const safeRate = Math.max(1, Number(rateHz) || sampleRate || 44100);
      if (!state.nativeHandle || state.nativeSampleRate !== safeRate) {
        if (state.nativeHandle && native.soemdsp_sabrina_reverb_destroy) {
          native.soemdsp_sabrina_reverb_destroy(state.nativeHandle);
        }
        state.nativeHandle = native.soemdsp_sabrina_reverb_create(safeRate) || 0;
        state.nativeSampleRate = safeRate;
        state.nativeParamKey = "";
        state.idleCounter = 0;
        state.isIdle = false;
      }
      if (!state.nativeHandle) {
        return null;
      }
      const safeParams = {
        delaySize: this.clampValue(this.safeFilterNumber(params.delaySize, null), 0, 1),
        diffusionAmount: this.clampValue(this.safeFilterNumber(params.diffusionAmount, null), 0, 0.98),
        diffusionSize: this.clampValue(this.safeFilterNumber(params.diffusionSize, null), 0, 1),
        lfoAmplitude: this.clampValue(this.safeFilterNumber(params.lfoAmplitude, null), 0, 1),
        lfoBaseSpeed: this.clampValue(this.safeFilterNumber(params.lfoBaseSpeed, null), 0, 1),
        lfoVariation: this.clampValue(this.safeFilterNumber(params.lfoVariation, null), 0, 1),
        mix: this.clampValue(this.safeFilterNumber(params.mix, null), 0, 1),
        recycle: this.clampValue(this.safeFilterNumber(params.recycle, null), 0, 0.98),
        seed: Math.max(0, Math.min(99999, Math.round(this.safeFilterNumber(params.seed, null) ?? 0))),
      };
      const paramKey = [
        safeParams.mix,
        safeParams.diffusionSize,
        safeParams.diffusionAmount,
        safeParams.delaySize,
        safeParams.recycle,
        safeParams.lfoAmplitude,
        safeParams.lfoBaseSpeed,
        safeParams.lfoVariation,
      ].map((value) => Math.round(value * 1000000)).join(":") + `:${safeParams.seed}`;
      if (paramKey !== state.nativeParamKey && native.soemdsp_sabrina_reverb_set_params) {
        state.nativeParamKey = paramKey;
        native.soemdsp_sabrina_reverb_set_params(
          state.nativeHandle,
          safeParams.mix,
          safeParams.diffusionSize,
          safeParams.diffusionAmount,
          safeParams.delaySize,
          safeParams.recycle,
          safeParams.lfoAmplitude,
          safeParams.lfoBaseSpeed,
          safeParams.lfoVariation,
          safeParams.seed,
        );
      }
      const dryLeft = this.safeFilterNumber(leftInput, null);
      const dryRight = this.safeFilterNumber(rightInput, null);
      const dryMono = (dryLeft + dryRight) * 0.5;
      const inputActive = Math.abs(dryLeft) >= 0.000001 || Math.abs(dryRight) >= 0.000001;
      if (inputActive) {
        state.isIdle = false;
        state.idleCounter = 0;
      }
      // Bypass mode: reverb is idle, pass dry signal straight through all outputs
      if (state.isIdle) {
        return { "Left Dry": dryLeft, "Mono Dry": dryMono, "Right Dry": dryRight, "Left Mix": dryLeft, "Mono Mix": dryMono, "Right Mix": dryRight };
      }
      native.soemdsp_sabrina_reverb_process(state.nativeHandle, dryLeft, dryRight);
      const mixLeft = this.safeFilterNumber(native.soemdsp_sabrina_reverb_left?.(state.nativeHandle), null);
      const mixRight = this.safeFilterNumber(native.soemdsp_sabrina_reverb_right?.(state.nativeHandle), null);
      const outputPeak = Math.max(Math.abs(mixLeft), Math.abs(mixRight));
      if (outputPeak < 0.000001) {
        state.idleCounter += 1;
        if (state.idleCounter >= safeRate) {
          state.isIdle = true;
        }
      } else {
        state.idleCounter = 0;
      }
      return { "Left Dry": dryLeft, "Mono Dry": dryMono, "Right Dry": dryRight, "Left Mix": mixLeft, "Mono Mix": (mixLeft + mixRight) * 0.5, "Right Mix": mixRight };
    } catch (error) {
      this.nativeSabrinaReverbReady = false;
      if (state.nativeHandle && native.soemdsp_sabrina_reverb_destroy) {
        native.soemdsp_sabrina_reverb_destroy(state.nativeHandle);
      }
      state.nativeHandle = 0;
      state.nativeParamKey = "";
      state.idleCounter = 0;
      state.isIdle = false;
      this.port.postMessage({
        type: "nativeModuleStatus",
        name: "sabrina_reverb",
        status: "disabled",
        message: String(error?.message || error || "native Sabrina failed"),
      });
      return null;
    }
  }

  sabrinaReverbSample(state, leftInput, rightInput, params, rateHz = sampleRate, frame = 0) {
    const dryLeft = this.safeFilterNumber(leftInput, null);
    const dryRight = this.safeFilterNumber(rightInput, null);
    const nativeOutput = this.nativeSabrinaReverbSample(state, leftInput, rightInput, params, rateHz, frame);
    if (nativeOutput) {
      return nativeOutput;
    }
    // Native WASM SIMD module failed to instantiate (runtime without WASM
    // SIMD128 support) -- fall back to a JS port of the reverb's own scalar
    // reference algorithm instead of a dry passthrough.
    if (!state.jsState) {
      state.jsState = this.createSabrinaReverbJsState(rateHz);
    }
    return this.sabrinaReverbJsSample(state.jsState, dryLeft, dryRight, params, rateHz);
  }

  sampleHoldSample(state, input, trigger, threshold, sampleFrequency, sampleRate, hasInConnected, nodeId) {
    this.resetSeededState(state.noise, nodeId, 0, "sampleHoldNoise");
    const safeInput = hasInConnected
      ? this.safeFilterNumber(input, null)
      : this.nextSeededBipolar(state.noise);
    const safeTrigger = this.safeFilterNumber(trigger, null);
    const safeThreshold = this.safeFilterNumber(threshold, null);
    const safeFreq = Math.max(0, Number(sampleFrequency) || 0);
    const safeRate = Math.max(1, Number(sampleRate) || 44100);
    if (this.nativeSampleHoldReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeSampleHold.soemdsp_sample_hold_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeSampleHold.soemdsp_sample_hold_sample(
              state.nativeHandle,
              safeInput,
              safeTrigger,
              safeThreshold,
              safeFreq,
              safeRate,
            ),
            null,
          );
        }
      } catch (error) {
        this.nativeSampleHoldReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "sample_hold",
          status: "disabled",
          message: String(error?.message || error || "native Sample & Hold failed"),
        });
      }
    }
    let internalFire = false;
    if (safeFreq > 0) {
      state.clockPhase += safeFreq / safeRate;
      if (state.clockPhase >= 1) {
        state.clockPhase -= Math.floor(state.clockPhase);
        internalFire = true;
      }
    }
    if ((state.lastTrigger <= safeThreshold && safeTrigger > safeThreshold) || internalFire) {
      state.held = safeInput;
    }
    state.lastTrigger = safeTrigger;
    return this.safeFilterNumber(state.held, null);
  }

  stepSequencerSample(state, trigger, reset, params) {
    const safeTrigger = this.safeFilterNumber(trigger, null);
    const safeReset = this.safeFilterNumber(reset, null);
    const threshold = this.safeFilterNumber(params.threshold, null);
    const stepCount = Math.max(1, Math.min(8, Math.round(this.safeFilterNumber(params.steps, null))));
    const level = this.safeFilterNumber(params.level, null);
    const values = params.values.map((value) => this.safeFilterNumber(value, null));
    if (state.index >= stepCount) {
      state.index %= stepCount;
    }
    if (state.lastReset <= threshold && safeReset > threshold) {
      state.index = 0;
      state.out = values[0] || 0;
    }
    if (state.lastTrigger <= threshold && safeTrigger > threshold) {
      state.out = values[state.index] || 0;
      state.index = (state.index + 1) % stepCount;
    }
    state.gate = safeTrigger > threshold ? 1 : 0;
    state.lastTrigger = safeTrigger;
    state.lastReset = safeReset;
    return {
      Gate: state.gate,
      Out: this.safeFilterNumber(state.out * level, null),
    };
  }

  triggerCounterSample(state, trigger, reset, params, rate = sampleRate) {
    const safeTrigger = this.safeFilterNumber(trigger, null);
    const safeReset = this.safeFilterNumber(reset, null);
    const threshold = this.safeFilterNumber(params.threshold, null);
    const countMax = Math.max(1, this.safeFilterNumber(params.countMax, null));
    const increment = Math.max(0, this.safeFilterNumber(params.increment, null));
    const pulseTime = Math.max(0, this.safeFilterNumber(params.pulseTime, null));
    const level = this.safeFilterNumber(params.level, null);
    if (state.lastReset <= threshold && safeReset > threshold) {
      state.count = 0;
      state.remainingSamples = 0;
    }
    if (state.lastTrigger <= threshold && safeTrigger > threshold) {
      state.count += increment;
      if (state.count >= countMax) {
        state.count = countMax > 0 ? state.count % countMax : 0;
        state.remainingSamples = Math.max(1, Math.round(pulseTime * Math.max(1, rate)));
      }
    }
    state.lastTrigger = safeTrigger;
    state.lastReset = safeReset;
    const pulse = state.remainingSamples > 0 ? level : 0;
    state.remainingSamples = Math.max(0, state.remainingSamples - 1);
    return {
      Count: this.safeFilterNumber(this.clampValue(state.count / countMax, 0, 1) * level, null),
      Pulse: this.safeFilterNumber(pulse, null),
    };
  }

  triggerDividerSample(state, trigger, reset, params, rate = sampleRate) {
    const safeTrigger = this.safeFilterNumber(trigger, null);
    const safeReset = this.safeFilterNumber(reset, null);
    const threshold = this.safeFilterNumber(params.threshold, null);
    const division = Math.max(1, Math.min(64, Math.round(this.safeFilterNumber(params.division, null))));
    const pulseTime = Math.max(0, this.safeFilterNumber(params.pulseTime, null));
    const level = this.safeFilterNumber(params.level, null);
    if (state.lastReset <= threshold && safeReset > threshold) {
      state.count = 0;
      state.remainingSamples = 0;
    }
    if (state.lastTrigger <= threshold && safeTrigger > threshold) {
      state.count = (state.count + 1) % division;
      if (state.count === 0) {
        state.remainingSamples = Math.max(1, Math.round(pulseTime * Math.max(1, rate)));
      }
    }
    state.lastTrigger = safeTrigger;
    state.lastReset = safeReset;
    const output = state.remainingSamples > 0 ? level : 0;
    state.remainingSamples = Math.max(0, state.remainingSamples - 1);
    return this.safeFilterNumber(output, null);
  }

  exponentialCurve(value, skew) {
    const safeValue = this.clampValue(Number(value) || 0, 0, 1);
    const safeSkew = this.clampValue(Number(skew) || 0, -0.99, 0.99);
    if (safeSkew === 0) {
      return safeValue;
    }
    const c = 0.5 * (safeSkew + 1);
    const a = 2 * Math.log10((1 - c) / c);
    const denom = 1 - Math.exp(a);
    return denom === 0 ? safeValue : (1 - Math.exp(safeValue * a)) / denom;
  }

  pluckPrepareForDecay(state, rate, peak) {
    state.phasor = 0;
    state.autoReleasePhasor = 0;
    state.currentValue = peak;
    state.decayIncrement = (state.currentValue - 1) / Math.max(1, rate) / 50;
  }

  pluckTriggerAttack(state, params, rate) {
    const period = 1 / Math.max(1, rate);
    const velocity = this.clampValue(params.velocity, 0, 1);
    const sensitivity = this.clampValue(params.velocitySensitivity, 0, 1);
    const peak = (1 - sensitivity) + velocity * sensitivity;
    state.secondsPassed = 0;
    state.state = "delay";
    if (params.delayTime < period) {
      if (params.attackFeedback <= 1e-8) {
        state.state = "decay";
        this.pluckPrepareForDecay(state, rate, peak);
      } else {
        state.state = "attack";
      }
    }
    state.peak = peak;
  }

  pluckTriggerRelease(state, rate) {
    if (state.state !== "release") {
      state.state = "release";
      state.releaseIncrement = state.currentValue / Math.max(1, rate) / 50;
    }
  }

  pluckDecayFeedback(state, params) {
    let finalDecayMod = params.endingDecay;
    if (state.phasor < 1) {
      const shaped = this.exponentialCurve(state.phasor, params.decayModCurve || -1e-8);
      finalDecayMod = params.decay + params.decayModStart + shaped * (params.decayModEnd - params.decayModStart);
    }
    return Math.min(1 - 1e-6, Math.exp(-finalDecayMod * 10));
  }

  pluckEnvelopeSample(state, trigger, release, params, rate = sampleRate) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const period = 1 / safeRate;
    const safeTrigger = this.safeFilterNumber(trigger, null);
    const safeRelease = this.safeFilterNumber(release, null);
    const read = (key, fallback, min = -Infinity, max = Infinity) => this.clampValue(
      this.safeFilterNumber(params[key] ?? fallback, null),
      min,
      max,
    );
    const values = {
      attackFeedback: read("attackFeedback", 0.002, 0),
      autoReleaseTime: read("autoReleaseTime", 0.08, 0),
      decay: read("decay", 0.35, 0.1, 1),
      decayModCurve: read("decayModCurve", 0, -1, 1),
      decayModEnd: read("decayModEnd", 0.55, 0.01, 3),
      decayModFrequency: read("decayModFrequency", 1.5, 0, 100),
      decayModStart: read("decayModStart", 0.08, 0.001, 1.8),
      delayTime: read("delayTime", 0, 0),
      endingDecay: read("endingDecay", 0.8, 0, 1.4),
      level: read("level", 1, 0, 1),
      releaseFeedback: read("releaseFeedback", 0.35, 0, 1),
      velocity: read("velocity", 1, 0, 1),
      velocitySensitivity: read("velocitySensitivity", 0, 0, 1),
    };

    if (this.nativePluckEnvelopeReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativePluckEnvelope.soemdsp_pluck_envelope_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativePluckEnvelope.soemdsp_pluck_envelope_sample(
              state.nativeHandle,
              safeTrigger,
              safeRelease,
              values.attackFeedback,
              values.autoReleaseTime,
              values.decay,
              values.decayModCurve,
              values.decayModEnd,
              values.decayModFrequency,
              values.decayModStart,
              values.delayTime,
              values.endingDecay,
              values.level,
              values.releaseFeedback,
              values.velocity,
              values.velocitySensitivity,
              safeRate,
            ),
            null,
          );
        }
      } catch (error) {
        this.nativePluckEnvelopeReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "pluck_envelope",
          status: "disabled",
          message: String(error?.message || error || "native Pluck Envelope failed"),
        });
      }
    }

    if (state.lastTrigger <= 0 && safeTrigger > 0) {
      this.pluckTriggerAttack(state, values, safeRate);
    }
    if (state.lastRelease <= 0 && safeRelease > 0) {
      this.pluckTriggerRelease(state, safeRate);
    }
    state.lastTrigger = safeTrigger;
    state.lastRelease = safeRelease;

    const attackFeedbackAmp = 1 / (Math.max(values.attackFeedback, 1e-8) * safeRate);
    const releaseFeedbackAmp = Math.min(1 - 1e-6, Math.exp(-values.releaseFeedback * 10));
    const autoReleaseIncrement = values.autoReleaseTime <= 1e-8
      ? 0
      : 1 / (Math.max(values.autoReleaseTime, 1e-8) * safeRate);
    const phasorIncrement = values.decayModFrequency / safeRate;

    switch (state.state) {
      case "delay":
        state.secondsPassed += period;
        if (state.secondsPassed >= values.delayTime) {
          state.state = "attack";
        }
        break;
      case "attack":
        state.currentValue += period + state.currentValue * attackFeedbackAmp;
        if (state.currentValue >= state.peak) {
          state.state = "decay";
          this.pluckPrepareForDecay(state, safeRate, state.peak);
        }
        break;
      case "decay":
        state.currentValue -= state.decayIncrement + state.currentValue * state.currentValue * this.pluckDecayFeedback(state, values);
        state.phasor += phasorIncrement;
        state.autoReleasePhasor += autoReleaseIncrement;
        if (autoReleaseIncrement > 0 && state.autoReleasePhasor >= 1) {
          this.pluckTriggerRelease(state, safeRate);
        }
        if (state.currentValue < 0) {
          state.currentValue = 0;
          state.secondsPassed = 0;
          state.phasor = 0;
          state.autoReleasePhasor = 0;
          state.state = "off";
        }
        break;
      case "release":
        state.currentValue -= state.releaseIncrement + state.currentValue * state.currentValue * releaseFeedbackAmp;
        if (state.currentValue <= 0) {
          state.currentValue = 0;
          state.secondsPassed = 0;
          state.phasor = 0;
          state.autoReleasePhasor = 0;
          state.state = "off";
        }
        break;
      case "off":
      default:
        break;
    }
    return this.safeFilterNumber(state.currentValue * values.level, null);
  }

  seededKey(nodeId, seed, salt) {
    return `${nodeId}.${salt}.${Math.max(0, Math.round(Number(seed) || 0))}`;
  }

  resetSeededState(state, nodeId, seed, salt) {
    const key = this.seededKey(nodeId, seed, salt);
    if (state.seedKey !== key) {
      state.seedKey = key;
      state.seed = this.stableSeed(key);
      state.gaussianSpare = null;
      state.brown = 0;
      state.pink = [0, 0, 0, 0, 0, 0, 0];
      if ("out" in state) {
        state.out = 0;
      }
      if (state.lowpass) {
        state.lowpass.outputBuffer = 0;
      }
    }
  }

  nextSeededUnipolar(state) {
    state.seed = (Math.imul(1664525, state.seed || 0x12345678) + 1013904223) >>> 0;
    return state.seed / 0xffffffff;
  }

  nextSeededBipolar(state) {
    return this.nextSeededUnipolar(state) * 2 - 1;
  }

  nextSeededGaussian(state) {
    if (state.gaussianSpare !== null && state.gaussianSpare !== undefined) {
      const spare = state.gaussianSpare;
      state.gaussianSpare = null;
      return spare;
    }
    const u1 = Math.max(1e-12, this.nextSeededUnipolar(state));
    const u2 = this.nextSeededUnipolar(state);
    const magnitude = Math.sqrt(-2 * Math.log(u1));
    const angle = Math.PI * 2 * u2;
    state.gaussianSpare = magnitude * Math.sin(angle);
    return magnitude * Math.cos(angle);
  }

  noiseGeneratorChannelSample(chanState, mode, mean, deviation) {
    const white = this.nextSeededBipolar(chanState);
    if (mode === 1) {
      return mean + this.nextSeededGaussian(chanState) * deviation;
    }
    if (mode === 2) {
      chanState.brown = this.clampValue(chanState.brown + white * Math.max(0.001, deviation) * 0.05, -1, 1);
      return mean + chanState.brown;
    }
    if (mode === 3) {
      chanState.pink[0] = 0.99886 * chanState.pink[0] + white * 0.0555179;
      chanState.pink[1] = 0.99332 * chanState.pink[1] + white * 0.0750759;
      chanState.pink[2] = 0.969   * chanState.pink[2] + white * 0.153852;
      chanState.pink[3] = 0.8665  * chanState.pink[3] + white * 0.3104856;
      chanState.pink[4] = 0.55    * chanState.pink[4] + white * 0.5329522;
      chanState.pink[5] = -0.7616 * chanState.pink[5] - white * 0.016898;
      const out = mean + (chanState.pink[0] + chanState.pink[1] + chanState.pink[2] + chanState.pink[3] + chanState.pink[4] + chanState.pink[5] + chanState.pink[6] + white * 0.5362) * 0.11;
      chanState.pink[6] = white * 0.115926;
      return out;
    }
    if (mode === 4) {
      return Math.abs(white) > 0.94 ? mean + Math.sign(white) * deviation : mean;
    }
    return mean + white * deviation;
  }

  noiseGeneratorSample(state, params, nodeId) {
    const mode = Math.max(0, Math.min(4, Math.round(this.safeFilterNumber(params.mode, null))));
    const mean = this.safeFilterNumber(params.mean, null);
    const deviation = Math.max(0, this.safeFilterNumber(params.deviation, null));
    const level = this.safeFilterNumber(params.level, null);
    const seed = this.safeFilterNumber(params.seed, null);
    if (this.nativeNoiseGeneratorReady) {
      if (!state.nativeHandle) {
        state.nativeHandle = this.nativeNoiseGenerator.soemdsp_noise_generator_create();
        if (state.blockCache) {
          state.blockCache.cursor = 0;
          state.blockCache.size = 0;
        }
      }
      if (state.nativeHandle) {
        if (this.nativeNoiseGenerator.soemdsp_noise_generator_process_block) {
          const cache = state.blockCache || (state.blockCache = { cursor: 0, size: 0, left: null, right: null });
          if (cache.cursor >= cache.size) {
            const blockSize = NodeLiveAudioProcessor.NOISE_NATIVE_BLOCK_SIZE;
            this.nativeNoiseGenerator.soemdsp_noise_generator_process_block(state.nativeHandle, seed, mode, mean, deviation, level, blockSize, 1);
            const memory = this.nativeNoiseGenerator.memory;
            const leftPtr = this.nativeNoiseGenerator.soemdsp_noise_generator_block_output_left_ptr(state.nativeHandle);
            const rightPtr = this.nativeNoiseGenerator.soemdsp_noise_generator_block_output_right_ptr(state.nativeHandle);
            cache.left = new Float64Array(memory.buffer, leftPtr, blockSize);
            cache.right = new Float64Array(memory.buffer, rightPtr, blockSize);
            cache.size = blockSize;
            cache.cursor = 0;
          }
          const index = cache.cursor;
          cache.cursor += 1;
          return {
            "Left Out": this.safeFilterNumber(cache.left[index], null),
            "Right Out": this.safeFilterNumber(cache.right[index], null),
          };
        }
        this.nativeNoiseGenerator.soemdsp_noise_generator_sample(state.nativeHandle, seed, mode, mean, deviation, level);
        return {
          "Left Out": this.safeFilterNumber(this.nativeNoiseGenerator.soemdsp_noise_generator_left(state.nativeHandle), null),
          "Right Out": this.safeFilterNumber(this.nativeNoiseGenerator.soemdsp_noise_generator_right(state.nativeHandle), null),
        };
      }
    }
    this.resetSeededState(state.left, `${nodeId}:left`, seed, "noiseGenerator");
    this.resetSeededState(state.right, `${nodeId}:right`, seed, "noiseGenerator");
    const left = this.safeFilterNumber(this.clampValue(this.noiseGeneratorChannelSample(state.left, mode, mean, deviation), -1, 1) * level, null);
    const right = this.safeFilterNumber(this.clampValue(this.noiseGeneratorChannelSample(state.right, mode, mean, deviation), -1, 1) * level, null);
    return { "Left Out": left, "Right Out": right };
  }

  rationalCurve(value, skew) {
    const t = this.clampValue(Number(value) || 0, 0, 1);
    const safeSkew = this.clampValue(Number(skew) || 0, -0.999, 0.999);
    return ((1 + safeSkew) * t) / (1 - safeSkew + 2 * safeSkew * t);
  }

  randomWalkSample(state, params, rate = sampleRate, nodeId = "") {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    if (this.nativeRandomWalkReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeRandomWalk.soemdsp_random_walk_create();
        }
        if (state.nativeHandle) {
          const seedHash = this.stableSeed(this.seededKey(nodeId, params.seed, "randomWalk"));
          return this.safeFilterNumber(
            this.nativeRandomWalk.soemdsp_random_walk_sample(
              state.nativeHandle,
              Math.max(0, Math.min(3, Math.round(this.safeFilterNumber(params.method, null)))),
              Math.max(0, this.safeFilterNumber(params.frequency, null)),
              Math.max(0, this.safeFilterNumber(params.jitter, null)),
              this.safeFilterNumber(params.level, null),
              seedHash,
              safeRate,
            ),
            null,
          );
        }
      } catch (error) {
        this.nativeRandomWalkReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "random_walk",
          status: "disabled",
          message: String(error?.message || error || "native Random Walk failed"),
        });
      }
    }
    this.resetSeededState(state, nodeId, params.seed, "randomWalk");
    const method = Math.max(0, Math.min(3, Math.round(this.safeFilterNumber(params.method, null))));
    const frequency = Math.max(0, this.safeFilterNumber(params.frequency, null));
    const jitter = Math.max(0, this.safeFilterNumber(params.jitter, null));
    const level = this.safeFilterNumber(params.level, null);
    const noise = this.nextSeededBipolar(state);
    const increment = this.clampValue(frequency / safeRate, 0, 1);
    const jitterInc = this.clampValue(jitter / safeRate, 0, 1);
    const stepSize = this.clampValue(increment + this.rationalCurve(jitterInc, 0.99), 0, 1);
    const averageIncrement = (jitterInc + increment) * 0.5;
    const whiteNoiseMix = averageIncrement >= 0.9
      ? this.rationalCurve((averageIncrement - 0.9) / 0.1, -0.7)
      : 0;
    const randomMix = 1 - whiteNoiseMix;

    if (method === 0) {
      return this.safeFilterNumber(noise * level, null);
    }
    if (method === 1) {
      return this.onePoleLowpassSample(state.lowpass, noise, frequency, safeRate) * level;
    }
    const step = method === 3 ? (noise > 0 ? stepSize : -stepSize) : noise * stepSize;
    state.out = this.clampValue(state.out + step, -1, 1);
    const mixed = state.out * randomMix + noise * whiteNoiseMix;
    return this.safeFilterNumber(this.onePoleLowpassSample(state.lowpass, mixed, frequency, safeRate) * level, null);
  }

  hashBipolar(index, seed) {
    let value = (Math.trunc(index) ^ Math.trunc(seed)) >>> 0;
    value = Math.imul(value ^ (value >>> 16), 2246822507) >>> 0;
    value = Math.imul(value ^ (value >>> 13), 3266489909) >>> 0;
    value = (value ^ (value >>> 16)) >>> 0;
    return (value / 0xffffffff) * 2 - 1;
  }

  smoothNoise1d(x, seed) {
    const left = Math.floor(x);
    const frac = x - left;
    const smooth = frac * frac * (3 - 2 * frac);
    const a = this.hashBipolar(left, seed);
    const b = this.hashBipolar(left + 1, seed);
    return a + (b - a) * smooth;
  }

  fractalBrownianNoiseAxisState(state, axis) {
    const key = String(axis || "x");
    if (!state.axes || typeof state.axes !== "object") {
      state.axes = {};
    }
    if (!state.axes[key]) {
      state.axes[key] = { seedKey: "", time: 0 };
    }
    return state.axes[key];
  }

  fractalBrownianNoiseSample(state, params, rate = sampleRate, nodeId = "", axis = "x", options = {}) {
    const axisState = this.fractalBrownianNoiseAxisState(state, axis);
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const seed = Math.max(0, Math.round(this.safeFilterNumber(params.seed, null)));
    const seedKey = this.seededKey(nodeId, seed, `fractalBrownianNoise:${axis}`);
    if (axisState.seedKey !== seedKey) {
      axisState.seedKey = seedKey;
      axisState.time = 0;
    }
    const frequency = Math.max(0, this.safeFilterNumber(params.frequency, null));
    const octaves = Math.max(1, Math.min(8, Math.round(this.safeFilterNumber(params.octaves, null))));
    const persistence = this.clampValue(this.safeFilterNumber(params.persistence, null), 0, 0.99);
    const scale = Math.max(0.000001, this.safeFilterNumber(params.scale, null));
    const level = this.safeFilterNumber(params.level, null);
    let total = 0;
    let amplitude = 1;
    let noiseFrequency = 1;
    let maxValue = 0;
    const baseSeed = this.stableSeed(seedKey);
    for (let i = 0; i < octaves; i += 1) {
      total += this.smoothNoise1d(axisState.time * scale * noiseFrequency, baseSeed + i * 1013) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      noiseFrequency *= 2;
    }
    axisState.time += frequency / safeRate;
    const normalized = maxValue > 0 ? total / maxValue : 0;
    return this.safeFilterNumber(options.raw ? normalized : normalized * level, null);
  }

  fractalBrownianNoiseVector(state, params, rate = sampleRate, nodeId = "", reset = 0) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const resetHigh = Number(reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      this.resetFractalBrownianNoiseState(state);
    }
    state.resetWasHigh = resetHigh;
    if (this.nativeFbmReady) {
      if (!state.nativeHandle) {
        state.nativeHandle = this.nativeFbm.soemdsp_fbm_create();
        // A stale cache here would replay up to one block's worth of
        // samples read from a detached WASM memory buffer belonging to a
        // module instance that no longer exists -- most likely after a
        // native-module hot-reload (see the "fractal_brownian_noise"
        // reload handler above, which destroys the handle but doesn't
        // touch this Map entry). Matches the same reset already applied
        // in noiseGeneratorSample.
        if (state.blockCache) {
          state.blockCache.cursor = 0;
          state.blockCache.size = 0;
        }
      }
      if (state.nativeHandle && this.nativeFbm?.soemdsp_fbm_process_block) {
        const cache = state.blockCache;
        if (cache.cursor >= cache.size) {
          // Block-processing boundary: resolve params ONCE for the whole
          // block instead of once per sample, run the native block kernel
          // (SIMD internally), and cache the results for the next
          // FBM_NATIVE_BLOCK_SIZE reads. Params are frozen for the
          // duration of one cached block (128 samples, ~2.9ms @ 44.1kHz) --
          // the standard block-rate tradeoff, well below audible for a
          // slowly-evolving noise generator like FBM.
          const seed = Math.max(0, Math.round(this.safeFilterNumber(params.seed, null)));
          const octaves = Math.max(1, Math.min(8, Math.round(this.safeFilterNumber(params.octaves, null))));
          const persistence = this.clampValue(this.safeFilterNumber(params.persistence, null), 0, 0.99);
          const scale = Math.max(0.000001, this.safeFilterNumber(params.scale, null));
          const frequency = Math.max(0, this.safeFilterNumber(params.frequency, null));
          const level = this.safeFilterNumber(params.level, null);
          const blockSize = NodeLiveAudioProcessor.FBM_NATIVE_BLOCK_SIZE;
          this.nativeFbm.soemdsp_fbm_process_block(state.nativeHandle, seed, octaves, persistence, scale, frequency, level, safeRate, blockSize, 1);
          const memory = this.nativeFbm.memory;
          const xPtr = this.nativeFbm.soemdsp_fbm_block_output_x_ptr(state.nativeHandle);
          const yPtr = this.nativeFbm.soemdsp_fbm_block_output_y_ptr(state.nativeHandle);
          const zPtr = this.nativeFbm.soemdsp_fbm_block_output_z_ptr(state.nativeHandle);
          const xRawPtr = this.nativeFbm.soemdsp_fbm_block_output_x_raw_ptr(state.nativeHandle);
          const yRawPtr = this.nativeFbm.soemdsp_fbm_block_output_y_raw_ptr(state.nativeHandle);
          const zRawPtr = this.nativeFbm.soemdsp_fbm_block_output_z_raw_ptr(state.nativeHandle);
          cache.x = new Float64Array(memory.buffer, xPtr, blockSize);
          cache.y = new Float64Array(memory.buffer, yPtr, blockSize);
          cache.z = new Float64Array(memory.buffer, zPtr, blockSize);
          cache.xRaw = new Float64Array(memory.buffer, xRawPtr, blockSize);
          cache.yRaw = new Float64Array(memory.buffer, yRawPtr, blockSize);
          cache.zRaw = new Float64Array(memory.buffer, zRawPtr, blockSize);
          cache.size = blockSize;
          cache.cursor = 0;
        }
        const index = cache.cursor;
        cache.cursor += 1;
        const outX = this.safeFilterNumber(cache.x[index], null);
        const outY = this.safeFilterNumber(cache.y[index], null);
        const outZ = this.safeFilterNumber(cache.z[index], null);
        return {
          "Out X": outX,
          "Out Y": outY,
          "Out Z": outZ,
          "Out X Raw": this.safeFilterNumber(cache.xRaw[index], null),
          "Out Y Raw": this.safeFilterNumber(cache.yRaw[index], null),
          "Out Z Raw": this.safeFilterNumber(cache.zRaw[index], null),
        };
      }
      if (state.nativeHandle) {
        const seed = Math.max(0, Math.round(this.safeFilterNumber(params.seed, null)));
        const octaves = Math.max(1, Math.min(8, Math.round(this.safeFilterNumber(params.octaves, null))));
        const persistence = this.clampValue(this.safeFilterNumber(params.persistence, null), 0, 0.99);
        const scale = Math.max(0.000001, this.safeFilterNumber(params.scale, null));
        const frequency = Math.max(0, this.safeFilterNumber(params.frequency, null));
        const level = this.safeFilterNumber(params.level, null);
        this.nativeFbm.soemdsp_fbm_sample(state.nativeHandle, seed, octaves, persistence, scale, frequency, level, safeRate);
        const rawX = this.nativeFbm.soemdsp_fbm_x_raw?.(state.nativeHandle);
        const rawY = this.nativeFbm.soemdsp_fbm_y_raw?.(state.nativeHandle);
        const rawZ = this.nativeFbm.soemdsp_fbm_z_raw?.(state.nativeHandle);
        return {
          "Out X": this.safeFilterNumber(this.nativeFbm.soemdsp_fbm_x(state.nativeHandle), null),
          "Out Y": this.safeFilterNumber(this.nativeFbm.soemdsp_fbm_y(state.nativeHandle), null),
          "Out Z": this.safeFilterNumber(this.nativeFbm.soemdsp_fbm_z(state.nativeHandle), null),
          "Out X Raw": this.safeFilterNumber(rawX ?? this.nativeFbm.soemdsp_fbm_x(state.nativeHandle), null),
          "Out Y Raw": this.safeFilterNumber(rawY ?? this.nativeFbm.soemdsp_fbm_y(state.nativeHandle), null),
          "Out Z Raw": this.safeFilterNumber(rawZ ?? this.nativeFbm.soemdsp_fbm_z(state.nativeHandle), null),
        };
      }
    }
    const rawX = this.fractalBrownianNoiseSample(state, params, safeRate, nodeId, "x", { raw: true });
    const rawY = this.fractalBrownianNoiseSample(state, params, safeRate, nodeId, "y", { raw: true });
    const rawZ = this.fractalBrownianNoiseSample(state, params, safeRate, nodeId, "z", { raw: true });
    const level = this.safeFilterNumber(params.level, null);
    return {
      "Out X": this.safeFilterNumber(rawX * level, null),
      "Out Y": this.safeFilterNumber(rawY * level, null),
      "Out Z": this.safeFilterNumber(rawZ * level, null),
      "Out X Raw": rawX,
      "Out Y Raw": rawY,
      "Out Z Raw": rawZ,
    };
  }

  expAdsrCalcCoef(rate, targetRatio) {
    const safeRate = Math.max(0, Number(rate) || 0);
    const safeRatio = Math.max(0.000000001, Number(targetRatio) || 0.000000001);
    return safeRate <= 0 ? 0 : Math.exp(-Math.log((1 + safeRatio) / safeRatio) / safeRate);
  }

  expAdsrTriggerAttack(state, delay, attack, rate = sampleRate) {
    const period = 1 / Math.max(1, rate);
    if (delay < period) {
      if (attack <= period) {
        state.state = "decay";
        state.out = 1;
      } else {
        state.state = "attack";
      }
      return;
    }
    if (state.out <= 0.000001) {
      state.out = 0;
      state.secondsPassed = 0;
    }
    state.state = "delay";
  }

  expAdsrSample(state, gate, params, rate = sampleRate) {
    const safeGate = this.safeFilterNumber(gate, null);
    const delay = Math.max(0, this.safeFilterNumber(params.delay, null));
    const attack = Math.max(0, this.safeFilterNumber(params.attack, null));
    const decay = Math.max(0, this.safeFilterNumber(params.decay, null));
    const sustain = this.clampValue(this.safeFilterNumber(params.sustain, null), 0, 1);
    const release = Math.max(0, this.safeFilterNumber(params.release, null));
    const attackShape = Math.max(0.000000001, this.safeFilterNumber(params.attackShape, null));
    const releaseShape = Math.max(0.000000001, this.safeFilterNumber(params.releaseShape, null));
    const level = this.safeFilterNumber(params.level, null);
    const looping = this.safeFilterNumber(params.loop, null) >= 0.5;
    const safeRate = Math.max(1, rate || sampleRate || 44100);
    const period = 1 / safeRate;

    if (this.nativeExpAdsrReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeExpAdsr.soemdsp_exp_adsr_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeExpAdsr.soemdsp_exp_adsr_sample(
              state.nativeHandle,
              safeGate,
              delay,
              attack,
              decay,
              sustain,
              release,
              attackShape,
              releaseShape,
              level,
              looping ? 1 : 0,
              safeRate,
            ),
            null,
          );
        }
      } catch (error) {
        this.nativeExpAdsrReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "exp_adsr",
          status: "disabled",
          message: String(error?.message || error || "native Exp ADSR failed"),
        });
      }
    }

    if (state.lastGate <= 0 && safeGate > 0) {
      this.expAdsrTriggerAttack(state, delay, attack, safeRate);
    } else if (state.lastGate > 0 && safeGate <= 0) {
      state.state = "release";
    }
    state.lastGate = safeGate;

    const attackCoef = this.expAdsrCalcCoef(attack * safeRate, attackShape);
    const decayCoef = this.expAdsrCalcCoef(decay * safeRate, releaseShape);
    const releaseCoef = this.expAdsrCalcCoef(release * safeRate, releaseShape);
    const attackBase = (1 + attackShape) * (1 - attackCoef);
    const decayBase = (sustain - releaseShape) * (1 - decayCoef);
    const releaseBase = -releaseShape * (1 - releaseCoef);

    switch (state.state) {
      case "delay":
        state.secondsPassed += period;
        if (state.secondsPassed >= delay) {
          state.state = attack <= period ? "decay" : "attack";
          state.secondsPassed = 0;
          if (attack <= period) {
            state.out = 1;
          }
        }
        break;
      case "attack":
        state.out = attackBase + state.out * attackCoef;
        if (state.out >= 1) {
          state.out = 1;
          state.state = "decay";
        }
        break;
      case "decay":
        state.out = decayBase + state.out * decayCoef;
        if (state.out <= sustain) {
          state.out = sustain;
          state.state = "sustain";
        }
        break;
      case "sustain":
        state.out = sustain;
        if (looping) {
          this.expAdsrTriggerAttack(state, delay, attack, safeRate);
        }
        break;
      case "release":
        state.out = releaseBase + state.out * releaseCoef;
        if (state.out <= 0) {
          state.out = 0;
          state.state = "off";
        }
        break;
      case "off":
      default:
        state.out = 0;
        break;
    }

    return this.safeFilterNumber(state.out * level, null);
  }

  linearEnvelopeTriggerAttack(state, delay, attack, rate = sampleRate) {
    const period = 1 / Math.max(1, rate);
    if (delay < period) {
      if (attack <= period) {
        state.state = "decay";
        state.out = 1;
      } else {
        state.state = "attack";
      }
      return;
    }
    if (state.out <= 0.000001) {
      state.out = 0;
      state.secondsPassed = 0;
    }
    state.state = "delay";
  }

  linearEnvelopeSample(state, gate, params, rate = sampleRate) {
    const safeGate = this.safeFilterNumber(gate, null);
    const delay = Math.max(0, this.safeFilterNumber(params.delay, null));
    const attack = Math.max(0, this.safeFilterNumber(params.attack, null));
    const decay = Math.max(0, this.safeFilterNumber(params.decay, null));
    const sustain = this.clampValue(this.safeFilterNumber(params.sustain, null), 0, 1);
    const release = Math.max(0, this.safeFilterNumber(params.release, null));
    const level = this.safeFilterNumber(params.level, null);
    const looping = this.safeFilterNumber(params.loop, null) >= 0.5;
    const safeRate = Math.max(1, rate || sampleRate || 44100);
    const period = 1 / safeRate;

    if (this.nativeLinearEnvelopeReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeLinearEnvelope.soemdsp_linear_envelope_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeLinearEnvelope.soemdsp_linear_envelope_sample(
              state.nativeHandle,
              safeGate,
              delay,
              attack,
              decay,
              sustain,
              release,
              level,
              looping ? 1 : 0,
              safeRate,
            ),
            null,
          );
        }
      } catch (error) {
        this.nativeLinearEnvelopeReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "linear_envelope",
          status: "disabled",
          message: String(error?.message || error || "native Linear Envelope failed"),
        });
      }
    }

    if (state.lastGate <= 0 && safeGate > 0) {
      this.linearEnvelopeTriggerAttack(state, delay, attack, safeRate);
    } else if (state.lastGate > 0 && safeGate <= 0) {
      state.state = "release";
      state.releaseDecrement = state.out * period / Math.max(release, period);
    }
    state.lastGate = safeGate;

    const attackIncrement = Math.min(period / Math.max(attack, period), 1);
    const decayDecrement = (1 - sustain) * period / Math.max(decay, period);

    switch (state.state) {
      case "delay":
        state.secondsPassed += period;
        if (state.secondsPassed >= delay) {
          state.state = attack <= period ? "decay" : "attack";
          state.secondsPassed = 0;
          if (attack <= period) {
            state.out = 1;
          }
        }
        break;
      case "attack":
        state.out += attackIncrement;
        if (state.out >= 1) {
          state.out = 1;
          state.state = "decay";
        }
        break;
      case "decay":
        state.out -= decayDecrement;
        if (state.out <= sustain) {
          state.out = sustain;
          state.state = "sustain";
        }
        break;
      case "sustain":
        if (looping) {
          state.state = "attack";
        }
        state.out = sustain;
        break;
      case "release":
        state.out -= state.releaseDecrement;
        if (state.out <= 0) {
          state.out = 0;
          state.state = "off";
          state.secondsPassed = 0;
        }
        break;
      case "off":
      default:
        break;
    }

    return this.safeFilterNumber(this.clampValue(state.out, 0, 1) * level, null);
  }

  vactrolEnvelopeCoefficient(seconds, rate = sampleRate) {
    const time = Number(seconds);
    if (!Number.isFinite(time) || time <= 0) {
      return 1;
    }
    const samples = Math.max(1, time * Math.max(1, rate || sampleRate || 44100));
    return 1 - Math.exp(-1 / samples);
  }

  destroyVactrolEnvelopeNativeState(state) {
    if (state?.nativeHandle && this.nativeVactrolEnvelope?.soemdsp_vactrol_envelope_destroy) {
      this.nativeVactrolEnvelope.soemdsp_vactrol_envelope_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  destroyLogisticMapNativeState(state) {
    if (state?.nativeHandle && this.nativeLogisticMap?.soemdsp_logistic_map_destroy) {
      this.nativeLogisticMap.soemdsp_logistic_map_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  destroyPolyBlepNativeState(state) {
    if (state?.nativeHandle && this.nativePolyBlep?.soemdsp_polyblep_destroy) {
      this.nativePolyBlep.soemdsp_polyblep_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  vactrolEnvelopeSample(state, light, params, rate = sampleRate) {
    const safeRate = Math.max(1, rate || sampleRate || 44100);
    if (this.nativeVactrolEnvelopeReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeVactrolEnvelope.soemdsp_vactrol_envelope_create();
        }
        if (state.nativeHandle) {
          const out = this.nativeVactrolEnvelope.soemdsp_vactrol_envelope_sample(
            state.nativeHandle,
            this.safeFilterNumber(light, null),
            Math.max(0, this.safeFilterNumber(params.attack, null)),
            Math.max(0, this.safeFilterNumber(params.release, null)),
            Math.max(0.001, this.safeFilterNumber(params.curve, null)),
            Math.max(0, this.safeFilterNumber(params.sensitivity, null)),
            this.clampValue(this.safeFilterNumber(params.lightOffset, null), 0, 1),
            this.clampValue(this.safeFilterNumber(params.darkCurrent, null), 0, 1),
            safeRate,
          );
          state.out = this.safeFilterNumber(out, null);
          return state.out;
        }
      } catch (error) {
        this.nativeVactrolEnvelopeReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "vactrol_envelope",
          status: "disabled",
          message: String(error?.message || error || "native Vactrol Envelope failed"),
        });
      }
    }
    return this.vactrolEnvelopeSampleJs(state, light, params, safeRate);
  }

  vactrolEnvelopeSampleJs(state, light, params, rate = sampleRate) {
    const safeLight = this.safeFilterNumber(light, null);
    const attack = Math.max(0, this.safeFilterNumber(params.attack, null));
    const release = Math.max(0, this.safeFilterNumber(params.release, null));
    const curve = Math.max(0.001, this.safeFilterNumber(params.curve, null));
    const sensitivity = Math.max(0, this.safeFilterNumber(params.sensitivity, null));
    const lightOffset = this.clampValue(this.safeFilterNumber(params.lightOffset, null), 0, 1);
    const darkCurrent = this.clampValue(this.safeFilterNumber(params.darkCurrent, null), 0, 1);
    const safeRate = Math.max(1, rate || sampleRate || 44100);
    const target = this.clampValue(safeLight * sensitivity + lightOffset, 0, 1);
    const coefficient = target > state.raw
      ? this.vactrolEnvelopeCoefficient(attack, safeRate)
      : this.vactrolEnvelopeCoefficient(release, safeRate);
    state.raw += (target - state.raw) * coefficient;
    const shaped = Math.pow(this.clampValue(state.raw, 0, 1), curve);
    state.out = this.clampValue(darkCurrent + shaped * (1 - darkCurrent), 0, 1);
    return this.safeFilterNumber(state.out, null);
  }

  flowerChildSecondsToSamples(seconds, rate = sampleRate) {
    const time = Number(seconds);
    if (!Number.isFinite(time) || time <= 0) {
      return 1;
    }
    return Math.max(1, time * Math.max(1, rate || sampleRate || 44100));
  }

  flowerChildEnvelopeFollowerSample(state, input, params, rate = sampleRate) {
    if (this.nativeFlowerChildEnvelopeFollowerReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeFlowerChildEnvelopeFollower.soemdsp_flower_child_envelope_follower_create();
        }
        if (state.nativeHandle) {
          return this.safeFilterNumber(
            this.nativeFlowerChildEnvelopeFollower.soemdsp_flower_child_envelope_follower_sample(
              state.nativeHandle,
              this.safeFilterNumber(input, null),
              this.safeFilterNumber(params.attack, null),
              this.safeFilterNumber(params.hold, null),
              this.safeFilterNumber(params.decay, null),
              Math.max(1, Number(rate) || sampleRate || 44100),
            ),
            null,
          );
        }
      } catch (error) {
        this.nativeFlowerChildEnvelopeFollowerReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "flower_child_envelope_follower",
          status: "disabled",
          message: String(error?.message || error || "native Flower Child Envelope Follower failed"),
        });
      }
    }
    const target = this.clampValue(Math.abs(this.safeFilterNumber(input, null)), 0, 1);
    const attackSamples = this.flowerChildSecondsToSamples(this.safeFilterNumber(params.attack, null), rate);
    const holdSamples = this.flowerChildSecondsToSamples(this.safeFilterNumber(params.hold, null), rate);
    const decaySamples = this.flowerChildSecondsToSamples(this.safeFilterNumber(params.decay, null), rate);
    const attackStep = 1 / attackSamples;
    const decayStep = 1 / decaySamples;
    const current = this.clampValue(Number(state.currentSlewedValue) || 0, 0, 1);
    if (target >= current) {
      state.currentSlewedValue = Math.min(target, current + attackStep);
      state.holdCounter = holdSamples;
    } else if ((Number(state.holdCounter) || 0) > 0) {
      state.holdCounter = Math.max(0, (Number(state.holdCounter) || 0) - 1);
      state.currentSlewedValue = current;
    } else {
      state.currentSlewedValue = Math.max(target, current - decayStep);
    }
    state.out = this.safeFilterNumber(this.clampValue(state.currentSlewedValue, 0, 1), null);
    return state.out;
  }

  createSpiralState() {
    return {
      morph: 0,
      phase: 0,
      position: 0,
      rotX: 0,
      rotY: 0,
      zHistory: 0,
    };
  }

  createFractalSpiralState() {
    return {
      phase: 0,
      spinPhase: 0,
    };
  }

  fractalSpiralWrap01(value) {
    return value - Math.floor(value);
  }

  // Self-affine Weierstrass-style fractal spiral -- see
  // public/node-graph-fractal-spiral.js for the full derivation. Mirrors
  // that file exactly.
  fractalSpiralSample(state, options = {}) {
    const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const spin = Number(options.spin) || 0;
    const size = Math.max(0, Number(options.size) || 0);
    const growth = Number(options.growth) || 0;
    const gain = Math.max(0.001, Math.min(0.98, Number(options.gain)));
    const lacunarity = Math.max(1.0001, Number(options.lacunarity) || 1);
    const octaveCount = Math.max(1, Math.min(16, Math.round(Number(options.octaves) || 1)));
    const twist = Number(options.twist) || 0;

    const mainPhase = this.fractalSpiralWrap01(state.phase);
    state.phase = this.fractalSpiralWrap01(state.phase + frequency / sampleRateValue);
    const spinPhaseValue = this.fractalSpiralWrap01(state.spinPhase);
    state.spinPhase = this.fractalSpiralWrap01(state.spinPhase + spin / sampleRateValue);

    const theta = mainPhase * Math.PI * 2;
    const envelope = Math.exp(growth * (mainPhase - 0.5));

    let sumX = 0;
    let sumY = 0;
    let ampSum = 0;
    let amp = 1;
    let angleMultiplier = 1;
    for (let k = 0; k < octaveCount; k++) {
      const angle = angleMultiplier * theta + k * twist * Math.PI * 2;
      sumX += amp * Math.cos(angle);
      sumY += amp * Math.sin(angle);
      ampSum += amp;
      amp *= gain;
      angleMultiplier *= lacunarity;
    }
    const normX = ampSum > 0 ? sumX / ampSum : 0;
    const normY = ampSum > 0 ? sumY / ampSum : 0;

    const radius = envelope * size;
    const rawX = normX * radius;
    const rawY = normY * radius;

    const spinAngle = spinPhaseValue * Math.PI * 2;
    const cosSpin = Math.cos(spinAngle);
    const sinSpin = Math.sin(spinAngle);
    const x = rawX * cosSpin - rawY * sinSpin;
    const y = rawX * sinSpin + rawY * cosSpin;
    const z = envelope - 1;

    return { x, y, z };
  }

  createLogSpiralState() {
    return {
      phase: 0,
      spinPhase: 0,
    };
  }

  logSpiralWrap01(value) {
    return value - Math.floor(value);
  }

  // Pure logarithmic (equiangular) spiral -- see
  // public/node-graph-log-spiral.js for the full derivation. Mirrors that
  // file exactly.
  logSpiralSample(state, options = {}) {
    const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const spin = Number(options.spin) || 0;
    const size = Math.max(0, Number(options.size) || 0);
    const growth = Number(options.growth) || 0;
    const turns = Math.max(0.1, Number(options.turns) || 1);

    const mainPhase = this.logSpiralWrap01(state.phase);
    state.phase = this.logSpiralWrap01(state.phase + frequency / sampleRateValue);
    const spinPhaseValue = this.logSpiralWrap01(state.spinPhase);
    state.spinPhase = this.logSpiralWrap01(state.spinPhase + spin / sampleRateValue);

    const theta = turns * Math.PI * 2 * mainPhase;
    const envelope = Math.exp(growth * (mainPhase - 0.5));
    const radius = size * envelope;

    const rawX = radius * Math.cos(theta);
    const rawY = radius * Math.sin(theta);

    const spinAngle = spinPhaseValue * Math.PI * 2;
    const cosSpin = Math.cos(spinAngle);
    const sinSpin = Math.sin(spinAngle);
    const x = rawX * cosSpin - rawY * sinSpin;
    const y = rawX * sinSpin + rawY * cosSpin;
    const z = envelope - 1;

    return { x, y, z };
  }

  createLorenzAttractorState() {
    return {
      resetWasHigh: false,
      x: 0.1,
      y: 0,
      z: 0,
      nativeHandle: 0,
    };
  }

  resetLorenzAttractorState(state) {
    state.x = 0.1;
    state.y = 0;
    state.z = 0;
  }

  lorenzAttractorSample(options = {}) {
    const state = options.state || this.createLorenzAttractorState();
    if (this.nativeLorenzAttractorReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeLorenzAttractor.soemdsp_lorenz_attractor_create();
        }
        if (state.nativeHandle) {
          const resetActive = Number(options.reset) > 0.5 ? 1 : 0;
          const speed = Math.max(0, Number(options.speed) || 0);
          const sigma = Math.max(0, Number(options.sigma) || 10);
          const rho = Number.isFinite(Number(options.rho)) ? Number(options.rho) : 28;
          const beta = Math.max(0, Number(options.beta) || 8 / 3);
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeLorenzAttractor.soemdsp_lorenz_attractor_sample(
            state.nativeHandle,
            resetActive,
            speed,
            sigma,
            rho,
            beta,
            sampleRateValue,
          );
          const normalizedX = this.safeFilterNumber(this.nativeLorenzAttractor.soemdsp_lorenz_attractor_x(state.nativeHandle), null);
          const normalizedY = this.safeFilterNumber(this.nativeLorenzAttractor.soemdsp_lorenz_attractor_y(state.nativeHandle), null);
          const normalizedZ = this.safeFilterNumber(this.nativeLorenzAttractor.soemdsp_lorenz_attractor_z(state.nativeHandle), null);
          const rotate = (Number(options.rotate) || 0) * Math.PI * 2;
          const cosRotate = Math.cos(rotate);
          const sinRotate = Math.sin(rotate);
          const depth = this.clampValue(Number(options.zDepth) || 0, 0, 1);
          const depthScale = 1 + normalizedZ * depth * 0.35;
          const scale = Math.max(0, Number(options.scale) || 1) * depthScale;
          const x = (normalizedX * cosRotate - normalizedY * sinRotate) * scale;
          const y = (normalizedX * sinRotate + normalizedY * cosRotate) * scale;
          const z = normalizedZ * scale;
          return {
            x: this.clampValue(x, -1, 1),
            y: this.clampValue(y, -1, 1),
            z: this.clampValue(z, -1, 1),
          };
        }
      } catch (error) {
        this.nativeLorenzAttractorReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "lorenz_attractor",
          status: "disabled",
          message: String(error?.message || error || "native Lorenz Attractor failed"),
        });
      }
    }
    return this.lorenzAttractorSampleJs(state, options);
  }

  lorenzAttractorSampleJs(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      this.resetLorenzAttractorState(state);
    }
    state.resetWasHigh = resetHigh;
    const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const speed = Math.max(0, Number(options.speed) || 0);
    const sigma = Math.max(0, Number(options.sigma) || 10);
    const rho = Number.isFinite(Number(options.rho)) ? Number(options.rho) : 28;
    const beta = Math.max(0, Number(options.beta) || 8 / 3);
    const dt = (0.75 * speed) / sampleRateValue;
    const steps = Math.max(1, Math.ceil(dt / 0.0007));
    const stepDt = steps > 0 ? dt / steps : 0;
    for (let index = 0; index < steps; index += 1) {
      const dx = sigma * (state.y - state.x);
      const dy = state.x * (rho - state.z) - state.y;
      const dz = state.x * state.y - beta * state.z;
      state.x += dx * stepDt;
      state.y += dy * stepDt;
      state.z += dz * stepDt;
      if (!Number.isFinite(state.x) || !Number.isFinite(state.y) || !Number.isFinite(state.z)) {
        this.resetLorenzAttractorState(state);
        break;
      }
    }
    const rotate = (Number(options.rotate) || 0) * Math.PI * 2;
    const cosRotate = Math.cos(rotate);
    const sinRotate = Math.sin(rotate);
    const normalizedX = state.x / 24;
    const normalizedY = state.y / 32;
    const normalizedZ = (state.z - 25) / 30;
    const depth = this.clampValue(Number(options.zDepth) || 0, 0, 1);
    const depthScale = 1 + normalizedZ * depth * 0.35;
    const scale = Math.max(0, Number(options.scale) || 1) * depthScale;
    const x = (normalizedX * cosRotate - normalizedY * sinRotate) * scale;
    const y = (normalizedX * sinRotate + normalizedY * cosRotate) * scale;
    const z = normalizedZ * scale;
    return {
      x: this.clampValue(x, -1, 1),
      y: this.clampValue(y, -1, 1),
      z: this.clampValue(z, -1, 1),
    };
  }

  createLogisticMapState() {
    return {
      hasStarted: false,
      phase: 0,
      x: 0.5,
      nativeHandle: 0,
    };
  }

  resetLogisticMapState(state, seed) {
    state.x = this.clampValue(Number(seed) || 0.5, 0.0001, 0.9999);
    state.phase = 0;
    state.hasStarted = true;
  }

  logisticMapSampleJs(state, options = {}) {
    const resetActive = Number(options.reset) > 0;
    const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const rate = Math.max(0, Number(options.rate) || 0);
    const r = this.clampValue(Number(options.r) || 0, 0, 4);
    const seed = this.clampValue(Number(options.seed) || 0.5, 0.0001, 0.9999);
    if (resetActive || !state.hasStarted) {
      this.resetLogisticMapState(state, seed);
    }
    if (!resetActive && rate > 0) {
      state.phase += rate / sampleRateValue;
      let iterations = 0;
      while (state.phase >= 1 && iterations < 4096) {
        state.phase -= 1;
        state.x = this.clampValue(r * state.x * (1 - state.x), 0, 1);
        iterations++;
      }
      if (state.phase >= 1) {
        state.phase = 0;
      }
    }
    return state.x * 2 - 1;
  }

  logisticMapSample(state, options = {}) {
    const level = Number(options.level) || 0;
    if (
      this.nativeLogisticMapReady &&
      this.nativeLogisticMap?.soemdsp_logistic_map_create &&
      this.nativeLogisticMap?.soemdsp_logistic_map_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeLogisticMap.soemdsp_logistic_map_create();
        }
        if (state.nativeHandle) {
          const resetActive = Number(options.reset) > 0 ? 1 : 0;
          const rate = Math.max(0, Number(options.rate) || 0);
          const r = this.clampValue(Number(options.r) || 0, 0, 4);
          const seed = this.clampValue(Number(options.seed) || 0.5, 0.0001, 0.9999);
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          const scaled = this.nativeLogisticMap.soemdsp_logistic_map_sample(
            state.nativeHandle,
            resetActive,
            rate,
            r,
            seed,
            level,
            sampleRateValue,
          );
          return this.safeFilterNumber(scaled, null);
        }
      } catch (error) {
        this.nativeLogisticMapReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "logistic_map",
          status: "disabled",
          message: String(error?.message || error || "native Logistic Map failed"),
        });
      }
    }
    return this.logisticMapSampleJs(state, options) * level;
  }

  createHenonMapState() {
    return { hasStarted: false, phase: 0, x: 0, y: 0, nativeHandle: 0 };
  }

  resetHenonMapState(state, seedX, seedY) {
    state.x = this.clampValue(Number(seedX) || 0, -1, 1);
    state.y = this.clampValue(Number(seedY) || 0, -1, 1);
    state.phase = 0;
    state.hasStarted = true;
  }

  destroyHenonMapNativeState(state) {
    if (state?.nativeHandle && this.nativeHenonMap?.soemdsp_henon_map_destroy) {
      this.nativeHenonMap.soemdsp_henon_map_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  henonMapSampleJs(state, options = {}) {
    const resetActive = Number(options.reset) > 0;
    const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const rate = Math.max(0, Number(options.rate) || 0);
    const a = this.clampValue(Number(options.a) || 0, 0, 2);
    const b = this.clampValue(Number(options.b) || 0, -1, 1);
    if (resetActive || !state.hasStarted) {
      this.resetHenonMapState(state, options.seedX, options.seedY);
    }
    if (!resetActive && rate > 0) {
      state.phase += rate / sampleRateValue;
      let iterations = 0;
      while (state.phase >= 1 && iterations < 4096) {
        state.phase -= 1;
        const nextX = 1 - a * state.x * state.x + state.y;
        const nextY = b * state.x;
        state.x = this.clampValue(nextX, -4, 4);
        state.y = this.clampValue(nextY, -4, 4);
        iterations++;
      }
      if (state.phase >= 1) {
        state.phase = 0;
      }
    }
    return {
      x: this.clampValue(state.x / 1.5, -1, 1),
      y: this.clampValue(state.y / 0.45, -1, 1),
    };
  }

  henonMapSample(state, options = {}) {
    if (
      this.nativeHenonMapReady &&
      this.nativeHenonMap?.soemdsp_henon_map_create &&
      this.nativeHenonMap?.soemdsp_henon_map_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeHenonMap.soemdsp_henon_map_create();
        }
        if (state.nativeHandle) {
          const resetActive = Number(options.reset) > 0 ? 1 : 0;
          const rate = Math.max(0, Number(options.rate) || 0);
          const a = this.clampValue(Number(options.a) || 0, 0, 2);
          const b = this.clampValue(Number(options.b) || 0, -1, 1);
          const seedX = Number(options.seedX) || 0;
          const seedY = Number(options.seedY) || 0;
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeHenonMap.soemdsp_henon_map_sample(
            state.nativeHandle,
            resetActive,
            rate,
            a,
            b,
            seedX,
            seedY,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeHenonMap.soemdsp_henon_map_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeHenonMap.soemdsp_henon_map_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeHenonMapReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "henon_map",
          status: "disabled",
          message: String(error?.message || error || "native Henon Map failed"),
        });
      }
    }
    return this.henonMapSampleJs(state, options);
  }

  createWirdoSpiralState() {
    return { phase: 0, splashPhase: 0, resetWasHigh: false, nativeHandle: 0 };
  }

  destroyWirdoSpiralNativeState(state) {
    if (state?.nativeHandle && this.nativeWirdoSpiral?.soemdsp_jbwirdo_destroy) {
      this.nativeWirdoSpiral.soemdsp_jbwirdo_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  wirdoSpiralWrap01(v) {
    return v - Math.floor(v);
  }

  wirdoSpiralTrisaw(phase, warp) {
    const safeWarp = this.clampValue(warp, 0.001, 0.999);
    const wrapped = this.wirdoSpiralWrap01(phase);
    return wrapped < safeWarp ? wrapped / safeWarp : (1 - wrapped) / (1 - safeWarp);
  }

  wirdoSpiralSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const sharp = this.clampValue(Number(options.sharp) || 0, 0, 1);
    const cross = Number(options.cross) || 0;
    const density = Number(options.density) || 0;
    const length = Number(options.length) || 0;
    const rotate = Number(options.rotate) || 0;
    const splashDepth = Number(options.splashDepth) || 0;
    const splashDensity = Number(options.splashDensity) || 0;
    const cut = Number(options.cut) || 0;
    const scrap = Number(options.scrap) || 0;
    const ringCut = Number(options.ringCut) || 0;
    const splashSpeed = Number(options.splashSpeed) || 0;
    const syncCut = Number(options.syncCut) || 0;

    const dens = density * Math.PI * 2;
    const safeScrap = this.clampValue(scrap, 0.0001, 1);
    const safeCut = Math.trunc(cut + 0.5);

    let phas = state.phase;
    if (safeCut < 1000 && safeCut > 0) {
      phas = Math.trunc(phas * safeCut) / safeCut;
    }

    const crossRot = (phas > sharp ? 1 : 0) * cross * Math.PI * 2 - cross * Math.PI;
    let crossPhas = this.wirdoSpiralTrisaw(phas, sharp);
    if (syncCut < 1) {
      const denom = this.clampValue(Math.abs(dens) * syncCut, 1, 1000);
      crossPhas = Math.trunc(crossPhas * denom) / denom;
    }
    const crossbow = crossPhas * length - this.clampValue(length - 1, 0, 1);

    const crossX = crossbow * Math.cos(crossRot);
    const crossY = crossbow * Math.sin(crossRot);

    const spirot = crossbow * dens;
    const spirotX = crossX * Math.cos(spirot) + crossY * Math.sin(spirot);
    const spirotY = crossY * Math.cos(spirot) - crossX * Math.sin(spirot);

    let splash = Math.sin(this.wirdoSpiralTrisaw(phas * splashDensity + state.splashPhase, 1) * Math.PI * 2 * safeScrap);
    if (safeScrap < 0.25) {
      const denom = Math.sin(safeScrap * Math.PI * 2);
      splash = denom !== 0 ? splash / denom : 0;
    }
    if (safeScrap < 0.5) {
      splash = splash * 2 - 1;
    } else if (safeScrap < 0.75) {
      const s2 = Math.sin(safeScrap * Math.PI * 2);
      splash = splash * (2 + s2) - (s2 + 1) * (1 + s2);
    }
    if (ringCut < 10 && ringCut > 0) {
      splash = Math.trunc(splash * ringCut) / ringCut;
    }

    const x = spirotX;
    const y = spirotY * Math.cos(rotate * Math.PI * 0.5) + splash * splashDepth;

    state.phase = this.wirdoSpiralWrap01(state.phase + frequency / safeRate);
    state.splashPhase = this.wirdoSpiralWrap01(state.splashPhase + splashSpeed / safeRate);

    return { x, y };
  }

  wirdoSpiralSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      state.splashPhase = 0;
      if (state.nativeHandle && this.nativeWirdoSpiral?.soemdsp_jbwirdo_reset) {
        this.nativeWirdoSpiral.soemdsp_jbwirdo_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeWirdoSpiralReady &&
      this.nativeWirdoSpiral?.soemdsp_jbwirdo_create &&
      this.nativeWirdoSpiral?.soemdsp_jbwirdo_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeWirdoSpiral.soemdsp_jbwirdo_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeWirdoSpiral.soemdsp_jbwirdo_sample(
            state.nativeHandle,
            Number(options.frequency) || 0,
            this.clampValue(Number(options.sharp) || 0, 0, 1),
            Number(options.cross) || 0,
            Number(options.density) || 0,
            Number(options.length) || 0,
            Number(options.rotate) || 0,
            Number(options.splashDepth) || 0,
            Number(options.splashDensity) || 0,
            Number(options.cut) || 0,
            Number(options.scrap) || 0,
            Number(options.ringCut) || 0,
            Number(options.splashSpeed) || 0,
            Number(options.syncCut) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeWirdoSpiral.soemdsp_jbwirdo_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeWirdoSpiral.soemdsp_jbwirdo_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeWirdoSpiralReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_wirdo_spiral",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam WirdoSpiral failed"),
        });
      }
    }
    return this.wirdoSpiralSampleJs(state, options);
  }

  createBlubbState() {
    return { phase: 0, resetWasHigh: false, nativeHandle: 0 };
  }

  destroyBlubbNativeState(state) {
    if (state?.nativeHandle && this.nativeBlubb?.soemdsp_jbblubb_destroy) {
      this.nativeBlubb.soemdsp_jbblubb_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  blubbBipolarTriangle(phase) {
    const p = phase - Math.floor(phase);
    return p < 0.5 ? (4 * p - 1) : (3 - 4 * p);
  }

  blubbSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const shape = Number(options.shape) || 0;
    const rotX = Number(options.rotX) || 0;
    const rotY = Number(options.rotY) || 0;
    const zDepth = Number(options.zDepth) || 0;

    const phase = state.phase;
    let chX, chY;
    if (shape >= 0.5) {
      chX = this.blubbBipolarTriangle(phase + 0.125);
      chY = this.blubbBipolarTriangle(phase + 0.375);
    } else {
      chX = Math.sin(phase * Math.PI * 2);
      chY = Math.cos(phase * Math.PI * 2);
    }

    const sinRotX = Math.sin(rotX * Math.PI * 2);
    const cosRotX = Math.cos(rotX * Math.PI * 2);
    const help11 = chX * cosRotX - chY * sinRotX;
    const help12 = chX * sinRotX + chY * cosRotX;
    const sinRotY = Math.sin(rotY * Math.PI * 2);
    const cosRotY = Math.cos(rotY * Math.PI * 2);
    const help21 = help11 * cosRotY;
    const z = help11 * sinRotY;

    const formula = zDepth * 1.25 * (z * 0.05 + 0.5);
    const m = 1 + zDepth;
    const x = (help21 - formula * help21) * m;
    const y = (help12 - formula * help12) * m;

    const nextPhase = state.phase + frequency / safeRate;
    state.phase = nextPhase - Math.floor(nextPhase);

    return { x, y };
  }

  blubbSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      if (state.nativeHandle && this.nativeBlubb?.soemdsp_jbblubb_reset) {
        this.nativeBlubb.soemdsp_jbblubb_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeBlubbReady &&
      this.nativeBlubb?.soemdsp_jbblubb_create &&
      this.nativeBlubb?.soemdsp_jbblubb_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeBlubb.soemdsp_jbblubb_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeBlubb.soemdsp_jbblubb_sample(
            state.nativeHandle,
            Number(options.frequency) || 0,
            Number(options.shape) || 0,
            Number(options.rotX) || 0,
            Number(options.rotY) || 0,
            Number(options.zDepth) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeBlubb.soemdsp_jbblubb_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeBlubb.soemdsp_jbblubb_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeBlubbReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_blubb",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam Blubb failed"),
        });
      }
    }
    return this.blubbSampleJs(state, options);
  }

  createMushroomState() {
    return { phase: 0, capRotRamp: 0, clusterRotRamp: 0, resetWasHigh: false, nativeHandle: 0 };
  }

  destroyMushroomNativeState(state) {
    if (state?.nativeHandle && this.nativeMushroom?.soemdsp_jbmushroom_destroy) {
      this.nativeMushroom.soemdsp_jbmushroom_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  mushroomTrisaw(phase, warp) {
    const safeWarp = this.clampValue(warp, 0.001, 0.999);
    const wrapped = phase - Math.floor(phase);
    return wrapped < safeWarp ? wrapped / safeWarp : (1 - wrapped) / (1 - safeWarp);
  }

  mushroomSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const phaseOffset = Number(options.phaseOffset) || 0;
    const numMushroomsRaw = Number(options.numMushrooms) || 0;
    const grow = Number(options.grow) || 0;
    const density = Number(options.density) || 0;
    const capRotation = Number(options.capRotation) || 0;
    const stemRotationSpeed = Number(options.stemRotationSpeed) || 0;
    const head = Number(options.head) || 0;
    const spread = Number(options.spread) || 0;
    const wobble = Number(options.wobble) || 0;
    const clusterRotation = Number(options.clusterRotation) || 0;
    const clusterRotationSpeed = Number(options.clusterRotationSpeed) || 0;
    const sharp = Number(options.sharp) || 0;
    const width = Number(options.width) || 0;
    const stem = Number(options.stem) || 0;
    const apart = Number(options.apart) || 0;
    const capStemTransition = Number(options.capStemTransition) || 0;

    const nom = this.clampValue(numMushroomsRaw, -5, 5) || 1;
    const nomTrunc = nom === 0 ? 1 : Math.trunc(nom);
    const phasorFreq = nomTrunc < 0 ? (frequency / nomTrunc * 0.5) : (frequency * 0.5);
    const safeSharp = sharp * 0.5 + 0.5;
    const safeSpread = spread * 4;

    const phas = (state.phase + phaseOffset * 0.5) - Math.floor(state.phase + phaseOffset * 0.5);
    const caprot = (state.capRotRamp + capRotation) - Math.floor(state.capRotRamp + capRotation);
    const stemrot = (state.clusterRotRamp + clusterRotation) - Math.floor(state.clusterRotRamp + clusterRotation);

    const phasXNomX2 = phas * nomTrunc * 2;
    const ph = this.mushroomTrisaw(phasXNomX2, safeSharp) * grow;
    const stair = Math.floor(phasXNomX2) / nomTrunc;
    const phukRaw = ph * wobble + stair;
    const phuk = phukRaw - Math.floor(phukRaw);

    const formulaSin = Math.sin((ph - caprot) * density * Math.PI * 2);
    const formulaCos = Math.cos((ph - caprot) * density * Math.PI * 2);

    let shroomX = formulaSin * width;
    let shroomY = -formulaCos * width;

    const sinPhTau = Math.sin(ph * Math.PI * 2);
    const shroomHeadX = shroomX * sinPhTau * 0.5;
    const densClamped = this.clampValue(density, 0, 10);
    const shroomHeadY = shroomY * 0.1 * sinPhTau * densClamped / 10;

    const shroomStemX = shroomX * -0.4 * stem;
    const shroomStemY = shroomY * -0.1 * stem;

    if (ph > head) {
      shroomX = shroomHeadX;
      shroomY = shroomHeadY;
    } else if (ph > (1 - capStemTransition) * head) {
      const oneMTransXHead = (1 - capStemTransition) * head;
      const formula2 = (ph - oneMTransXHead) / (head - oneMTransXHead);
      shroomX = shroomHeadX * formula2 + shroomStemX * (1 - formula2);
      shroomY = shroomHeadY * formula2 + shroomStemY * (1 - formula2);
    } else {
      shroomX = shroomStemX;
      shroomY = shroomStemY;
    }

    shroomX += ph * Math.cos((phuk + stemrot - 0.25) * Math.PI * 2) * 0.5 * safeSpread;
    shroomY += ph * 2 - 1;

    const dual = ((phas >= 0.5 ? 1 : 0) * 2 - 1) * apart;
    shroomX += shroomX + dual;

    if (nomTrunc > 0) {
      shroomX = -shroomX;
    }

    const nextPhase = state.phase + phasorFreq / safeRate;
    state.phase = nextPhase - Math.floor(nextPhase);
    const nextCapRot = state.capRotRamp + stemRotationSpeed / safeRate;
    state.capRotRamp = nextCapRot - Math.floor(nextCapRot);
    const nextClusterRot = state.clusterRotRamp + clusterRotationSpeed / safeRate;
    state.clusterRotRamp = nextClusterRot - Math.floor(nextClusterRot);

    return { x: shroomX, y: shroomY };
  }

  mushroomSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      state.capRotRamp = 0;
      state.clusterRotRamp = 0;
      if (state.nativeHandle && this.nativeMushroom?.soemdsp_jbmushroom_reset) {
        this.nativeMushroom.soemdsp_jbmushroom_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeMushroomReady &&
      this.nativeMushroom?.soemdsp_jbmushroom_create &&
      this.nativeMushroom?.soemdsp_jbmushroom_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeMushroom.soemdsp_jbmushroom_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeMushroom.soemdsp_jbmushroom_sample(
            state.nativeHandle,
            Number(options.frequency) || 0,
            Number(options.phaseOffset) || 0,
            Number(options.numMushrooms) || 0,
            Number(options.grow) || 0,
            Number(options.density) || 0,
            Number(options.capRotation) || 0,
            Number(options.stemRotationSpeed) || 0,
            Number(options.head) || 0,
            Number(options.spread) || 0,
            Number(options.wobble) || 0,
            Number(options.clusterRotation) || 0,
            Number(options.clusterRotationSpeed) || 0,
            Number(options.sharp) || 0,
            Number(options.width) || 0,
            Number(options.stem) || 0,
            Number(options.apart) || 0,
            Number(options.capStemTransition) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeMushroom.soemdsp_jbmushroom_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeMushroom.soemdsp_jbmushroom_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeMushroomReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_mushroom",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam Mushroom failed"),
        });
      }
    }
    return this.mushroomSampleJs(state, options);
  }

  createBoingState() {
    return { phase: 0, zHistory: 0, resetWasHigh: false, nativeHandle: 0 };
  }

  destroyBoingNativeState(state) {
    if (state?.nativeHandle && this.nativeBoing?.soemdsp_jbboing_destroy) {
      this.nativeBoing.soemdsp_jbboing_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  boingTrisaw(phase, warp) {
    const safeWarp = this.clampValue(warp, 0.001, 0.999);
    const wrapped = phase - Math.floor(phase);
    return wrapped < safeWarp ? wrapped / safeWarp : (1 - wrapped) / (1 - safeWarp);
  }

  boingSphere(fphas, dens, shape) {
    const formula001 = dens * Math.PI * 2 * fphas - 3 * dens;
    const sin001 = Math.sin(formula001 * Math.PI * 2);
    const cos001 = Math.cos(formula001 * Math.PI * 2);
    const formula002 = shape + (1 - shape) * Math.sin(Math.PI * (fphas + 1));
    return {
      x: -Math.cos(Math.PI * fphas),
      y: sin001 * formula002,
      z: cos001 * formula002,
    };
  }

  boingRotate(inX, inY, inZ, rotX, rotY) {
    const sinX = Math.sin(rotX * Math.PI * 2);
    const cosX = Math.cos(rotX * Math.PI * 2);
    const help11 = inX * cosX - inY * sinX;
    const help12 = inX * sinX + inY * cosX;
    const sinY = Math.sin(rotY * Math.PI * 2);
    const cosY = Math.cos(rotY * Math.PI * 2);
    const help21 = help11 * cosY - inZ * sinY;
    const help22 = help11 * sinY + inZ * cosY;
    return { x: help21, y: help12, z: help22 };
  }

  boingFunc(inX, inY, inZ, boing, strength) {
    const formula001 = 1 - Math.pow(boing, 2) * strength;
    return {
      x: inX * formula001,
      y: inY * formula001 * (1 - Math.pow(1 - boing, 4) * strength) + (Math.pow(boing, 0.8) * 2 - 1) * strength,
      z: inZ,
    };
  }

  boingRender(inX, inY, inZ, zdepth) {
    const zd = Math.pow(zdepth, 2) + 1;
    const exponent = -inZ - zd * 0.2;
    const factor = Math.pow(zd, exponent);
    return { l: inX * factor, r: inY * factor };
  }

  boingSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const density = Number(options.density) || 0;
    const sharpness = Number(options.sharpness) || 0;
    const rotX = Number(options.rotX) || 0;
    const rotY = Number(options.rotY) || 0;
    const zDepth = Number(options.zDepth) || 0;
    const zAmount = Number(options.zAmount) || 0;
    const ends = Number(options.ends) || 0;
    const boing = Number(options.boing) || 0;
    const boingStrength = Number(options.boingStrength) || 0;
    const dir = Number(options.dir) || 0;
    const shape = Number(options.shape) || 0;
    const volume = Number(options.volume) || 0;
    const prejump = Number(options.volumePreJump) >= 0.5;

    const tri = sharpness * 0.5 + 0.5;
    const rotXTurns = (rotX + 90) / 360;
    const rotYTurns = rotY / 360;

    const zDarkness = Math.pow(zAmount * zAmount * 5 + 1, state.zHistory) + Math.pow(zAmount, 1.5) * 0.22;

    const fphasEnds = this.boingTrisaw(state.phase, tri);
    const fphasMids = Math.asin((Math.asin(fphasEnds * 2 - 1) / Math.PI + 0.5) * 2 - 1) / Math.PI + 0.5;
    const fphas = ends * fphasMids + (1 - ends) * fphasEnds;

    let wave = this.boingSphere(fphas, density, shape);
    wave = this.boingRotate(wave.x, wave.y, wave.z, rotXTurns, rotYTurns);
    wave = this.boingRotate(wave.x, wave.y, wave.z, -dir, 0);

    if (prejump) {
      wave.x *= volume;
      wave.y *= volume;
    }

    wave = this.boingFunc(wave.x, wave.y, wave.z, boing, boingStrength);

    wave.y *= 1 - boingStrength * (0.5 + volume / 2) * (-Math.cos(dir * 8 * Math.PI) / 2 + 0.5) * Math.abs(Math.pow(wave.x * 0.75, 2)) * Math.pow(1 - boing, 5);

    wave = this.boingRotate(wave.x, wave.y, wave.z, dir, 0);

    const rendered = this.boingRender(wave.x, wave.y, wave.z, zDepth);
    let outL = rendered.l;
    let outR = rendered.r;

    if (!prejump) {
      outL *= volume;
      outR *= volume;
    }

    state.zHistory = wave.z;
    state.phase = state.phase + (frequency * zDarkness) / safeRate;
    state.phase -= Math.floor(state.phase);

    return { x: outL, y: outR };
  }

  boingSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      state.zHistory = 0;
      if (state.nativeHandle && this.nativeBoing?.soemdsp_jbboing_reset) {
        this.nativeBoing.soemdsp_jbboing_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeBoingReady &&
      this.nativeBoing?.soemdsp_jbboing_create &&
      this.nativeBoing?.soemdsp_jbboing_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeBoing.soemdsp_jbboing_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeBoing.soemdsp_jbboing_sample(
            state.nativeHandle,
            Number(options.frequency) || 0,
            Number(options.density) || 0,
            Number(options.sharpness) || 0,
            Number(options.rotX) || 0,
            Number(options.rotY) || 0,
            Number(options.zDepth) || 0,
            Number(options.zAmount) || 0,
            Number(options.ends) || 0,
            Number(options.boing) || 0,
            Number(options.boingStrength) || 0,
            Number(options.dir) || 0,
            Number(options.shape) || 0,
            Number(options.volume) || 0,
            Number(options.volumePreJump) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeBoing.soemdsp_jbboing_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeBoing.soemdsp_jbboing_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeBoingReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_boing",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam Boing failed"),
        });
      }
    }
    return this.boingSampleJs(state, options);
  }

  createTorusState() {
    return {
      phase: 0,
      wanderPhase: 0,
      xPhase: 0,
      yPhase: 0,
      zPhase: 0,
      darkAnglePhase: 0,
      resetWasHigh: false,
      nativeHandle: 0,
    };
  }

  destroyTorusNativeState(state) {
    if (state?.nativeHandle && this.nativeTorus?.soemdsp_jbtorus_destroy) {
      this.nativeTorus.soemdsp_jbtorus_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  torusTrisaw(phase, warp) {
    const safeWarp = this.clampValue(warp, 0.001, 0.999);
    const wrapped = phase - Math.floor(phase);
    return wrapped < safeWarp ? wrapped / safeWarp : (1 - wrapped) / (1 - safeWarp);
  }

  torusSign(v) {
    return (v > 0 ? 1 : 0) - (v < 0 ? 1 : 0);
  }

  torusRotate(inX, inY, inZ, rotX, rotY, rotZ) {
    const sinX = Math.sin(rotX * Math.PI * 2);
    const cosX = Math.cos(rotX * Math.PI * 2);
    const help11 = inX * cosX - inY * sinX;
    const help12 = inX * sinX + inY * cosX;
    const sinY = Math.sin(rotY * Math.PI * 2);
    const cosY = Math.cos(rotY * Math.PI * 2);
    const help21 = help11 * cosY - inZ * sinY;
    const help22 = help11 * sinY + inZ * cosY;
    const sinZ = Math.sin(rotZ * Math.PI * 2);
    const cosZ = Math.cos(rotZ * Math.PI * 2);
    const help31 = help21 * cosZ - help12 * sinZ;
    const help32 = help21 * sinZ + help12 * cosZ;
    return { x: help31, y: help32, z: help22 };
  }

  torusRender(inX, inY, inZ, zaspx, zaspy, zdepth) {
    const formula001 = zdepth * (inZ / 2 + 0.5);
    const half = 0.5 * zaspx * zdepth;
    return {
      l: inX - formula001 * (inX - zaspx) - half,
      r: inY - formula001 * (inY + zaspy) + half,
    };
  }

  torusSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const density = Number(options.density) || 0;
    const quantizeDensity = Number(options.quantizeDensity) >= 0.5;
    const subdensity = Number(options.subdensity) || 0;
    const quantizeSubDensity = Number(options.quantizeSubDensity) >= 0.5;
    const sharp = Number(options.sharp) || 0;
    const size = Number(options.size) || 0;
    const length = Number(options.length) || 0;
    const balance = Number(options.balance) || 0;
    const wander = Number(options.wander) || 0;
    const darkAngle = Number(options.darkAngle) || 0;
    const darkIntensity = Number(options.darkIntensity) || 0;
    const rotX = Number(options.rotX) || 0;
    const rotY = Number(options.rotY) || 0;
    const rotZ = Number(options.rotZ) || 0;
    const zAngleX = Number(options.zAngleX) || 0;
    const zAngleY = Number(options.zAngleY) || 0;
    const zDepth = Number(options.zDepth) || 0;

    const dense = quantizeDensity ? Math.floor(density) : density;
    const pow2Dense = dense * dense;
    const sdens = quantizeSubDensity
      ? Math.floor(pow2Dense * subdensity) * Math.PI * 2
      : pow2Dense * subdensity * Math.PI * 2;
    const div = size === 0 ? 1 : (1 / size);
    const volCorrect = 1 / (1 + size + size * div);
    const zdepthZ2 = zDepth / 2;
    const dank = Math.trunc(darkIntensity) * 2 + 1;
    const wanderFreq = dense === 0 ? 0 : (wander / dense);

    const dangle = (state.darkAnglePhase + darkAngle - Math.floor(state.darkAnglePhase + darkAngle)) + 0.5;
    const rotXValue = -Math.PI * 2 * ((state.xPhase + rotX - Math.floor(state.xPhase + rotX)) + 1);
    const rotYValue = Math.PI * 2 * (state.yPhase + rotY - Math.floor(state.yPhase + rotY)) - Math.PI / 2;
    const rotZValue = Math.PI / 2 - Math.PI * 2 * (state.zPhase + rotZ - Math.floor(state.zPhase + rotZ));

    const triphase = this.torusTrisaw(state.phase, sharp);
    const phasRaw = triphase * length - rotXValue / (Math.PI * 2);
    const phas = phasRaw - Math.floor(phasRaw);

    const blend = Math.sin(rotYValue);
    const normPhas = phas * (1 - 0.5 * Math.abs(blend));
    const phasBipolar = phas * 2 - 1;
    const dankedPos = 0.5 * this.clampValue(blend, 0, 1) * (Math.pow(phasBipolar, dank) + 1) / 2;
    const phasPlusHalf = phas + 0.5;
    const phasPlusHalfWrapped = phasPlusHalf - Math.floor(phasPlusHalf);
    const dankedNeg = 0.5 * this.clampValue(-blend, 0, 1) * (0.5 * Math.pow(phasPlusHalfWrapped * 2 - 1, dank) + (this.torusSign(phasBipolar) + 1) / 2);
    const phasor = normPhas + dankedPos + dankedNeg + 0.25 + rotXValue / (Math.PI * 2) + dangle;

    const sp0sin = Math.sin(phasor * Math.PI * 2);
    const sp0cos = Math.cos(phasor * Math.PI * 2);
    const spiral0X = sp0sin;
    const spiral0Y = sp0cos;
    const spiral0Z = 0;

    const sp1sin = Math.sin(dense * phasor * Math.PI * 2);
    const sp1cos = Math.cos(dense * phasor * Math.PI * 2);
    const formula001 = (1 - balance) / div;
    const formula002 = formula001 * sp1sin;
    const spiral1X = formula002 * sp0sin;
    const spiral1Y = formula002 * sp0cos;
    const spiral1Z = formula001 * sp1cos;

    const sp2sin = Math.sin(sdens * (phasor + state.wanderPhase) * Math.PI * 2);
    const sp2cos = Math.cos(sdens * (phasor + state.wanderPhase) * Math.PI * 2);
    const balZDivXDiv = balance / (div * div);
    const spiral2X = balZDivXDiv * (sp2cos * sp0cos + sp2sin * sp1sin * sp0sin);
    const spiral2Y = balZDivXDiv * (sp2cos * -sp0sin + sp2sin * sp1sin * sp0cos);
    const spiral2Z = balZDivXDiv * sp2sin * sp1cos;

    const formula003 = volCorrect + zdepthZ2 - volCorrect * zdepthZ2;
    let waveX = (spiral0X + spiral1X + spiral2X) * formula003;
    let waveY = (spiral0Y + spiral1Y + spiral2Y) * formula003;
    let waveZ = (spiral0Z + spiral1Z + spiral2Z) * formula003;

    const rotated = this.torusRotate(waveX, waveY, waveZ, rotXValue, rotYValue, rotZValue);
    waveX = rotated.x;
    waveY = rotated.y;
    waveZ = rotated.z;

    const rendered = this.torusRender(waveX, waveY, waveZ, zAngleX, zAngleY, zDepth);

    state.phase = state.phase + frequency / safeRate;
    state.phase -= Math.floor(state.phase);
    state.wanderPhase = state.wanderPhase + wanderFreq / safeRate;
    state.wanderPhase -= Math.floor(state.wanderPhase);
    state.xPhase = state.xPhase + 1 / safeRate;
    state.xPhase -= Math.floor(state.xPhase);
    state.yPhase = state.yPhase + 1 / safeRate;
    state.yPhase -= Math.floor(state.yPhase);
    state.zPhase = state.zPhase + 1 / safeRate;
    state.zPhase -= Math.floor(state.zPhase);
    state.darkAnglePhase = state.darkAnglePhase + 1 / safeRate;
    state.darkAnglePhase -= Math.floor(state.darkAnglePhase);

    return { x: rendered.l, y: rendered.r };
  }

  torusSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      state.wanderPhase = 0;
      state.xPhase = 0;
      state.yPhase = 0;
      state.zPhase = 0;
      state.darkAnglePhase = 0;
      if (state.nativeHandle && this.nativeTorus?.soemdsp_jbtorus_reset) {
        this.nativeTorus.soemdsp_jbtorus_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeTorusReady &&
      this.nativeTorus?.soemdsp_jbtorus_create &&
      this.nativeTorus?.soemdsp_jbtorus_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeTorus.soemdsp_jbtorus_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeTorus.soemdsp_jbtorus_sample(
            state.nativeHandle,
            Number(options.frequency) || 0,
            Number(options.density) || 0,
            Number(options.quantizeDensity) || 0,
            Number(options.subdensity) || 0,
            Number(options.quantizeSubDensity) || 0,
            Number(options.sharp) || 0,
            Number(options.size) || 0,
            Number(options.length) || 0,
            Number(options.balance) || 0,
            Number(options.wander) || 0,
            Number(options.darkAngle) || 0,
            Number(options.darkIntensity) || 0,
            Number(options.rotX) || 0,
            Number(options.rotY) || 0,
            Number(options.rotZ) || 0,
            Number(options.zAngleX) || 0,
            Number(options.zAngleY) || 0,
            Number(options.zDepth) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeTorus.soemdsp_jbtorus_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeTorus.soemdsp_jbtorus_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeTorusReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_torus",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam Torus failed"),
        });
      }
    }
    return this.torusSampleJs(state, options);
  }

  createKeplerBouwkampState() {
    return { phase: 0, resetWasHigh: false, nativeHandle: 0 };
  }

  destroyKeplerBouwkampNativeState(state) {
    if (state?.nativeHandle && this.nativeKeplerBouwkamp?.soemdsp_jbkepler_destroy) {
      this.nativeKeplerBouwkamp.soemdsp_jbkepler_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  keplerBouwkampTrisaw(phase, warp) {
    const safeWarp = this.clampValue(warp, 0.001, 0.999);
    const wrapped = phase - Math.floor(phase);
    return wrapped < safeWarp ? wrapped / safeWarp : (1 - wrapped) / (1 - safeWarp);
  }

  keplerBouwkampSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const start = Number(options.start) || 0;
    const length = Number(options.length) || 0;
    const circles = Number(options.circles) || 0;
    const zoom = Number(options.zoom) || 0;
    const rotation = Number(options.rotation) || 0;
    const tri = Number(options.tri) || 0;

    const firstPolygon = Math.trunc(this.clampValue(Math.trunc(start), 3, 20));
    const n = Math.trunc(this.clampValue(Math.trunc(length), 1, 20));
    const circleblend = this.clampValue(circles, 0.0001, 0.9999);

    let waveX = 0;
    let waveY = 0;

    const fphas = this.keplerBouwkampTrisaw(state.phase, tri);
    const phasXN = fphas * n;
    const stepPhas = phasXN - Math.floor(phasXN);
    const polygonNumber = phasXN - stepPhas + firstPolygon;

    let polygonPhas = this.clampValue((stepPhas - circleblend) / (1 - circleblend), 0, 1);
    let circlePhas = this.clampValue(stepPhas / circleblend, 0, 1);
    if (stepPhas > circleblend) {
      circlePhas = 0;
    }

    const radIn = Math.cos(Math.PI / polygonNumber);
    let radInPrev = 1;
    if (polygonNumber > firstPolygon) {
      const iStart = Math.trunc(polygonNumber);
      for (let i = iStart; i > firstPolygon && (iStart - i) < 64; i--) {
        radInPrev *= Math.cos(Math.PI / (i - 1));
      }
    }

    let radInNext = 1;
    {
      const iStart = Math.trunc(polygonNumber);
      const iEnd = firstPolygon + n - 1;
      for (let i = iStart; i < iEnd && (i - iStart) < 64; i++) {
        radInNext *= Math.cos(Math.PI / (i + 1));
      }
    }

    let first = 0;
    const f001 = 0.5 / polygonNumber;
    if (polygonNumber === firstPolygon) {
      first = 1;
    } else if (circlePhas > 1 - f001) {
      circlePhas = this.keplerBouwkampTrisaw((circlePhas - (1 - f001)) * 1 / f001, 0.5 + 0.5 * circleblend) * f001 + 1 - f001;
    }

    if (circlePhas !== 0) {
      const f003 = radIn + zoom * (1 - radIn);
      const arg = circlePhas + (first === 0 ? 1 : 0) * (1 - zoom) * 0.5 / (polygonNumber - 1) - zoom * first * f001;
      const f002Sin = Math.sin(arg * Math.PI * 2);
      const f002Cos = Math.cos(arg * Math.PI * 2);
      waveX = -f002Sin * f003;
      waveY = f002Cos * f003;
    }
    if (polygonPhas !== 0) {
      const shifted = polygonPhas + 1 - (1 - zoom) * 0.5 / polygonNumber;
      polygonPhas = shifted - Math.floor(shifted);
      const linePhasRaw = polygonPhas * polygonNumber;
      let linePhas = linePhasRaw - Math.floor(linePhasRaw);
      const lineNumber = Math.floor(linePhasRaw) + (polygonPhas !== 0 ? 1 : 0);

      if (polygonNumber !== (firstPolygon + n - 1)
          && lineNumber === polygonNumber
          && linePhas > 0.5 * zoom && linePhas < 0.5 + 0.5 * zoom) {
        linePhas = this.keplerBouwkampTrisaw((linePhas - 0.5 * zoom) * 2, 1 - circleblend) / 2 + 0.5 * zoom;
      }

      const line = (linePhas * 2 - 1) * Math.sin(Math.PI / polygonNumber);

      const arg = lineNumber / polygonNumber;
      const f1Sin = Math.sin(arg * Math.PI * 2);
      const f1Cos = Math.cos(arg * Math.PI * 2);
      waveX = line * f1Cos + radIn * f1Sin;
      waveY = radIn * f1Cos - line * f1Sin;
    }

    const scale = zoom * radInPrev + (1 - zoom) * radInNext;
    waveX *= scale;
    waveY *= scale;

    const rotArg = rotation * (polygonNumber - firstPolygon);
    const rotSin = Math.sin(rotArg * Math.PI * 2);
    const rotCos = Math.cos(rotArg * Math.PI * 2);

    const x = waveX * rotCos + waveY * rotSin;
    const y = waveY * rotCos - waveX * rotSin;

    const phaseInc = Math.PI * 2 * frequency / safeRate;
    const nextPhase = state.phase + phaseInc;
    state.phase = nextPhase - Math.floor(nextPhase / (Math.PI * 2)) * (Math.PI * 2);
    if (state.phase < 0) {
      state.phase += Math.PI * 2;
    }

    return { x, y };
  }

  keplerBouwkampSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      if (state.nativeHandle && this.nativeKeplerBouwkamp?.soemdsp_jbkepler_reset) {
        this.nativeKeplerBouwkamp.soemdsp_jbkepler_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeKeplerBouwkampReady &&
      this.nativeKeplerBouwkamp?.soemdsp_jbkepler_create &&
      this.nativeKeplerBouwkamp?.soemdsp_jbkepler_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeKeplerBouwkamp.soemdsp_jbkepler_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeKeplerBouwkamp.soemdsp_jbkepler_sample(
            state.nativeHandle,
            Number(options.frequency) || 0,
            Number(options.start) || 0,
            Number(options.length) || 0,
            Number(options.circles) || 0,
            Number(options.zoom) || 0,
            Number(options.rotation) || 0,
            Number(options.tri) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeKeplerBouwkamp.soemdsp_jbkepler_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeKeplerBouwkamp.soemdsp_jbkepler_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeKeplerBouwkampReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_kepler_bouwkamp",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam Kepler-Bouwkamp failed"),
        });
      }
    }
    return this.keplerBouwkampSampleJs(state, options);
  }

  createNyquistShannonState() {
    return {
      phase: 0,
      rotatorPhase: 0,
      lastFphas: 0,
      hasLastFphas: false,
      toneSmoothCurrent: 0,
      toneSmoothInit: false,
      resetWasHigh: false,
      nativeHandle: 0,
    };
  }

  destroyNyquistShannonNativeState(state) {
    if (state?.nativeHandle && this.nativeNyquistShannon?.soemdsp_jbnyquist_destroy) {
      this.nativeNyquistShannon.soemdsp_jbnyquist_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  nyquistShannonTrisaw(phase, warp) {
    const safeWarp = this.clampValue(warp, 0.001, 0.999);
    const wrapped = phase - Math.floor(phase);
    return wrapped < safeWarp ? wrapped / safeWarp : (1 - wrapped) / (1 - safeWarp);
  }

  nyquistShannonSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequencyA = Number(options.frequencyA) || 0;
    const midiNoteRaw = Number(options.midiNoteRaw) || 0;
    const rate = Number(options.rate) || 0;
    const sampleDots = Number(options.sampleDots) || 0;
    const phaseOffset = Number(options.phaseOffset) || 0;
    const frequencyB = Number(options.frequencyB) || 0;
    const subPhase = Number(options.subPhase) || 0;
    const subPhaseRotationSpeed = Number(options.subPhaseRotationSpeed) || 0;
    const tone = Number(options.tone) || 0;
    const toneSmoothTime = Number(options.toneSmoothTime) || 0;
    const artifact = Number(options.artifact) || 0;
    const enableToneModPitch = Number(options.enableToneModPitch) || 0;
    const enableToneModFreq = Number(options.enableToneModFreq) || 0;
    const enableToneModNote = Number(options.enableToneModNote) || 0;

    const userFreqA = frequencyA;
    const pitch = frequencyB;
    const phasorFreq = userFreqA * pitch;
    const midiNote = midiNoteRaw - 48;
    const sr = rate;
    const blend = 1 / (1 - sampleDots + 0.001);
    const tri = this.clampValue(1 - artifact, 0.001, 0.999);
    const freqToPitch = (12 * Math.log2(Math.abs(userFreqA) / 440) + 69) - 48;

    const toneMode = (enableToneModNote >= 0.5 ? 1 : 0) + (enableToneModPitch >= 0.5 ? 2 : 0) + (enableToneModFreq >= 0.5 ? 4 : 0);

    const mainPhas = (state.phase + phaseOffset) - Math.floor(state.phase + phaseOffset);
    const fphas = this.nyquistShannonTrisaw(mainPhas, tri);

    const stair = Math.floor(fphas * sr) / sr;
    const fmodFphasSr = (fphas * sr) - Math.floor(fphas * sr);
    const phas = this.clampValue(blend * fmodFphasSr, 0, 1) / sr + stair;

    const waveX = phas * 2 - 1;
    let waveY = 0;

    const smoothSamples = toneSmoothTime > 0 ? toneSmoothTime * safeRate : 1;
    const smoothStep = smoothSamples > 0 ? (1 / smoothSamples) : 1;

    const runSmoother = (target) => {
      if (!state.toneSmoothInit) {
        state.toneSmoothCurrent = target;
        state.toneSmoothInit = true;
      } else if (state.toneSmoothCurrent < target) {
        state.toneSmoothCurrent = target - state.toneSmoothCurrent > smoothStep
          ? state.toneSmoothCurrent + smoothStep
          : target;
      } else if (state.toneSmoothCurrent > target) {
        state.toneSmoothCurrent = state.toneSmoothCurrent - target > smoothStep
          ? state.toneSmoothCurrent - smoothStep
          : target;
      }
      return state.toneSmoothCurrent;
    };

    let actualTone;
    switch (toneMode) {
      case 0: actualTone = tone; break;
      case 1: actualTone = tone + runSmoother(midiNote); break;
      case 2: actualTone = tone + runSmoother(pitch - 1); break;
      case 3: actualTone = tone + runSmoother((pitch - 1) + midiNote); break;
      case 4: actualTone = tone + freqToPitch; break;
      case 5: actualTone = tone + runSmoother(midiNote * 0.5) + freqToPitch * 0.5; break;
      case 6: actualTone = tone + runSmoother(pitch - 1) + freqToPitch; break;
      default: actualTone = tone + runSmoother((pitch - 1) + midiNote * 0.5) + freqToPitch * 0.5; break;
    }

    const rotatorArg = state.rotatorPhase - subPhase;
    const psXPi = (rotatorArg - Math.floor(rotatorArg)) * Math.PI * 2;

    const wasFirstSample = !state.hasLastFphas;
    const changed = wasFirstSample ? 0 : (state.lastFphas > fphas ? 1 : (state.lastFphas < fphas ? -1 : 0));
    state.lastFphas = fphas;
    state.hasLastFphas = true;

    if (changed === 1) {
      waveY = Math.sin(actualTone * Math.PI * 2 * phas + psXPi);
    } else {
      waveY = -Math.sin(sr * Math.PI * phas + Math.PI / 2) * Math.sin(phas * (sr / 2 - actualTone) * Math.PI * 2 - psXPi);
    }

    state.phase = state.phase + phasorFreq / safeRate;
    state.phase -= Math.floor(state.phase);
    state.rotatorPhase = state.rotatorPhase + (-subPhaseRotationSpeed) / safeRate;
    state.rotatorPhase -= Math.floor(state.rotatorPhase);

    return { x: waveX, y: waveY };
  }

  nyquistShannonSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      state.rotatorPhase = 0;
      state.hasLastFphas = false;
      state.toneSmoothInit = false;
      if (state.nativeHandle && this.nativeNyquistShannon?.soemdsp_jbnyquist_reset) {
        this.nativeNyquistShannon.soemdsp_jbnyquist_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeNyquistShannonReady &&
      this.nativeNyquistShannon?.soemdsp_jbnyquist_create &&
      this.nativeNyquistShannon?.soemdsp_jbnyquist_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeNyquistShannon.soemdsp_jbnyquist_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeNyquistShannon.soemdsp_jbnyquist_sample(
            state.nativeHandle,
            Number(options.frequencyA) || 0,
            Number(options.midiNoteRaw) || 0,
            Number(options.rate) || 0,
            Number(options.sampleDots) || 0,
            Number(options.phaseOffset) || 0,
            Number(options.frequencyB) || 0,
            Number(options.subPhase) || 0,
            Number(options.subPhaseRotationSpeed) || 0,
            Number(options.tone) || 0,
            Number(options.toneSmoothTime) || 0,
            Number(options.artifact) || 0,
            Number(options.enableToneModPitch) || 0,
            Number(options.enableToneModFreq) || 0,
            Number(options.enableToneModNote) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeNyquistShannon.soemdsp_jbnyquist_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeNyquistShannon.soemdsp_jbnyquist_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeNyquistShannonReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_nyquist_shannon",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam Nyquist-Shannon failed"),
        });
      }
    }
    return this.nyquistShannonSampleJs(state, options);
  }

  createRadarState() {
    return {
      phase: 0,
      rotatorPhase: 0,
      resetWasHigh: false,
      nativeHandle: 0,
    };
  }

  destroyRadarNativeState(state) {
    if (state?.nativeHandle && this.nativeRadar?.soemdsp_jbradar_destroy) {
      this.nativeRadar.soemdsp_jbradar_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  radarTrisaw(phase, warp) {
    const safeWarp = this.clampValue(warp, 0.001, 0.999);
    const wrapped = phase - Math.floor(phase);
    return wrapped < safeWarp ? wrapped / safeWarp : (1 - wrapped) / (1 - safeWarp);
  }

  radarSign(v) {
    return (v > 0 ? 1 : 0) - (v < 0 ? 1 : 0);
  }

  radarUpdateXY(x, y) {
    const x_ = Math.sin(x * (Math.PI / 4 + (1 - Math.abs(y)) * (Math.PI / 4)));
    const y_ = y * Math.cos(x * (Math.PI / 4));
    const r = (this.radarSign(y_) + (y_ === 0 ? 1 : 0)) * Math.sqrt(x_ * x_ + y_ * y_);
    const ph = y_ !== 0 ? Math.atan(x_ / y_) : (Math.PI / 2) * this.radarSign(x_);
    return { ph, r };
  }

  radarRenderJs(options) {
    const {
      inPhas, tri1, pow1, pow1Up, pow1Down, phaseInv, dens, frontring, tunnelInv, length,
      spiralReturn, tri2, pow2, rot, lap, ration, pow2Bend, ringcut, ph, r, size, x, y, ratio,
    } = options;

    let phas = this.radarTrisaw(inPhas, tri1);
    if (phaseInv) phas = 1 - this.radarTrisaw(inPhas, tri1);

    if ((pow1Up && inPhas < tri1) || (pow1Down && inPhas >= tri1)) {
      phas = Math.pow(phas, pow1);
    }

    phas = phas * (dens + frontring / ((tunnelInv ? 1 : 0) + (tunnelInv ? 0 : 1) * length)) / dens;

    let sphas = phas;
    if (inPhas > tri1 && spiralReturn) sphas = 2 - phas;

    const sinPhas = this.clampValue(Math.pow(this.radarTrisaw(sphas * length * dens, tri2), pow2), -1e100, 1e100);

    const f002Arg = (sinPhas - (tunnelInv ? 1 : 0) * frontring - rot / lap - (tunnelInv ? 0 : 1) * length * dens) * lap;
    const f002Sin = Math.sin(f002Arg * Math.PI * 2);
    const f002Cos = Math.cos(f002Arg * Math.PI * 2);
    const lilsin = f002Cos * ration;
    const lilcos = f002Sin * ration;

    phas *= length;
    phas = (pow2Bend ? 0 : 1) * (Math.floor(phas * dens) / dens + sinPhas / dens) + (pow2Bend ? 1 : 0) * phas;

    if (ringcut) {
      phas = (Math.floor(phas * dens + (tunnelInv ? 1 : 0) * (1 - frontring)) + rot - (tunnelInv ? 1 : 0) * (1 - frontring)) / dens;
    }

    if (!tunnelInv) {
      phas = 1 - phas - (1 - length) + frontring / dens;
    }

    phas = this.clampValue(phas - frontring / dens, 0, 1);

    const phSinNeg = Math.sin(-ph * Math.PI * 2);
    const phCosNeg = Math.cos(-ph * Math.PI * 2);
    const lilsin1 = lilsin * phSinNeg + lilcos * phCosNeg;
    const lilcos1 = lilcos * phSinNeg - lilsin * phCosNeg;

    const f003Sin = Math.sin(phas * Math.abs(r) * Math.PI * 2);
    const f003Cos = Math.cos(phas * Math.abs(r) * Math.PI * 2);
    const bigsin = f003Cos;
    const bigcos = -f003Sin;

    const lilX = lilsin1 * bigsin;
    const lilY = lilcos1;
    const lilZ = lilsin1 * bigcos * this.radarSign(r);

    let bigX = 0;
    let bigY = 0;
    let bigZ = -Math.PI * 2 * phas;
    if (r !== 0) {
      bigZ = bigcos / Math.abs(r);
      bigX = (bigsin - 1) / r;
    }

    const waveX1 = bigX + lilX;
    const waveY1 = bigY + lilY;
    const waveZ2raw = bigZ + lilZ;

    const phSin = Math.sin(ph * Math.PI * 2);
    const phCos = Math.cos(ph * Math.PI * 2);
    let waveX = waveX1 * phSin + waveY1 * phCos;
    let waveY2 = waveY1 * phSin - waveX1 * phCos;
    let waveZ2 = waveZ2raw;

    const syz = 2 * (size + 0.33) * (Math.abs(x) * (1 - y) + 0.5);
    waveX = size * waveX + (1 - size) * (waveX + x * (1 - ratio) + x * ratio) * syz;
    waveY2 = size * waveY2 + (1 - size) * (waveY2 - y) * syz;
    waveZ2 = size * waveZ2 + (1 - size) * waveZ2 * syz;

    const sizArg = (1 - size) * (Math.PI / 2);
    const sizSin = Math.sin(sizArg * Math.PI * 2);
    const sizCos = Math.cos(sizArg * Math.PI * 2);
    const waveY = waveY2 * sizCos + waveZ2 * sizSin;
    const waveZ = waveZ2 * sizCos - waveY2 * sizSin;

    return { x: waveX, y: waveY, z: waveZ };
  }

  radarSampleJs(state, options = {}) {
    const safeRate = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const frequency = Number(options.frequency) || 0;
    const phaseOffset = Number(options.phaseOffset) || 0;
    const density = Number(options.density) || 0;
    const sharp = Number(options.sharp) || 0;
    const fade = Number(options.fade) || 0;
    const rotation = Number(options.rotation) || 0;
    const direction = Number(options.direction) || 0;
    const shade = Number(options.shade) || 0;
    const lap = Number(options.lap) || 0;
    const ringcut = Number(options.ringcut) >= 0.5;
    const pow1Up = Number(options.pow1Up) >= 0.5;
    const pow1Down = Number(options.pow1Down) >= 0.5;
    const pow2Bend = Number(options.pow2Bend) >= 0.5;
    const phaseInv = Number(options.phaseInv) >= 0.5;
    const tunnelInv = Number(options.tunnelInv) >= 0.5;
    const spiralReturn = Number(options.spiralReturn) >= 0.5;
    const length = Number(options.length) || 0;
    const ratio = Number(options.ratio) || 0;
    const frontring = Number(options.frontring) || 0;
    const zoom = Number(options.zoom) || 0;
    const zDepth = Number(options.zDepth) || 0;
    const inner = Number(options.inner) || 0;
    const x = Number(options.x) || 0;
    const y = Number(options.y) || 0;

    const tri1 = sharp * 0.5 + 0.5;
    const pow1 = fade;
    const tri2 = direction;
    const pow2 = this.clampValue(shade, -80, 80);
    const safeLap = Math.max(1e-6, lap + 1);
    const ration = ratio + 0.1;
    let dens = (ringcut ? Math.floor(density) : density) + 1e-6;
    dens = Math.min(dens, 1e6);
    const size = zoom;
    const xz = 1 - zoom;
    const yFixForZoom = xz + (xz - Math.pow(xz, 6));

    const rx = -x;
    const ry = y;
    const { ph, r } = this.radarUpdateXY(rx, ry);

    const inPhas = (state.phase + phaseOffset) - Math.floor(state.phase + phaseOffset);
    const rotRaw = state.rotatorPhase + rotation;
    const rot = rotRaw - Math.floor(rotRaw);

    const wave = this.radarRenderJs({
      inPhas, tri1, pow1, pow1Up, pow1Down, phaseInv, dens, frontring, tunnelInv, length,
      spiralReturn, tri2, pow2, rot, lap: safeLap, ration, pow2Bend, ringcut, ph, r, size,
      x: rx, y: ry, ratio,
    });

    const depth = (1 - zDepth) * (1 - Math.abs(wave.z) / (Math.PI * 2)) + zDepth * Math.pow(zDepth * 9 + 1, wave.z);
    const f001 = (depth * (1 - inner) + inner) / ((1 - size) + size * ration);
    const outX = wave.x * f001;
    const outY = wave.y * f001 + yFixForZoom;

    state.phase = state.phase + frequency / safeRate;
    state.phase -= Math.floor(state.phase);
    state.rotatorPhase = state.rotatorPhase + 1 / safeRate;
    state.rotatorPhase -= Math.floor(state.rotatorPhase);

    return { x: outX, y: outY };
  }

  radarSample(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      state.phase = 0;
      state.rotatorPhase = 0;
      if (state.nativeHandle && this.nativeRadar?.soemdsp_jbradar_reset) {
        this.nativeRadar.soemdsp_jbradar_reset(state.nativeHandle);
      }
    }
    state.resetWasHigh = resetHigh;
    if (
      this.nativeRadarReady &&
      this.nativeRadar?.soemdsp_jbradar_create &&
      this.nativeRadar?.soemdsp_jbradar_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeRadar.soemdsp_jbradar_create();
        }
        if (state.nativeHandle) {
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeRadar.soemdsp_jbradar_sample(
            state.nativeHandle,
            Number(options.frequency) || 0,
            Number(options.phaseOffset) || 0,
            Number(options.density) || 0,
            Number(options.sharp) || 0,
            Number(options.fade) || 0,
            Number(options.rotation) || 0,
            Number(options.direction) || 0,
            Number(options.shade) || 0,
            Number(options.lap) || 0,
            Number(options.ringcut) || 0,
            Number(options.pow1Up) || 0,
            Number(options.pow1Down) || 0,
            Number(options.pow2Bend) || 0,
            Number(options.phaseInv) || 0,
            Number(options.tunnelInv) || 0,
            Number(options.spiralReturn) || 0,
            Number(options.length) || 0,
            Number(options.ratio) || 0,
            Number(options.frontring) || 0,
            Number(options.zoom) || 0,
            Number(options.zDepth) || 0,
            Number(options.inner) || 0,
            Number(options.x) || 0,
            Number(options.y) || 0,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeRadar.soemdsp_jbradar_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeRadar.soemdsp_jbradar_y(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeRadarReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "jerobeam_radar",
          status: "disabled",
          message: String(error?.message || error || "native Jerobeam Radar failed"),
        });
      }
    }
    return this.radarSampleJs(state, options);
  }

  createChuaAttractorState() {
    return { resetWasHigh: false, x: 0.1, y: 0, z: 0, nativeHandle: 0 };
  }

  resetChuaAttractorState(state) {
    state.x = 0.1;
    state.y = 0;
    state.z = 0;
  }

  destroyChuaAttractorNativeState(state) {
    if (state?.nativeHandle && this.nativeChuaAttractor?.soemdsp_chua_attractor_destroy) {
      this.nativeChuaAttractor.soemdsp_chua_attractor_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  chuaDiode(x, m0, m1) {
    return m1 * x + 0.5 * (m0 - m1) * (Math.abs(x + 1) - Math.abs(x - 1));
  }

  chuaAttractorSampleJs(state, options = {}) {
    const resetHigh = Number(options.reset) > 0.5;
    if (resetHigh && !state.resetWasHigh) {
      this.resetChuaAttractorState(state);
    }
    state.resetWasHigh = resetHigh;
    const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
    const speed = Math.max(0, Number(options.speed) || 0);
    const alpha = Number(options.alpha) || 0;
    const beta = Number(options.beta) || 0;
    const m0 = Number(options.m0) || 0;
    const m1 = Number(options.m1) || 0;
    const dt = (0.6 * speed) / sampleRateValue;
    const steps = Math.max(1, Math.ceil(dt / 0.0004));
    const stepDt = steps > 0 ? dt / steps : 0;
    for (let i = 0; i < steps; i += 1) {
      const fx = this.chuaDiode(state.x, m0, m1);
      const dx = alpha * (state.y - state.x - fx);
      const dy = state.x - state.y + state.z;
      const dz = -beta * state.y;
      state.x += dx * stepDt;
      state.y += dy * stepDt;
      state.z += dz * stepDt;
      if (!Number.isFinite(state.x) || !Number.isFinite(state.y) || !Number.isFinite(state.z)) {
        this.resetChuaAttractorState(state);
        break;
      }
    }
    state.x = this.clampValue(state.x, -20, 20);
    state.y = this.clampValue(state.y, -20, 20);
    state.z = this.clampValue(state.z, -20, 20);
    return {
      x: this.clampValue(state.x / 2.0, -1, 1),
      y: this.clampValue(state.y / 0.5, -1, 1),
      z: this.clampValue(state.z / 3.5, -1, 1),
    };
  }

  chuaAttractorSample(state, options = {}) {
    if (
      this.nativeChuaAttractorReady &&
      this.nativeChuaAttractor?.soemdsp_chua_attractor_create &&
      this.nativeChuaAttractor?.soemdsp_chua_attractor_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeChuaAttractor.soemdsp_chua_attractor_create();
        }
        if (state.nativeHandle) {
          const resetActive = Number(options.reset) > 0.5 ? 1 : 0;
          const speed = Math.max(0, Number(options.speed) || 0);
          const alpha = Number(options.alpha) || 0;
          const beta = Number(options.beta) || 0;
          const m0 = Number(options.m0) || 0;
          const m1 = Number(options.m1) || 0;
          const sampleRateValue = Math.max(1, Number(options.sampleRate) || sampleRate || 44100);
          this.nativeChuaAttractor.soemdsp_chua_attractor_sample(
            state.nativeHandle,
            resetActive,
            speed,
            alpha,
            beta,
            m0,
            m1,
            sampleRateValue,
          );
          return {
            x: this.safeFilterNumber(this.nativeChuaAttractor.soemdsp_chua_attractor_x(state.nativeHandle), null),
            y: this.safeFilterNumber(this.nativeChuaAttractor.soemdsp_chua_attractor_y(state.nativeHandle), null),
            z: this.safeFilterNumber(this.nativeChuaAttractor.soemdsp_chua_attractor_z(state.nativeHandle), null),
          };
        }
      } catch (error) {
        this.nativeChuaAttractorReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "chua_attractor",
          status: "disabled",
          message: String(error?.message || error || "native Chua Attractor failed"),
        });
      }
    }
    return this.chuaAttractorSampleJs(state, options);
  }

  createChordMemoryState() {
    return {
      latchWasHigh: false,
      clearWasHigh: false,
      advanceWasHigh: false,
      writeIndex: 0,
      arpIndex: 0,
      slots: [0, 0, 0, 0],
      slotsActive: [false, false, false, false],
      nativeHandle: 0,
    };
  }

  chordMemorySample(state, options = {}) {
    if (this.nativeChordMemoryReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeChordMemory.soemdsp_chord_memory_create();
        }
        if (state.nativeHandle) {
          const gate = this.nativeChordMemory.soemdsp_chord_memory_sample(
            state.nativeHandle,
            Number(options.latch) || 0,
            Number(options.clear) || 0,
            Number(options.advance) || 0,
            Number(options.pitch) || 0,
          );
          return {
            "Note 1": this.safeFilterNumber(this.nativeChordMemory.soemdsp_chord_memory_note(state.nativeHandle, 0), null),
            "Note 2": this.safeFilterNumber(this.nativeChordMemory.soemdsp_chord_memory_note(state.nativeHandle, 1), null),
            "Note 3": this.safeFilterNumber(this.nativeChordMemory.soemdsp_chord_memory_note(state.nativeHandle, 2), null),
            "Note 4": this.safeFilterNumber(this.nativeChordMemory.soemdsp_chord_memory_note(state.nativeHandle, 3), null),
            Arp: this.safeFilterNumber(this.nativeChordMemory.soemdsp_chord_memory_arp(state.nativeHandle), null),
            Gate: gate,
          };
        }
      } catch (error) {
        this.nativeChordMemoryReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "chord_memory",
          status: "disabled",
          message: String(error?.message || error || "native Chord Memory failed"),
        });
      }
    }
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

  createTuringMachineState() {
    return {
      clockWasHigh: false,
      resetWasHigh: false,
      register: 0,
      nativeHandle: 0,
      selfClockPhase: 0,
      selfClockValue: 0,
    };
  }

  // Unwired Clock defaults to 0, a constant -- a bare Turing Machine would
  // never advance. So an unwired Clock free-runs at the module's own
  // Frequency parameter instead, letting it do something on its own without
  // requiring a separate Clock module wired in.
  advanceTuringMachineSelfClock(state, frequencyHz, rate) {
    const safeFrequency = Math.max(0.001, Number(frequencyHz) || 4);
    const safeRateValue = Math.max(1, Number(rate) || sampleRate || 44100);
    const increment = (2 * safeFrequency) / safeRateValue;
    state.selfClockPhase = (state.selfClockPhase || 0) + increment;
    if (state.selfClockPhase >= 1) {
      state.selfClockPhase -= Math.floor(state.selfClockPhase);
      state.selfClockValue = state.selfClockValue ? 0 : 1;
    }
    return state.selfClockValue || 0;
  }

  turingMachineSample(state, options = {}) {
    if (this.nativeTuringMachineReady) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeTuringMachine.soemdsp_turing_machine_create();
        }
        if (state.nativeHandle) {
          const level = Number(options.level) || 0;
          const cv = this.nativeTuringMachine.soemdsp_turing_machine_sample(
            state.nativeHandle,
            Number(options.clock) || 0,
            Number(options.reset) || 0,
            Math.round(Number(options.length) || 8),
            this.clampValue(Number(options.probability) || 0, 0, 1),
            level,
            Math.random(),
          );
          return {
            CV: this.safeFilterNumber(cv, null),
            Scale: this.nativeTuringMachine.soemdsp_turing_machine_scale(state.nativeHandle),
            Gate: this.safeFilterNumber(this.nativeTuringMachine.soemdsp_turing_machine_gate(state.nativeHandle, level), null),
          };
        }
      } catch (error) {
        this.nativeTuringMachineReady = false;
        state.nativeHandle = 0;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "turing_machine",
          status: "disabled",
          message: String(error?.message || error || "native Turing Machine failed"),
        });
      }
    }
    const clockHigh = Number(options.clock) > 0;
    const resetHigh = Number(options.reset) > 0;
    const length = Math.max(1, Math.min(16, Math.round(Number(options.length) || 8)));
    const probability = this.clampValue(Number(options.probability) || 0, 0, 1);
    const level = Number(options.level) || 0;
    if (resetHigh && !state.resetWasHigh) {
      state.register = 0;
    }
    state.resetWasHigh = resetHigh;
    if (clockHigh && !state.clockWasHigh) {
      const mask = (1 << length) - 1;
      const topBit = (state.register >> (length - 1)) & 1;
      const newBit = Math.random() < probability ? 1 - topBit : topBit;
      state.register = ((state.register << 1) | newBit) & mask;
    }
    state.clockWasHigh = clockHigh;
    const mask = (1 << length) - 1;
    const maxValue = mask > 0 ? mask : 1;
    const cv = (state.register / maxValue) * 2 - 1;
    const scaleMask = state.register & 0xFFF;
    const gate = state.register & 1;
    return {
      CV: cv * level,
      Scale: scaleMask,
      Gate: gate * level,
    };
  }

  createPitchQuantizerState() {
    return { hasOutput: false, lastOutput: 0, nativeHandle: 0 };
  }

  destroyPitchQuantizerNativeState(state) {
    if (state?.nativeHandle && this.nativePitchQuantizer?.soemdsp_pitch_quantizer_destroy) {
      this.nativePitchQuantizer.soemdsp_pitch_quantizer_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  pitchQuantizerMaskFromChoice(choiceIndex) {
    const masks = [4095, 2741, 1453, 661, 1193, 1365];
    const index = Math.max(0, Math.min(masks.length - 1, Math.round(Number(choiceIndex) || 0)));
    return masks[index];
  }

  pitchQuantizerSampleJs(state, options = {}) {
    const pitch = Number(options.pitch) || 0;
    const mask = options.hasScaleInput
      ? Math.round(Number(options.scaleInput) || 0) & 0xFFF
      : this.pitchQuantizerMaskFromChoice(options.scaleChoice);
    if (mask === 0) {
      return state.hasOutput ? state.lastOutput : pitch;
    }
    const semitoneFloat = pitch * 120;
    const rounded = Math.round(semitoneFloat);
    let bestSemitone = rounded;
    let bestDistance = Infinity;
    let found = false;
    for (let radius = 0; radius <= 12 && !found; radius += 1) {
      const signs = radius === 0 ? [0] : [-1, 1];
      for (const sign of signs) {
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

  pitchQuantizerSample(state, options = {}) {
    const pitch = Number(options.pitch) || 0;
    const mask = options.hasScaleInput
      ? Math.round(Number(options.scaleInput) || 0) & 0xFFF
      : this.pitchQuantizerMaskFromChoice(options.scaleChoice);
    if (
      this.nativePitchQuantizerReady &&
      this.nativePitchQuantizer?.soemdsp_pitch_quantizer_create &&
      this.nativePitchQuantizer?.soemdsp_pitch_quantizer_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativePitchQuantizer.soemdsp_pitch_quantizer_create();
        }
        if (state.nativeHandle) {
          const output = this.nativePitchQuantizer.soemdsp_pitch_quantizer_sample(
            state.nativeHandle,
            pitch,
            mask,
          );
          const safeOutput = this.safeFilterNumber(output, null);
          state.hasOutput = true;
          state.lastOutput = safeOutput;
          return safeOutput;
        }
      } catch (error) {
        this.nativePitchQuantizerReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "pitch_quantizer",
          status: "disabled",
          message: String(error?.message || error || "native Pitch Quantizer failed"),
        });
      }
    }
    return this.pitchQuantizerSampleJs(state, options);
  }

  createSurgeOscillatorState() {
    return {
      phase: 0,
      prevSyncIn: 0,
      hasPrevSyncIn: false,
      syncedThisSample: false,
      triangleIntegrator: 0,
      masterPhase: 0,
      internalSyncOut: 0,
      nativeHandle: 0,
    };
  }

  destroySurgeOscillatorNativeState(state) {
    if (state?.nativeHandle && this.nativeSurgeOscillator?.soemdsp_surge_oscillator_destroy) {
      this.nativeSurgeOscillator.soemdsp_surge_oscillator_destroy(state.nativeHandle);
      state.nativeHandle = 0;
    }
  }

  surgeOscillatorWaveformSampleJs(state, phaseCycle, phaseIncrement, waveform) {
    switch (waveform) {
      case 1:
        return this.polyBlepSquare(phaseCycle, phaseIncrement);
      case 2: {
        const next = this.clampValue(
          (state.triangleIntegrator + this.polyBlepSquare(phaseCycle, phaseIncrement) * phaseIncrement * 4) * 0.995,
          -1,
          1,
        );
        state.triangleIntegrator = next;
        return next;
      }
      case 3:
        return Math.sin(phaseCycle * Math.PI * 2);
      default:
        return -1 + phaseCycle * 2 - this.polyBlep(phaseCycle, phaseIncrement);
    }
  }

  surgeOscillatorSampleJs(state, options = {}) {
    const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
    const increment = this.clampValue((Number(options.frequencyHz) || 0) / sampleRate, -0.5, 0.5);
    const level = Number(options.level) || 0;

    state.phase = this.wrapValue(state.phase + increment, 0, 1);
    state.syncedThisSample = false;

    const masterIncrement = this.clampValue((Number(options.syncFrequencyHz) || 0) / sampleRate, -0.5, 0.5);
    state.masterPhase = this.wrapValue(state.masterPhase + masterIncrement, 0, 1);
    state.internalSyncOut = Math.sin(state.masterPhase * Math.PI * 2);

    const effectiveSyncIn = options.hasExternalSync ? (Number(options.syncIn) || 0) : state.internalSyncOut;

    if (state.hasPrevSyncIn && state.prevSyncIn <= 0 && effectiveSyncIn > 0) {
      const denom = effectiveSyncIn - state.prevSyncIn;
      const frac = denom > 1e-9 ? this.clampValue(-state.prevSyncIn / denom, 0, 1) : 0;
      state.phase = this.wrapValue((1 - frac) * increment, 0, 1);
      state.syncedThisSample = true;
    }
    state.prevSyncIn = effectiveSyncIn;
    state.hasPrevSyncIn = true;

    const phaseCycle = state.phase;
    const saw = this.surgeOscillatorWaveformSampleJs(state, phaseCycle, increment, 0) * level;
    const square = this.surgeOscillatorWaveformSampleJs(state, phaseCycle, increment, 1) * level;
    const tri = this.surgeOscillatorWaveformSampleJs(state, phaseCycle, increment, 2) * level;
    const sine = this.surgeOscillatorWaveformSampleJs(state, phaseCycle, increment, 3) * level;

    const waveform = Math.max(0, Math.min(3, Math.round(Number(options.waveform) || 0)));
    const out = [saw, square, tri, sine][waveform];

    return {
      Out: out,
      Saw: saw,
      Square: square,
      Tri: tri,
      Sine: sine,
      Synced: state.syncedThisSample ? 1 : 0,
      "Internal Sync": state.internalSyncOut,
    };
  }

  surgeOscillatorSample(state, options = {}) {
    if (
      this.nativeSurgeOscillatorReady &&
      this.nativeSurgeOscillator?.soemdsp_surge_oscillator_create &&
      this.nativeSurgeOscillator?.soemdsp_surge_oscillator_sample
    ) {
      try {
        if (!state.nativeHandle) {
          state.nativeHandle = this.nativeSurgeOscillator.soemdsp_surge_oscillator_create();
        }
        if (state.nativeHandle) {
          const sampleRate = Number(options.sampleRate) > 1 ? Number(options.sampleRate) : 48000;
          const frequencyHz = Number(options.frequencyHz) || 0;
          const syncIn = Number(options.syncIn) || 0;
          const hasExternalSync = options.hasExternalSync ? 1 : 0;
          const syncFrequencyHz = Number(options.syncFrequencyHz) || 0;
          const waveform = Math.max(0, Math.min(3, Math.round(Number(options.waveform) || 0)));
          const level = Number(options.level) || 0;
          this.nativeSurgeOscillator.soemdsp_surge_oscillator_sample(
            state.nativeHandle,
            frequencyHz,
            sampleRate,
            syncIn,
            hasExternalSync,
            syncFrequencyHz,
            waveform,
            level,
          );
          return {
            Out: Number(this.nativeSurgeOscillator.soemdsp_surge_oscillator_out(state.nativeHandle)) || 0,
            Saw: Number(this.nativeSurgeOscillator.soemdsp_surge_oscillator_saw(state.nativeHandle)) || 0,
            Square: Number(this.nativeSurgeOscillator.soemdsp_surge_oscillator_square(state.nativeHandle)) || 0,
            Tri: Number(this.nativeSurgeOscillator.soemdsp_surge_oscillator_tri(state.nativeHandle)) || 0,
            Sine: Number(this.nativeSurgeOscillator.soemdsp_surge_oscillator_sine(state.nativeHandle)) || 0,
            Synced: Number(this.nativeSurgeOscillator.soemdsp_surge_oscillator_synced(state.nativeHandle)) || 0,
            "Internal Sync": Number(this.nativeSurgeOscillator.soemdsp_surge_oscillator_internal_sync(state.nativeHandle)) || 0,
          };
        }
      } catch (error) {
        this.nativeSurgeOscillatorReady = false;
        this.port.postMessage({
          type: "nativeModuleStatus",
          name: "surge_oscillator",
          status: "disabled",
          message: String(error?.message || error || "native Surge Oscillator failed"),
        });
      }
    }
    return this.surgeOscillatorSampleJs(state, options);
  }

  spiralWrap01(value) {
    return value - Math.floor(value);
  }

  spiralFmod(value, divisor) {
    return value - Math.trunc(value / divisor) * divisor;
  }

  spiralTrisaw(phase, sharp) {
    const wrapped = this.spiralWrap01(phase);
    const warp = Math.max(0.001, Math.min(0.999, sharp));
    return wrapped < warp ? wrapped / warp : (1 - wrapped) / (1 - warp);
  }

  spiralNextPhasor(state, key, frequency, offset, sampleRate, bipolar = false) {
    const base = Number(state[key]) || 0;
    const current = this.spiralWrap01(base + offset);
    state[key] = this.spiralWrap01(base + frequency / sampleRate);
    return bipolar ? current * 2 - 1 : current;
  }

  spiralRotate(inX, inY, inZ, rotX, rotY) {
    const cosRotX = Math.cos(rotX);
    const sinRotX = Math.sin(rotX);
    const cosRotY = Math.cos(rotY);
    const sinRotY = Math.sin(rotY);
    const help11 = inX * cosRotX - inY * sinRotX;
    const help12 = inX * sinRotX + inY * cosRotX;
    const help21 = help11 * cosRotY - inZ * sinRotY;
    const help22 = help11 * sinRotY + inZ * cosRotY;
    return { x: help12, y: help21, z: help22 };
  }

  spiralShape(lophas, phasor, dense, div, morph) {
    const tau = Math.PI * 2;
    const piOver2 = Math.PI / 2;
    const piOver4 = Math.PI / 4;
    const clampMorph01 = this.clampValue(morph, 0, 1);
    const clampMorph02 = this.clampValue(morph, 0, 2);
    const formula001 = piOver2 * (lophas - 0.5) * clampMorph02 + piOver4;
    let loSin = Math.sin(formula001);
    let loCos = Math.cos(formula001);
    const formula002 = Math.pow(clampMorph01, 2);
    const oneZDiv = 1 / div;
    const loY = formula002 * (1 - oneZDiv * loSin);
    const loZ = formula002 * (1 - oneZDiv * loCos);
    const formula003 = Math.PI / (2 + 6 * (1 - clampMorph01)) * (lophas - 0.5) * clampMorph02 + piOver4;
    loSin = Math.sin(formula003);
    loCos = Math.cos(formula003);
    const tauPhasor = tau * phasor;
    const sp0Sin = Math.sin(tauPhasor);
    const sp0Cos = Math.cos(tauPhasor);
    const spiral0X = sp0Sin;
    const spiral0Y = sp0Cos * loSin;
    const spiral0Z = sp0Cos * loCos;
    let sp1Sin = Math.sin(dense * tauPhasor - piOver2);
    const sp1Cos = Math.cos(dense * tauPhasor - piOver2);
    sp1Sin *= -1;
    const sp1SinTimesSp0Sin = sp1Sin * sp0Sin;
    const spiral1X = div * sp1SinTimesSp0Sin;
    const spiral1Y = div * ((sp1Sin * sp0Cos) * loSin + sp1Cos * loCos);
    const spiral1Z = div * (sp1Cos * -loSin + (sp1Sin * sp0Cos) * loCos);
    let sp2Cos = Math.sin(dense * dense * tau * phasor);
    const sp2Sin = Math.cos(dense * dense * tau * phasor);
    sp2Cos *= -1;
    const divSquared = div * div;
    const spiral2X = divSquared * (sp2Cos * sp0Cos + sp2Sin * sp1SinTimesSp0Sin);
    const spiral2Y = divSquared * ((sp2Cos * -sp0Sin + sp2Sin * sp1Sin * sp0Cos) * loSin + (sp2Sin * sp1Cos) * loCos);
    const spiral2Z = divSquared * ((sp2Sin * sp1Cos) * -loSin + (sp2Cos * -sp0Sin + sp2Sin * sp1Sin * sp0Cos) * loCos);
    let waveX = spiral0X + spiral1X + spiral2X;
    let waveY = loY + spiral0Y + spiral1Y + spiral2Y;
    let waveZ = loZ + spiral0Z + spiral1Z + spiral2Z;
    let x = Math.exp(morph * Math.log(div));
    waveX *= x;
    waveY *= x;
    waveZ *= x;
    let y = 0;
    const formula004 = Math.exp(morph * Math.log(dense)) / 4;
    if (formula004 < 1) {
      y = Math.pow(1 - formula004, 2);
    }
    x = x * Math.sin(piOver4) * y;
    waveX -= x;
    waveY += x;
    return this.spiralRotate(waveX, waveY, waveZ, 0, 0);
  }

  spiralRender(inX, inY, inZ, zDepth) {
    const formula = zDepth * 1.25 * (inZ / 2 + 0.5);
    const multiplier = 1 + zDepth;
    return {
      left: (inX - formula * inX) * multiplier,
      right: (inY - formula * inY) * multiplier,
    };
  }

  jerobeamSpiralSample(options) {
    const tau = Math.PI * 2;
    const piOver2 = Math.PI / 2;
    const state = options.state;
    const dense = Math.max(Math.abs(options.density), 1e-6);
    const div = Math.max(options.size, 0.1);
    const logDense = Math.log(dense);
    const zDarkness = Math.pow(Math.pow(options.zAmount, 2) * 5 + 1, state.zHistory || 0);
    const mainPhasor = this.spiralNextPhasor(state, "phase", options.frequency * zDarkness, 0, options.sampleRate);
    const fphasEnds = this.spiralTrisaw(mainPhasor, options.sharp);
    const fphasMids = options.sharpCurveMult * (Math.asin((Math.asin(fphasEnds * 2 - 1) / Math.PI + 0.5) * 2 - 1) / Math.PI + 0.5);
    const lophas = options.sharpCurve * fphasMids + (1 - options.sharpCurve) * fphasEnds;
    const morph = this.spiralNextPhasor(state, "morph", options.morphSpeed, options.morph, options.sampleRate, true) + 0.5;
    let morph2 = morph + 1;
    if (morph2 > 1.5) {
      morph2 -= 2;
    }
    const fmodLophas = this.spiralFmod(lophas - 0.5, 1);
    let phas = this.spiralFmod(fmodLophas * Math.exp(morph * logDense) / 4 + 0.375, 1);
    const phas2 = this.spiralFmod(fmodLophas * Math.exp(morph2 * logDense) / 4 + 0.375, 1);
    phas += this.spiralNextPhasor(state, "position", options.positionSpeed, options.position, options.sampleRate);
    const wave1 = this.spiralShape(lophas, phas, dense, div, morph);
    const wave2 = this.spiralShape(lophas, phas2, dense, div, morph2);
    const switchAmount = Math.sin(Math.PI * morph) / 2 + 0.5;
    let waveX = wave1.x * switchAmount + wave2.x * (1 - switchAmount);
    let waveY = wave1.y * switchAmount + wave2.y * (1 - switchAmount);
    let waveZ = wave1.z * switchAmount + wave2.z * (1 - switchAmount);
    let volumeCorrection = 1 / (1 + div + div * div);
    const halfZDepth = options.zDepth / 2;
    volumeCorrection = volumeCorrection + halfZDepth - volumeCorrection * halfZDepth;
    waveX *= volumeCorrection;
    waveY *= volumeCorrection;
    waveZ *= volumeCorrection;
    waveY += 0.25;
    waveZ += 0.36;
    const rotated = this.spiralRotate(
      waveX,
      waveY,
      waveZ,
      -tau * this.spiralNextPhasor(state, "rotX", options.rotXSpeed, options.rotX, options.sampleRate),
      tau * this.spiralNextPhasor(state, "rotY", options.rotYSpeed, options.rotY, options.sampleRate) - piOver2,
    );
    const stereo = this.spiralRender(rotated.x, rotated.y, rotated.z, options.zDepth);
    state.zHistory = rotated.z;
    return { ...stereo, x: rotated.x, y: rotated.y, z: rotated.z };
  }

  evaluateFrame(frame, frames, inputs = [], rate = this.engineSampleRate || sampleRate, inputFrame = frame) {
    const safeRate = Math.max(1, Number(rate) || sampleRate || 44100);
    const frameValues = new Map();
    const mixInput = (nodeId, port = "In") => {
      const wired = (
        this.inputConnections.get(this.inputKey(nodeId, port)) || []
      ).reduce((sum, connection) => sum + this.readRuntimePortOutput(
        frameValues,
        connection.sourceNode,
        connection.sourcePort,
        frame,
        frames,
      ), 0);
      const impulseKey = this.inputKey(nodeId, port);
      return wired + this.evaluateTriggerPatchBindingByKey(impulseKey, frame, frames, safeRate, inputFrame);
    };
    const hasInput = (nodeId, port) => this.inputConnections.has(this.inputKey(nodeId, port));
    const incomingClockRate = (nodeId) => {
      const connection = (this.inputConnections.get(this.inputKey(nodeId, "Clock")) || [])[0];
      const sourceNode = this.nodes.get(connection?.sourceNode);
      return sourceNode?.type === "clock"
        ? Math.max(0, Number(sourceNode.params?.rate) || 0)
        : 0;
    };
    const graphSampleX = (node, nodeId) => {
      const mode = Math.round(this.readEffectiveParameter(node, "mode", 0, frame, frames, frameValues));
      if (mode <= 0) {
        return mixInput(nodeId);
      }
      const rateValue = Math.max(0, this.readEffectiveParameter(node, "rate", 1, frame, frames, frameValues));
      const phaseValue = this.readEffectiveParameter(node, "phase", 0, frame, frames, frameValues);
      const state = this.graphLfoStates.get(nodeId) || this.createGraphLfoState();
      this.graphLfoStates.set(nodeId, state);
      const resetValue = 0;
      const currentFrame = Number(inputFrame) || 0;
      if (state.lastReset <= 0 && resetValue > 0) {
        state.resetFrame = currentFrame;
      }
      state.lastReset = resetValue;
      const resetFrame = Number.isFinite(state.resetFrame) ? state.resetFrame : 0;
      return this.wrapValue(((currentFrame - resetFrame) / safeRate) * rateValue + phaseValue, 0, 1);
    };
    const graphOutputValue = (node, nodeId) => {
      const normalizedValue = this.graphValueAt(this.graphForNode(node), graphSampleX(node, nodeId), this.graphSmoothingModeForNode(node));
      const outputMin = this.readEffectiveParameter(node, "outputMin", 0, frame, frames, frameValues);
      const outputMax = this.readEffectiveParameter(node, "outputMax", 1, frame, frames, frameValues);
      return outputMin + normalizedValue * (outputMax - outputMin);
    };
    const graphInputValue = (nodeId, graphInput, x, fallback) => {
      const connection = (this.graphInputConnections.get(this.graphInputKey(nodeId, graphInput)) || [])[0];
      const source = connection ? this.nodes.get(connection.sourceNode) : null;
      if (!source || (source.type !== "graph" && source.type !== "graph2")) {
        return fallback;
      }
      return this.graphValueAt(this.graphForNode(source), this.clampValue(Number(x) || 0, 0, 1), this.graphSmoothingModeForNode(source));
    };

    for (const nodeId of this.order) {
      const node = this.nodes.get(nodeId);
      let value = 0;
      if (node?.type === "groupInput") {
        value = {
          Out: Number(this.externalGroupInputs?.get(nodeId)) || 0,
        };
      } else if (node?.type === "audioInput") {
        const input = inputs[0] || [];
        const leftChannel = input[0] || input[1] || null;
        const rightChannel = input[1] || input[0] || null;
        const left = Number(leftChannel?.[inputFrame]) || 0;
        const right = Number(rightChannel?.[inputFrame]) || left;
        const level = this.readEffectiveParameter(node, "level", 1, frame, frames, frameValues);
        value = {
          Left: left * level,
          Out: ((left + right) * 0.5) * level,
          Right: right * level,
        };
      } else if (node?.type === "audioPlayer") {
        const readParam = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.audioPlayerSample(
          node,
          nodeId,
          (port) => mixInput(nodeId, port),
          readParam,
          safeRate,
        );
      } else if (node?.type === "sineWavetable") {
        const phase = this.phases.get(nodeId) || 0;
        const phaseOffset = this.phaseRadians(
          this.readEffectiveParameter(node, "phase", 0, frame, frames, frameValues),
        );
        const baseFrequency = this.readEffectiveParameter(
          node,
          "freq",
          440,
          frame,
          frames,
          frameValues,
        );
        const freqInput = this.safeFilterNumber(mixInput(nodeId, "Freq"), null);
        const ampInput = this.safeFilterNumber(mixInput(nodeId, "Amplitude"), null);
        const pitchInput = this.clampValue(
          this.safeFilterNumber(mixInput(nodeId, "0.1V/Oct"), null),
          -1,
          1,
        );
        const pitchedFrequency = Math.max(0, (baseFrequency + freqInput) * (2 ** (pitchInput / 0.1)));
        const amplitude = Math.max(0, this.readEffectiveParameter(
          node,
          "amp",
          1,
          frame,
          frames,
          frameValues,
        ) + ampInput);
        const phaseIncrement = pitchedFrequency / safeRate;
        value = this.sineWavetableSample(phase + phaseOffset, pitchedFrequency, amplitude, safeRate);
        this.phases.set(
          nodeId,
          this.wrapValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
        );
      } else if (nodeLiveIsPolyBlepOscillatorType(node?.type)) {
        const resetState = this.oscResetStates.get(nodeId) || this.createOscResetState();
        this.oscResetStates.set(nodeId, resetState);
        const resetValue = this.safeFilterNumber(mixInput(nodeId, "Reset"), resetState);
        const resetEdge = resetState.lastReset <= 0 && resetValue > 0;
        resetState.lastReset = resetValue;
        const phase = resetEdge ? 0 : this.phases.get(nodeId) || 0;
        if (resetEdge) {
          this.triangleStates.set(nodeId, 0);
        }
        const phaseOffset = this.phaseRadians(
          this.readEffectiveParameter(node, "phase", 0, frame, frames, frameValues),
        );
        const frequency = this.readEffectiveParameter(
          node,
          "frequency",
          220,
          frame,
          frames,
          frameValues,
        );
        const waveform = this.readEffectiveParameter(
          node,
          "waveform",
          0,
          frame,
          frames,
          frameValues,
        );
        const incrementInput = this.safeFilterNumber(mixInput(nodeId, "Increment"), null);
        const pitchInput = this.clampValue(
          this.safeFilterNumber(mixInput(nodeId, "0.1V/Oct"), null),
          -1,
          1,
        );
        const pitchedFrequency = Math.max(0, frequency * (2 ** (pitchInput / 0.1)));
        const phaseIncrement = (pitchedFrequency / safeRate) + incrementInput;
        const level = this.readEffectiveParameter(node, "level", 1, frame, frames, frameValues);
        let nativeVector = null;
        if (node?.type === "polyBlep") {
          const polyBlepState = this.polyBlepStates.get(nodeId) || this.createPolyBlepState();
          this.polyBlepStates.set(nodeId, polyBlepState);
          nativeVector = this.polyBlepNativeVectorSample(
            polyBlepState,
            phase + phaseOffset,
            phaseIncrement,
            waveform,
            level,
            resetEdge,
          );
        }
        if (nativeVector) {
          value = {
            Out: nativeVector.out,
            Saw: nativeVector.saw,
            Ramp: nativeVector.ramp,
            Square: nativeVector.square,
            Tri: nativeVector.tri,
            Sine: nativeVector.sine,
            "Wave Out": nativeVector.out,
            Noise: nativeVector.out,
          };
        } else {
          const sampleOscillator = (sampleNodeId, sampleWaveform) => (
            node?.type === "fbPolyBlepOsc"
              ? this.forwardBackwardPolyBlepOscillatorSample(sampleNodeId, phase + phaseOffset, phaseIncrement, sampleWaveform)
              : this.oscillatorSample(sampleNodeId, phase + phaseOffset, phaseIncrement, sampleWaveform)
          );
          const selected = sampleOscillator(nodeId, waveform) * level;
          value = {
            Out: selected,
            Saw: sampleOscillator(`${nodeId}:saw`, 0) * level,
            Ramp: sampleOscillator(`${nodeId}:ramp`, 1) * level,
            Square: sampleOscillator(`${nodeId}:square`, 2) * level,
            Tri: sampleOscillator(`${nodeId}:tri`, 3) * level,
            Sine: sampleOscillator(`${nodeId}:sine`, 4) * level,
            "Wave Out": selected,
            Noise: selected,
          };
        }
        this.phases.set(
          nodeId,
          this.wrapValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
        );
      } else if (node?.type === "additiveOsc" || node?.type === "gpuAdditiveOsc") {
        const resetState = this.oscResetStates.get(nodeId) || this.createOscResetState();
        this.oscResetStates.set(nodeId, resetState);
        const resetValue = this.safeFilterNumber(mixInput(nodeId, "Reset"), resetState);
        const resetEdge = resetState.lastReset <= 0 && resetValue > 0;
        resetState.lastReset = resetValue;
        const phase = resetEdge ? 0 : this.phases.get(nodeId) || 0;
        const phaseOffset = this.phaseRadians(
          this.readEffectiveParameter(node, "phase", 0, frame, frames, frameValues),
        );
        const frequency = this.readEffectiveParameter(
          node,
          "frequency",
          220,
          frame,
          frames,
          frameValues,
        );
        const pitchInput = this.clampValue(
          this.safeFilterNumber(mixInput(nodeId, "0.1V/Oct"), null),
          -1,
          1,
        );
        const pitchedFrequency = Math.max(0, frequency * (2 ** (pitchInput / 0.1)));
        const incrementInput = this.safeFilterNumber(mixInput(nodeId, "Increment"), null);
        const phaseIncrement = (pitchedFrequency / safeRate) + incrementInput;
        const hasGraphInput = (
          (this.graphInputConnections.get(this.graphInputKey(nodeId, "Damping Graph")) || []).length > 0 ||
          (this.graphInputConnections.get(this.graphInputKey(nodeId, "Phase Graph")) || []).length > 0
        );
        // gpuAdditiveOsc previously had a GPU/WebGL queued-sample precompute
        // shortcut here (readGpuAdditiveQueuedSample) -- reported as badly
        // distorted/non-functional. Both oscillator types now go through the
        // exact same additive-sum path (native WASM when available), which
        // removes that broken code path entirely rather than trying to fix it.
        const additiveSample = this.additiveOscillatorSample(
            phase + phaseOffset,
            {
              frequency: pitchedFrequency,
              dampingFilterFrequency: this.readEffectiveParameter(node, "dampingFilterFrequency", 20000, frame, frames, frameValues),
              dampingGraphValueAt: (x) => graphInputValue(nodeId, "Damping Graph", x, 1),
              harmonics: this.readEffectiveParameter(node, "harmonics", 32, frame, frames, frameValues),
              harmonicPhaseAdd: this.readEffectiveParameter(node, "harmonicPhaseAdd", 0, frame, frames, frameValues),
              harmonicPhaseMultiply: this.readEffectiveParameter(node, "harmonicPhaseMultiply", 0, frame, frames, frameValues),
              hasGraphInput,
              level: this.readEffectiveParameter(node, "level", 0.35, frame, frames, frameValues),
              modA: this.readEffectiveParameter(node, "modA", 0.5, frame, frames, frameValues),
              phaseGraphValueAt: (x) => graphInputValue(nodeId, "Phase Graph", x, 0),
              waveform: this.readEffectiveParameter(node, "waveform", 1, frame, frames, frameValues),
            },
            safeRate,
          );
        value = { Out: additiveSample };
        this.phases.set(
          nodeId,
          this.wrapValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
        );
      } else if (node?.type === "ellipsoid") {
        const resetState = this.oscResetStates.get(nodeId) || this.createOscResetState();
        this.oscResetStates.set(nodeId, resetState);
        const resetValue = this.safeFilterNumber(mixInput(nodeId, "Reset"), resetState);
        const resetEdge = resetState.lastReset <= 0 && resetValue > 0;
        resetState.lastReset = resetValue;
        const phase = resetEdge ? 0 : this.phases.get(nodeId) || 0;
        const phaseOffset = this.phaseRadians(
          this.readEffectiveParameter(node, "phase", 0, frame, frames, frameValues),
        );
        const frequency = this.readEffectiveParameter(node, "frequency", 220, frame, frames, frameValues);
        const pitchInput = this.clampValue(
          this.safeFilterNumber(mixInput(nodeId, "0.1V/Oct"), null),
          -1,
          1,
        );
        const pitchedFrequency = Math.max(0, frequency * (2 ** (pitchInput / 0.1)));
        const incrementInput = this.safeFilterNumber(mixInput(nodeId, "Increment"), null);
        const phaseIncrement = (pitchedFrequency / safeRate) + incrementInput;
        let ellipsoidFrame = this.ellipsoidOutputFrames.get(nodeId);
        if (!ellipsoidFrame) {
          ellipsoidFrame = { Mono: 0, Out: 0, Wave: 0, "Wave Out": 0, X: 0, Y: 0 };
          this.ellipsoidOutputFrames.set(nodeId, ellipsoidFrame);
        }
        value = this.nativeEllipsoidVectorSample(
          ellipsoidFrame,
          phase + phaseOffset,
          this.readEffectiveParameter(node, "level", 1, frame, frames, frameValues),
          this.readEffectiveParameter(node, "offsetX", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "offsetY", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "scaleX", 1, frame, frames, frameValues),
          this.readEffectiveParameter(node, "scaleY", 1, frame, frames, frameValues),
          this.readEffectiveParameter(node, "shapeX", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "shapeY", 0, frame, frames, frameValues),
        );
        this.phases.set(
          nodeId,
          this.wrapValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
        );
      } else if (node?.type === "noiseGenerator") {
        const state = this.noiseGeneratorStates.get(nodeId) || this.createNoiseGeneratorState();
        this.noiseGeneratorStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.noiseGeneratorSample(
          state,
          {
            deviation: read("deviation", 0.5),
            level: read("level", 1),
            mean: read("mean", 0),
            mode: read("mode", 0),
            seed: read("seed", 1),
          },
          nodeId,
        );
      } else if (node?.type === "randomWalk") {
        const state = this.randomWalkStates.get(nodeId) || this.createRandomWalkState();
        this.randomWalkStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.randomWalkSample(
          state,
          {
            frequency: read("frequency", 2),
            jitter: read("jitter", 0.25),
            level: read("level", 1),
            method: read("method", 3),
            seed: read("seed", 1),
          },
          safeRate,
          nodeId,
        );
      } else if (node?.type === "fractalBrownianNoise") {
        const state = this.fractalBrownianNoiseStates.get(nodeId) || this.createFractalBrownianNoiseState();
        this.fractalBrownianNoiseStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.fractalBrownianNoiseVector(
          state,
          {
            frequency: read("frequency", 0.5),
            level: read("level", 1),
            octaves: read("octaves", 4),
            persistence: read("persistence", 0.5),
            scale: read("scale", 1),
            seed: read("seed", 1),
          },
          safeRate,
          nodeId,
          mixInput(nodeId, "Reset"),
        );
      } else if (node?.type === "clock") {
        const state = this.clockStates.get(nodeId) || this.createClockState();
        this.clockStates.set(nodeId, state);
        value = this.clockSample(
          state,
          mixInput(nodeId, "Reset"),
          this.readEffectiveParameter(node, "phase", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "rate", 2, frame, frames, frameValues),
          this.readEffectiveParameter(node, "duty", 0.5, frame, frames, frameValues),
          this.readEffectiveParameter(node, "level", 1, frame, frames, frameValues),
          safeRate,
        );
      } else if (node?.type === "transport") {
        value = this.transportSample(
          {
            amplitude: read("amplitude", 1),
            divisions: read("divisions", 0),
          },
          frame,
          safeRate,
        );
      } else if (node?.type === "randomClock") {
        const state = this.randomClockStates.get(nodeId) || this.createRandomClockState();
        this.randomClockStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.randomClockSample(
          state,
          mixInput(nodeId, "Reset"),
          {
            duty: read("duty", 0.5),
            level: read("level", 1),
            maxSeconds: read("maxSeconds", 1),
            minSeconds: read("minSeconds", 0.25),
            seed: read("seed", 1),
            threshold: read("threshold", 0),
            triggerTime: read("triggerTime", 0.01),
          },
          safeRate,
          nodeId,
        );
      } else if (node?.type === "clockDivider") {
        const state = this.clockDividerStates.get(nodeId) || this.createTriggerDividerState();
        this.clockDividerStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const division = Math.max(1, Math.min(64, Math.round(read("division", 2))));
        const sourceRate = incomingClockRate(nodeId);
        const pulseTime = sourceRate > 0
          ? this.clampValue(read("duty", 0.5), 0.01, 1) * division / sourceRate
          : 0.01;
        value = this.triggerDividerSample(
          state,
          mixInput(nodeId, "Clock"),
          mixInput(nodeId, "Reset"),
          {
            division,
            level: read("level", 1),
            pulseTime,
            threshold: read("threshold", 0),
          },
          safeRate,
        );
      } else if (node?.type === "delayedTrigger") {
        const state = this.delayedTriggerStates.get(nodeId) || this.createDelayedTriggerState();
        this.delayedTriggerStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.delayedTriggerSample(
          state,
          mixInput(nodeId, "Trigger"),
          mixInput(nodeId, "Reset"),
          {
            delay: read("delay", 0.1),
            level: read("level", 1),
            pulseTime: read("pulseTime", 0.01),
            threshold: read("threshold", 0),
          },
          safeRate,
        );
      } else if (node?.type === "triggerCounter") {
        const state = this.triggerCounterStates.get(nodeId) || this.createTriggerCounterState();
        this.triggerCounterStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.triggerCounterSample(
          state,
          mixInput(nodeId, "Trigger"),
          mixInput(nodeId, "Reset"),
          {
            countMax: read("countMax", 8),
            increment: read("increment", 1),
            level: read("level", 1),
            pulseTime: read("pulseTime", 0.01),
            threshold: read("threshold", 0),
          },
          safeRate,
        );
      } else if (node?.type === "triggerDivider") {
        const state = this.triggerDividerStates.get(nodeId) || this.createTriggerDividerState();
        this.triggerDividerStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.triggerDividerSample(
          state,
          mixInput(nodeId, "Trigger"),
          mixInput(nodeId, "Reset"),
          {
            division: read("division", 2),
            level: read("level", 1),
            pulseTime: read("pulseTime", 0.01),
            threshold: read("threshold", 0),
          },
          safeRate,
        );
      } else if (node?.type === "stepSequencer") {
        const state = this.stepSequencerStates.get(nodeId) || this.createStepSequencerState();
        this.stepSequencerStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.stepSequencerSample(
          state,
          mixInput(nodeId, "Trigger"),
          mixInput(nodeId, "Reset"),
          {
            level: read("level", 1),
            steps: read("steps", 8),
            threshold: read("threshold", 0),
            values: [
              read("step1", 0),
              read("step2", 0.25),
              read("step3", 0.5),
              read("step4", 0.75),
              read("step5", 1),
              read("step6", 0.75),
              read("step7", 0.5),
              read("step8", 0.25),
            ],
          },
        );
      } else if (node?.type === "spiral") {
        const state = this.spiralStates.get(nodeId) || this.createSpiralState();
        this.spiralStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(
          node,
          key,
          fallback,
          frame,
          frames,
          frameValues,
        );
        const spiral = this.jerobeamSpiralSample({
          density: read("density", 1),
          frequency: read("frequency", 440),
          morph: read("morph", 0),
          morphSpeed: read("morphSpeed", 0),
          position: read("position", 0),
          positionSpeed: read("positionSpeed", 0),
          rotX: read("rotX", 0),
          rotXSpeed: read("rotXSpeed", 0),
          rotY: read("rotY", 0),
          rotYSpeed: read("rotYSpeed", 0),
          sampleRate: safeRate,
          sharp: read("sharp", 0.5),
          sharpCurve: read("sharpCurve", 0),
          sharpCurveMult: read("sharpCurveMult", 1),
          size: read("size", 0.5),
          state,
          zAmount: read("zAmount", 0),
          zDepth: read("zDepth", 0),
        });
        const level = read("level", 1);
        value = {
          X: spiral.x * level,
          Y: spiral.y * level,
          Z: spiral.z * level,
        };
      } else if (node?.type === "fractalSpiral") {
        const state = this.fractalSpiralStates.get(nodeId) || this.createFractalSpiralState();
        this.fractalSpiralStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(
          node,
          key,
          fallback,
          frame,
          frames,
          frameValues,
        );
        const fractal = this.fractalSpiralSample(state, {
          frequency: read("frequency", 1),
          gain: read("gain", 0.5),
          growth: read("growth", 1.5),
          lacunarity: read("lacunarity", 2),
          octaves: read("octaves", 5),
          sampleRate: safeRate,
          size: read("size", 0.5),
          spin: read("spin", 0.05),
          twist: read("twist", 0.381966),
        });
        const fractalLevel = read("level", 1);
        value = {
          X: fractal.x * fractalLevel,
          Y: fractal.y * fractalLevel,
          Z: fractal.z * fractalLevel,
        };
      } else if (node?.type === "logSpiral") {
        const state = this.logSpiralStates.get(nodeId) || this.createLogSpiralState();
        this.logSpiralStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(
          node,
          key,
          fallback,
          frame,
          frames,
          frameValues,
        );
        const logSpiral = this.logSpiralSample(state, {
          frequency: read("frequency", 1),
          growth: read("growth", 3),
          sampleRate: safeRate,
          size: read("size", 0.5),
          spin: read("spin", 0.05),
          turns: read("turns", 4),
        });
        const logSpiralLevel = read("level", 1);
        value = {
          X: logSpiral.x * logSpiralLevel,
          Y: logSpiral.y * logSpiralLevel,
          Z: logSpiral.z * logSpiralLevel,
        };
      } else if (node?.type === "lorenzAttractor") {
        const state = this.lorenzAttractorStates.get(nodeId) || this.createLorenzAttractorState();
        this.lorenzAttractorStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(
          node,
          key,
          fallback,
          frame,
          frames,
          frameValues,
        );
        const lorenz = this.lorenzAttractorSample({
          beta: read("beta", 8 / 3),
          reset: mixInput(nodeId, "Reset"),
          rho: read("rho", 28),
          rotate: read("rotate", 0),
          sampleRate: safeRate,
          scale: read("scale", 1),
          sigma: read("sigma", 10),
          speed: read("speed", 1),
          state,
          zDepth: read("zDepth", 0.4),
        });
        const level = read("level", 1);
        value = {
          X: lorenz.x * level,
          Y: lorenz.y * level,
          Z: lorenz.z * level,
        };
      } else if (node?.type === "logisticMap") {
        const state = this.logisticMapStates.get(nodeId) || this.createLogisticMapState();
        this.logisticMapStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = {
          Out: this.logisticMapSample(state, {
            level: read("level", 1),
            r: read("r", 3.9),
            rate: read("rate", 8),
            reset: mixInput(nodeId, "Reset"),
            sampleRate: safeRate,
            seed: read("seed", 0.5),
          }),
        };
      } else if (node?.type === "henonMap") {
        const state = this.henonMapStates.get(nodeId) || this.createHenonMapState();
        this.henonMapStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const henon = this.henonMapSample(state, {
          a: read("a", 1.4),
          b: read("b", 0.3),
          rate: read("rate", 8),
          reset: mixInput(nodeId, "Reset"),
          sampleRate: safeRate,
          seedX: read("seedX", 0.1),
          seedY: read("seedY", 0.1),
        });
        const henonLevel = read("level", 1);
        value = {
          X: henon.x * henonLevel,
          Y: henon.y * henonLevel,
        };
      } else if (node?.type === "wirdoSpiral") {
        const state = this.wirdoSpiralStates.get(nodeId) || this.createWirdoSpiralState();
        this.wirdoSpiralStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const wirdo = this.wirdoSpiralSample(state, {
          cross: read("cross", 0),
          cut: read("cut", 1000),
          density: read("density", 0.8),
          frequency: read("frequency", 8),
          length: read("length", 1),
          reset: mixInput(nodeId, "Reset"),
          ringCut: read("ringCut", 10),
          rotate: read("rotate", 0),
          sampleRate: safeRate,
          scrap: read("scrap", 1),
          sharp: read("sharp", 0),
          splashDensity: read("splashDensity", 0),
          splashDepth: read("splashDepth", 0),
          splashSpeed: read("splashSpeed", 0),
          syncCut: read("syncCut", 1),
        });
        const wirdoLevel = read("level", 1);
        value = {
          X: wirdo.x * wirdoLevel,
          Y: wirdo.y * wirdoLevel,
        };
      } else if (node?.type === "blubb") {
        const state = this.blubbStates.get(nodeId) || this.createBlubbState();
        this.blubbStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const blubb = this.blubbSample(state, {
          frequency: read("frequency", 8),
          reset: mixInput(nodeId, "Reset"),
          rotX: read("rotX", 0),
          rotY: read("rotY", 0),
          sampleRate: safeRate,
          shape: read("shape", 0),
          zDepth: read("zDepth", 0),
        });
        const blubbLevel = read("level", 1);
        value = {
          X: blubb.x * blubbLevel,
          Y: blubb.y * blubbLevel,
        };
      } else if (node?.type === "mushroom") {
        const state = this.mushroomStates.get(nodeId) || this.createMushroomState();
        this.mushroomStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const mushroom = this.mushroomSample(state, {
          apart: read("apart", 0),
          capRotation: read("capRotation", 0),
          capStemTransition: read("capStemTransition", 0.1),
          clusterRotation: read("clusterRotation", 0),
          clusterRotationSpeed: read("clusterRotationSpeed", 0),
          density: read("density", 3),
          frequency: read("frequency", 8),
          grow: read("grow", 1),
          head: read("head", 0.6667),
          numMushrooms: read("numMushrooms", 1),
          phaseOffset: read("phaseOffset", 0),
          reset: mixInput(nodeId, "Reset"),
          sampleRate: safeRate,
          sharp: read("sharp", 0),
          spread: read("spread", 0.5),
          stem: read("stem", 0),
          stemRotationSpeed: read("stemRotationSpeed", 0),
          width: read("width", 1),
          wobble: read("wobble", 0.0625),
        });
        const mushroomLevel = read("level", 1);
        value = {
          X: mushroom.x * mushroomLevel,
          Y: mushroom.y * mushroomLevel,
        };
      } else if (node?.type === "boing") {
        const state = this.boingStates.get(nodeId) || this.createBoingState();
        this.boingStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const boing = this.boingSample(state, {
          boing: read("boing", 0),
          boingStrength: read("boingStrength", 0),
          density: read("density", 1),
          dir: read("dir", 0),
          ends: read("ends", 0),
          frequency: read("frequency", 8),
          reset: mixInput(nodeId, "Reset"),
          rotX: read("rotX", 0),
          rotY: read("rotY", 0),
          sampleRate: safeRate,
          shape: read("shape", 0),
          sharpness: read("sharpness", 0),
          volume: read("volume", 1),
          volumePreJump: read("volumePreJump", 0),
          zAmount: read("zAmount", 0),
          zDepth: read("zDepth", 0),
        });
        const boingLevel = read("level", 1);
        value = {
          X: boing.x * boingLevel,
          Y: boing.y * boingLevel,
        };
      } else if (node?.type === "torus") {
        const state = this.torusStates.get(nodeId) || this.createTorusState();
        this.torusStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const torus = this.torusSample(state, {
          balance: read("balance", 0),
          darkAngle: read("darkAngle", 0),
          darkIntensity: read("darkIntensity", 0),
          density: read("density", 1),
          frequency: read("frequency", 8),
          length: read("length", 0),
          quantizeDensity: read("quantizeDensity", 1),
          quantizeSubDensity: read("quantizeSubDensity", 1),
          reset: mixInput(nodeId, "Reset"),
          rotX: read("rotX", 0),
          rotY: read("rotY", 0),
          rotZ: read("rotZ", 0),
          sampleRate: safeRate,
          sharp: read("sharp", 0.5),
          size: read("size", 1),
          subdensity: read("subdensity", 0),
          wander: read("wander", 0),
          zAngleX: read("zAngleX", 0),
          zAngleY: read("zAngleY", 0),
          zDepth: read("zDepth", 0),
        });
        const torusLevel = read("level", 1);
        value = {
          X: torus.x * torusLevel,
          Y: torus.y * torusLevel,
        };
      } else if (node?.type === "keplerBouwkamp") {
        const state = this.keplerBouwkampStates.get(nodeId) || this.createKeplerBouwkampState();
        this.keplerBouwkampStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const kepler = this.keplerBouwkampSample(state, {
          circles: read("circles", 0.5),
          frequency: read("frequency", 8),
          length: read("length", 1),
          reset: mixInput(nodeId, "Reset"),
          rotation: read("rotation", 0),
          sampleRate: safeRate,
          start: read("start", 3),
          tri: read("tri", 0),
          zoom: read("zoom", 0),
        });
        const keplerLevel = read("level", 1);
        value = {
          X: kepler.x * keplerLevel,
          Y: kepler.y * keplerLevel,
        };
      } else if (node?.type === "nyquistShannon") {
        const state = this.nyquistShannonStates.get(nodeId) || this.createNyquistShannonState();
        this.nyquistShannonStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const nyquist = this.nyquistShannonSample(state, {
          artifact: read("artifact", 0),
          enableToneModFreq: read("enableToneModFreq", 0),
          enableToneModNote: read("enableToneModNote", 0),
          enableToneModPitch: read("enableToneModPitch", 1),
          frequencyA: read("frequencyA", 440),
          frequencyB: read("frequencyB", 5),
          midiNoteRaw: read("midiNoteRaw", 48),
          phaseOffset: read("phaseOffset", 0),
          rate: read("rate", 20),
          reset: mixInput(nodeId, "Reset"),
          sampleDots: read("sampleDots", 0),
          sampleRate: safeRate,
          subPhase: read("subPhase", 0),
          subPhaseRotationSpeed: read("subPhaseRotationSpeed", 0),
          tone: read("tone", 0),
          toneSmoothTime: read("toneSmoothTime", 0.01),
        });
        const nyquistLevel = read("level", 1);
        value = {
          X: nyquist.x * nyquistLevel,
          Y: nyquist.y * nyquistLevel,
        };
      } else if (node?.type === "radar") {
        const state = this.radarStates.get(nodeId) || this.createRadarState();
        this.radarStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const radar = this.radarSample(state, {
          density: read("density", 1),
          direction: read("direction", 0),
          fade: read("fade", 1),
          frequency: read("frequency", 1),
          frontring: read("frontring", 0),
          inner: read("inner", 0),
          lap: read("lap", 0),
          length: read("length", 1),
          phaseInv: read("phaseInv", 0),
          phaseOffset: read("phaseOffset", 0),
          pow1Down: read("pow1Down", 0),
          pow1Up: read("pow1Up", 0),
          pow2Bend: read("pow2Bend", 0),
          ratio: read("ratio", 0),
          reset: mixInput(nodeId, "Reset"),
          ringcut: read("ringcut", 0),
          rotation: read("rotation", 0),
          sampleRate: safeRate,
          shade: read("shade", 1),
          sharp: read("sharp", 0),
          spiralReturn: read("spiralReturn", 0),
          tunnelInv: read("tunnelInv", 0),
          x: read("x", 0),
          y: read("y", 0),
          zDepth: read("zDepth", 0),
          zoom: read("zoom", 0),
        });
        const radarLevel = read("level", 1);
        value = {
          X: radar.x * radarLevel,
          Y: radar.y * radarLevel,
        };
      } else if (node?.type === "chuaAttractor") {
        const state = this.chuaAttractorStates.get(nodeId) || this.createChuaAttractorState();
        this.chuaAttractorStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const chua = this.chuaAttractorSample(state, {
          alpha: read("alpha", 15.6),
          beta: read("beta", 28),
          m0: read("m0", -1.143),
          m1: read("m1", -0.714),
          reset: mixInput(nodeId, "Reset"),
          sampleRate: safeRate,
          speed: read("speed", 1),
        });
        const chuaLevel = read("level", 1);
        value = {
          X: chua.x * chuaLevel,
          Y: chua.y * chuaLevel,
          Z: chua.z * chuaLevel,
        };
      } else if (node?.type === "chordMemory") {
        const state = this.chordMemoryStates.get(nodeId) || this.createChordMemoryState();
        this.chordMemoryStates.set(nodeId, state);
        value = this.chordMemorySample(state, {
          advance: mixInput(nodeId, "Advance"),
          clear: mixInput(nodeId, "Clear"),
          latch: mixInput(nodeId, "Latch"),
          pitch: mixInput(nodeId, "Pitch"),
        });
      } else if (node?.type === "turingMachine") {
        const state = this.turingMachineStates.get(nodeId) || this.createTuringMachineState();
        this.turingMachineStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const hasClockInput = hasInput(nodeId, "Clock");
        const clock = hasClockInput
          ? mixInput(nodeId, "Clock")
          : this.advanceTuringMachineSelfClock(state, read("frequency", 4), safeRate);
        value = this.turingMachineSample(state, {
          clock,
          length: read("length", 8),
          level: read("level", 1),
          probability: read("probability", 0.25),
          reset: mixInput(nodeId, "Reset"),
        });
      } else if (node?.type === "changeDetector") {
        const state = this.changeDetectorStates.get(nodeId) || this.createChangeDetectorState();
        this.changeDetectorStates.set(nodeId, state);
        const changeDetector = this.changeDetectorSample(state, mixInput(nodeId));
        value = {
          "+": changeDetector.up,
          "~": changeDetector.same,
          "-": changeDetector.down,
          "*": changeDetector.changed,
        };
      } else if (node?.type === "yellowjacketFilter") {
        const state = this.yellowjacketFilterStates.get(nodeId) || this.createYellowjacketFilterState();
        this.yellowjacketFilterStates.set(nodeId, state);
        value = this.yellowjacketFilterSample(
          state,
          mixInput(nodeId),
          {
            chaos: this.readEffectiveParameter(node, "chaos", 0, frame, frames, frameValues),
            frequency: this.readEffectiveParameter(node, "frequency", 0.5, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "superloveFilter") {
        const state = this.superloveFilterStates.get(nodeId) || this.createSuperloveFilterState();
        this.superloveFilterStates.set(nodeId, state);
        value = this.superloveFilterSample(
          state,
          mixInput(nodeId),
          {
            chaos: this.readEffectiveParameter(node, "chaos", 0.5, frame, frames, frameValues),
            frequency: this.readEffectiveParameter(node, "frequency", 0.5, frame, frames, frameValues),
            mode: this.readEffectiveParameter(node, "mode", 0, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "rsmetFilter") {
        const state = this.rsmetFilterStates.get(nodeId) || this.createRsmetFilterState();
        this.rsmetFilterStates.set(nodeId, state);
        value = this.rsmetFilterSample(
          state,
          mixInput(nodeId),
          {
            chaos: this.readEffectiveParameter(node, "chaos", 0, frame, frames, frameValues),
            frequency: this.readEffectiveParameter(node, "frequency", 0.5, frame, frames, frameValues),
            mode: this.readEffectiveParameter(node, "mode", 0, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "chaoticPhaseLockingFilter") {
        const state = this.chaoticPhaseLockingFilterStates.get(nodeId) || this.createChaoticPhaseLockingFilterState();
        this.chaoticPhaseLockingFilterStates.set(nodeId, state);
        value = this.chaoticPhaseLockingFilterSample(
          state,
          mixInput(nodeId),
          {
            chaos: this.readEffectiveParameter(node, "chaos", 1, frame, frames, frameValues),
            frequency: this.readEffectiveParameter(node, "frequency", 0.5, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "dsfOscillator") {
        const state = this.dsfOscillatorStates.get(nodeId) || this.createDsfOscillatorState();
        this.dsfOscillatorStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.dsfOscillatorSample(state, {
          frequencyHz: Math.max(0, read("frequency", 100)),
          sampleRate: this.engineSampleRate || sampleRate,
          waveform: read("waveform", 1),
          morph: read("morph", 1),
          pulseWidth: read("pulseWidth", 0.5),
          blend: read("blend", 0.5),
          level: read("level", 1),
        });
      } else if (node?.type === "quadratureOscillator") {
        const state = this.quadratureOscillatorStates.get(nodeId) || this.createQuadratureOscillatorState();
        this.quadratureOscillatorStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const resetGate = this.safeFilterNumber(mixInput(nodeId, "Reset"), null);
        const baseFrequency = read("freq", 440);
        const freqInput = this.safeFilterNumber(mixInput(nodeId, "Freq"), null);
        const pitchInput = this.clampValue(
          this.safeFilterNumber(mixInput(nodeId, "0.1V/Oct"), null),
          -1,
          1,
        );
        const pitchedFrequency = Math.max(0, (baseFrequency + freqInput) * (2 ** (pitchInput / 0.1)));
        const ampInput = this.safeFilterNumber(mixInput(nodeId, "Amplitude"), null);
        const amplitude = Math.max(0, read("amp", 1) + ampInput);
        value = this.quadratureOscillatorSample(state, {
          resetGate,
          phaseCycles: read("phase", 0),
          frequencyHz: pitchedFrequency,
          sampleRate: this.engineSampleRate || sampleRate,
          amplitude,
        });
      } else if (node?.type === "robinSupersaw") {
        const state = this.robinSupersawStates.get(nodeId) || this.createRobinSupersawState();
        this.robinSupersawStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const baseFrequency = Math.max(0, read("frequency", 100));
        const pitchInput = this.clampValue(this.safeFilterNumber(mixInput(nodeId, "0.1V/Oct"), null), -1, 1);
        const referenceMidiNote = Number.isFinite(this.pitchReferenceMidiNote) ? this.pitchReferenceMidiNote : 48;
        const referenceVoltage = referenceMidiNote / 120;
        const pitchedFrequency = Math.max(0, baseFrequency * (2 ** ((pitchInput - referenceVoltage) / 0.1)));
        value = this.robinSupersawSample(state, {
          frequencyHz: pitchedFrequency,
          sampleRate: this.engineSampleRate || sampleRate,
          detuneCents: read("detuneCents", 30),
          voices: read("voices", 7),
          level: read("level", 1),
        });
      } else if (node?.type === "flowerChildFilter") {
        const state = this.flowerChildFilterStates.get(nodeId) || this.createFlowerChildFilterState();
        this.flowerChildFilterStates.set(nodeId, state);
        value = this.flowerChildFilterSample(
          state,
          mixInput(nodeId),
          {
            frequency: this.readEffectiveParameter(node, "frequency", 0.5, frame, frames, frameValues),
            mode: this.readEffectiveParameter(node, "mode", 0, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "resonatorFilter") {
        const state = this.resonatorFilterStates.get(nodeId) || this.createResonatorFilterState();
        this.resonatorFilterStates.set(nodeId, state);
        value = this.resonatorFilterSample(
          state,
          mixInput(nodeId),
          {
            chaos: this.readEffectiveParameter(node, "chaos", 0, frame, frames, frameValues),
            frequency: this.readEffectiveParameter(node, "frequency", 0.5, frame, frames, frameValues),
            mode: this.readEffectiveParameter(node, "mode", 0, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "humanFilter") {
        const state = this.humanFilterStates.get(nodeId) || this.createHumanFilterState();
        this.humanFilterStates.set(nodeId, state);
        value = this.humanFilterSample(
          state,
          mixInput(nodeId),
          {
            chaos: this.readEffectiveParameter(node, "chaos", 0, frame, frames, frameValues),
            frequency: this.readEffectiveParameter(node, "frequency", 0.5, frame, frames, frameValues),
            mode: this.readEffectiveParameter(node, "mode", 0, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "pitchQuantizer") {
        const state = this.pitchQuantizerStates.get(nodeId) || this.createPitchQuantizerState();
        this.pitchQuantizerStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = {
          "0.1V/Oct": this.pitchQuantizerSample(state, {
            hasScaleInput: hasInput(nodeId, "Scale"),
            pitch: mixInput(nodeId, "0.1V/Oct"),
            scaleChoice: read("scale", 1),
            scaleInput: mixInput(nodeId, "Scale"),
          }),
        };
      } else if (node?.type === "surgeOscillator") {
        const state = this.surgeOscillatorStates.get(nodeId) || this.createSurgeOscillatorState();
        this.surgeOscillatorStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const baseFrequency = Math.max(0, read("frequency", 220));
        const pitchInput = this.clampValue(
          this.safeFilterNumber(mixInput(nodeId, "0.1V/Oct"), null),
          -10,
          10,
        );
        const frequencyHz = Math.max(0, baseFrequency * (2 ** (pitchInput / 0.1)));
        value = this.surgeOscillatorSample(state, {
          frequencyHz,
          sampleRate: this.engineSampleRate || sampleRate,
          syncIn: mixInput(nodeId, "Sync"),
          hasExternalSync: hasInput(nodeId, "Sync"),
          syncFrequencyHz: read("syncFrequency", 50),
          waveform: read("waveform", 0),
          level: read("level", 1),
        });
      } else if (node?.type === "midiOut") {
        const hasMidiInput = this.inputConnections.has(this.inputKey(nodeId, "MIDI Number"));
        const midiNumber = this.clampValue(Math.round(this.readEffectiveParameter(
          node,
          "midiNumber",
          60,
          frame,
          frames,
          frameValues,
        )), 0, 127);
        const outputMidiNumber = hasMidiInput
          ? this.clampValue(Math.round(Number(mixInput(nodeId, "MIDI Number")) || 0), 0, 127)
          : midiNumber;
        value = {
          "Full Value": outputMidiNumber,
          Normalized: outputMidiNumber / 127,
        };
      } else if (node?.type === "midiNotePitch") {
        const pitch = this.clampValue((
          Number(mixInput(nodeId, "MIDI Note")) +
          Number(mixInput(nodeId, "Octave Offset")) * 12 +
          Number(mixInput(nodeId, "Pitch Offset"))
        ) || 0, 0, 127);
        value = {
          Frequency: 440 * (2 ** ((pitch - 69) / 12)),
          "Pitch 0-1": pitch / 127,
          "Pitch 0-127": pitch,
        };
      } else if (node?.type === "keyboardController") {
        const signal = this.midiKeyboardSignal || {};
        const resetActive = hasInput(nodeId, "Reset") && Number(mixInput(nodeId, "Reset")) > 0;
        const manualRawMidi = Number.isFinite(Number(signal.rawMidi))
          ? Number(signal.rawMidi)
          : Number(signal.midi) || 60;
        const manualOctave = Number(signal.octave) || 0;
        const octave = hasInput(nodeId, "Octave")
          ? this.clampValue(Math.round(Number(mixInput(nodeId, "Octave")) || 0), -6, 6)
          : manualOctave;
        const rawMidi = resetActive
          ? 60
          : (hasInput(nodeId, "MIDI Note") ? Number(mixInput(nodeId, "MIDI Note")) || 0 : manualRawMidi);
        const midi = this.clampValue(Math.round(rawMidi + octave * 12), 0, 127);
        const automatedPitch = resetActive || hasInput(nodeId, "MIDI Note") || hasInput(nodeId, "Octave");
        const key = automatedPitch
          ? this.clampValue(Math.round(rawMidi) - 48, 0, 24)
          : this.clampValue(Number(signal.keyIndex) || 12, 0, 24);
        const frequency = 440 * (2 ** ((midi - 69) / 12));
        const outputFrequency = Math.max(0, frequency);
        const increment = Math.max(0, outputFrequency / safeRate);
        const q = automatedPitch
          ? key / 24
          : this.clampValue(Number(signal.keyQuantized) || key / 24, 0, 1);
        const x = resetActive ? 0.5 : (hasInput(nodeId, "X")
          ? this.clampValue(Number(mixInput(nodeId, "X")) || 0, 0, 1)
          : this.clampValue(Number(signal.x) || q, 0, 1));
        const y = resetActive ? 0 : (hasInput(nodeId, "Y")
          ? this.clampValue(Number(mixInput(nodeId, "Y")) || 0, 0, 1)
          : this.clampValue(Number(signal.y) || 0, 0, 1));
        const gate = resetActive ? 0 : (hasInput(nodeId, "Gate")
          ? (Number(mixInput(nodeId, "Gate")) > 0 ? 1 : 0)
          : (Number(signal.gate) > 0 ? 1 : 0));
        const hold = hasInput(nodeId, "Hold") && Number(mixInput(nodeId, "Hold")) > 0 ? 1 : 0;
        const velocity = hasInput(nodeId, "Velocity")
          ? this.clampValue(Number(mixInput(nodeId, "Velocity")) || 0, 0, 1)
          : y;
        const gatePulse = this.midiKeyboardGatePulseSamples > 0 ? 1 : 0;
        this.midiKeyboardGatePulseSamples = Math.max(0, this.midiKeyboardGatePulseSamples - 1);
        value = {
          "1 Sample Gate": hasInput(nodeId, "Gate") ? gate : gatePulse,
          "0.1V/Oct": this.clampValue(midi / 120, 0, 1),
          Double: this.clampValue(midi / 127, 0, 1),
          Frequency: outputFrequency,
          Gate: Math.max(gate, hold),
          Increment: increment,
          Key: key,
          MIDI: midi,
          Pitch: midi,
          Q: q,
          X: x,
          Y: velocity,
        };
      } else if (node?.type === "buttonEvents") {
        value = {
          Click: this.externalButtonEventPulse("click"),
          Hover: this.externalButtonEventPulse("hover"),
          Down: this.externalButtonEventPulse("down"),
          Up: this.externalButtonEventPulse("up"),
          Enter: this.externalButtonEventPulse("enter"),
          Leave: this.externalButtonEventPulse("leave"),
        };
      } else if (node?.type === "wireBreak") {
        value = this.wireBreakEventSample();
      } else if (node?.type === "wireConnect") {
        value = this.wireConnectEventSample();
      } else if (node?.type === "wireDisconnect") {
        value = this.wireDisconnectEventSample();
      } else if (node?.type === "windowReopen") {
        value = this.windowReopenEventSample();
      } else if (node?.type === "shootingStarExplosion") {
        value = this.shootingStarExplosionEventSample(
          this.readEffectiveParameter(node, "lowRange", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "highRange", 1, frame, frames, frameValues),
        );
      } else if (node?.type === "nextPatch" || node?.type === "previousPatch") {
        const state = this.patchCommandStates.get(nodeId) || this.createPatchCommandState();
        this.patchCommandStates.set(nodeId, state);
        value = this.patchCommandTriggerSample(
          state,
          mixInput(nodeId, "Trigger"),
          this.readEffectiveParameter(node, "threshold", 0, frame, frames, frameValues),
          node?.type === "previousPatch" ? "previousPatch" : "nextPatch",
          nodeId,
        );
      } else if (node?.type === "macroControls") {
        const resetActive = hasInput(nodeId, "Reset") && Number(mixInput(nodeId, "Reset")) > 0;
        value = {};
        for (let index = 0; index < 10; index += 1) {
          const port = `M${index + 1} In`;
          value[`M${index + 1}`] = resetActive
            ? 0
            : this.clampValue(hasInput(nodeId, port)
              ? Number(mixInput(nodeId, port)) || 0
              : Number(this.macroControls?.[index]) || 0, 0, 1);
        }
      } else if (node?.type === "pitchModWheel") {
        const resetActive = hasInput(nodeId, "Reset") && Number(mixInput(nodeId, "Reset")) > 0;
        const pitchWheel = resetActive ? 0 : (hasInput(nodeId, "Pitch")
          ? Number(mixInput(nodeId, "Pitch")) || 0
          : Number(this.pitchModWheelSignal?.pitch));
        const modWheel = resetActive ? 0 : (hasInput(nodeId, "Mod")
          ? Number(mixInput(nodeId, "Mod")) || 0
          : Number(this.pitchModWheelSignal?.mod) || 0);
        value = {
          "Mod Wheel": this.clampValue(modWheel, 0, 1),
          "Pitch Wheel": this.clampValue(Number.isFinite(pitchWheel) ? pitchWheel : 0, -1, 1),
        };
      } else if (node?.type === "gain") {
        value = mixInput(nodeId) *
          this.readEffectiveParameter(node, "amount", 1, frame, frames, frameValues);
      } else if (node?.type === "led") {
        value = {
          Out: this.safeFilterNumber(mixInput(nodeId, "In"), null),
        };
      } else if (node?.type === "moduleGroup") {
        value = this.evaluateModuleGroup(node, mixInput, frame, frames, safeRate, inputFrame);
      } else if (node?.type === "codeblock") {
        value = this.evaluateCodeblock(node, mixInput, frame, frames, safeRate, inputFrame);
      } else if (node?.type === "graph" || node?.type === "graph2") {
        value = graphOutputValue(node, nodeId);
      } else if (node?.type === "bias") {
        value = mixInput(nodeId) +
          this.readEffectiveParameter(node, "offset", 0, frame, frames, frameValues);
      } else if (node?.type === "softClipper") {
        value = this.nativeSoftClipperSample(
          mixInput(nodeId),
          this.readEffectiveParameter(node, "center", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "width", 2, frame, frames, frameValues),
        );
      } else if (node?.type === "rotate3dTo2d") {
        const angleX = this.readEffectiveParameter(node, "rotateX", 0, frame, frames, frameValues) * Math.PI * 2;
        const angleY = this.readEffectiveParameter(node, "rotateY", 0, frame, frames, frameValues) * Math.PI * 2;
        const angleZ = this.readEffectiveParameter(node, "rotateZ", 0, frame, frames, frameValues) * Math.PI * 2;
        let x = this.safeFilterNumber(mixInput(nodeId, "X"), null);
        let y = this.safeFilterNumber(mixInput(nodeId, "Y"), null);
        let z = this.safeFilterNumber(mixInput(nodeId, "Z"), null);
        const sinX = Math.sin(angleX);
        const cosX = Math.cos(angleX);
        const nextY = y * cosX - z * sinX;
        const nextZ = y * sinX + z * cosX;
        y = nextY;
        z = nextZ;
        const sinY = Math.sin(angleY);
        const cosY = Math.cos(angleY);
        const nextX = x * cosY + z * sinY;
        z = -x * sinY + z * cosY;
        x = nextX;
        const sinZ = Math.sin(angleZ);
        const cosZ = Math.cos(angleZ);
        value = {
          X: this.safeFilterNumber(x * cosZ - y * sinZ, null),
          Y: this.safeFilterNumber(x * sinZ + y * cosZ, null),
        };
      } else if (node?.type === "valueSlider") {
        const offset = this.readEffectiveParameter(node, "offset", 0, frame, frames, frameValues);
        value = { Bias: offset, Out: offset, offset };
      } else if (node?.type === "macroKnob" || node?.type === "bipolarKnob") {
        const knobValue = this.readEffectiveParameter(node, "value", 0, frame, frames, frameValues);
        value = { Out: knobValue, value: knobValue };
      } else if (node?.type === "passiveFilter") {
        const state = this.passiveFilterStates.get(nodeId) || this.createPassiveFilterState();
        this.passiveFilterStates.set(nodeId, state);
        value = this.passiveFilterSample(
          state,
          mixInput(nodeId),
          this.readEffectiveParameter(node, "mode", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "lowFrequency", 200, frame, frames, frameValues),
          this.readEffectiveParameter(node, "highFrequency", 1000, frame, frames, frameValues),
          safeRate,
        );
      } else if (node?.type === "cookbookFilter") {
        const state = this.cookbookFilterStates.get(nodeId) || this.createCookbookFilterState();
        this.cookbookFilterStates.set(nodeId, state);
        value = this.cookbookFilterSample(
          state,
          mixInput(nodeId),
          this.readEffectiveParameter(node, "mode", 1, frame, frames, frameValues),
          this.readEffectiveParameter(node, "frequency", 1000, frame, frames, frameValues),
          this.readEffectiveParameter(node, "q", 1, frame, frames, frameValues),
          this.readEffectiveParameter(node, "gain", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "stages", 2, frame, frames, frameValues),
          safeRate,
        );
      } else if (node?.type === "ladderFilter") {
        const state = this.ladderFilterStates.get(nodeId) || this.createLadderFilterState();
        this.ladderFilterStates.set(nodeId, state);
        value = this.ladderFilterSample(
          state,
          mixInput(nodeId),
          {
            frequency: this.readEffectiveParameter(node, "frequency", 1000, frame, frames, frameValues),
            mode: this.readEffectiveParameter(node, "mode", 1, frame, frames, frameValues),
            resonance: this.readEffectiveParameter(node, "resonance", 0.2, frame, frames, frameValues),
            stages: this.readEffectiveParameter(node, "stages", 4, frame, frames, frameValues),
          },
          safeRate,
        );
      } else if (node?.type === "tb303Filter") {
        const state = this.tb303FilterStates.get(nodeId) || this.createTb303FilterState();
        this.tb303FilterStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.tb303FilterSample(
          state,
          mixInput(nodeId),
          {
            cutoff: read("cutoff", 1000),
            drive: read("drive", 0),
            mode: read("mode", 4),
            resonance: read("resonance", 0),
          },
          safeRate,
        );
      } else if (node?.type === "delayEffect") {
        const state = this.delayEffectStates.get(nodeId) || this.createDelayEffectState();
        this.delayEffectStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.delayEffectSample(
          state,
          mixInput(nodeId),
          {
            feedback: read("feedback", 0.25),
            level: read("level", 1),
            mix: read("mix", 0.35),
            mode: read("mode", 0),
            modAmount: read("modAmount", 0.02),
            modRate: read("modRate", 0.1),
            modVariation: read("modVariation", 0),
            time: read("time", 0.18),
          },
          safeRate,
          nodeId,
        );
      } else if (node?.type === "reverbEffect") {
        const state = this.reverbEffectStates.get(nodeId) || this.createSabrinaReverbState();
        this.reverbEffectStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const monoInput = mixInput(nodeId, "In");
        const leftInput = mixInput(nodeId, "Left") + monoInput;
        const rightInput = mixInput(nodeId, "Right") + monoInput;
        value = this.sabrinaReverbSample(
          state,
          leftInput,
          rightInput,
          {
            delaySize: read("delaySize", 0.02),
            diffusionAmount: read("diffusionAmount", 0.70),
            diffusionSize: read("diffusionSize", 0.35),
            lfoAmplitude: read("lfoAmplitude", 0.07),
            lfoBaseSpeed: read("lfoBaseSpeed", 0.83),
            lfoVariation: read("lfoVariation", 0.001),
            mix: read("mix", 0.43),
            recycle: read("recycle", 0.70),
            seed: read("seed", 0),
          },
          safeRate,
          frame,
        );
      } else if (node?.type === "pll") {
        const state = this.pllStates.get(nodeId) || this.createPllState();
        this.pllStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const cvConnected = this.inputConnections?.has?.(this.inputKey(nodeId, "VCO CV In")) ? 1 : 0;
        value = this.pllSample(
          state,
          mixInput(nodeId, "Signal In"),
          mixInput(nodeId, "VCO CV In"),
          cvConnected,
          {
            range: read("range", 1),
            offset: read("offset", 5),
            type: read("type", 1),
            frequ: read("frequ", 10),
          },
          safeRate,
        );
      } else if (node?.type === "helmholtzPitch") {
        const state = this.helmholtzStates.get(nodeId) || this.createHelmholtzState();
        this.helmholtzStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.helmholtzSample(
          state,
          mixInput(nodeId, "In"),
          {
            windowSize: read("windowSize", 512),
            threshold: read("threshold", 0.93),
          },
          hasInput(nodeId, "In"),
          safeRate,
        );
      } else if (node?.type === "slewLimiter") {
        const state = this.slewLimiterStates.get(nodeId) || this.createSlewLimiterState();
        this.slewLimiterStates.set(nodeId, state);
        value = this.slewLimiterSample(
          state,
          mixInput(nodeId),
          this.readEffectiveParameter(node, "upTime", 0.05, frame, frames, frameValues),
          this.readEffectiveParameter(node, "downTime", 0.20, frame, frames, frameValues),
          safeRate,
        );
      } else if (node?.type === "sampleHold") {
        const state = this.sampleHoldStates.get(nodeId) || this.createSampleHoldState();
        this.sampleHoldStates.set(nodeId, state);
        value = this.sampleHoldSample(
          state,
          mixInput(nodeId, "In"),
          mixInput(nodeId, "Trigger"),
          this.readEffectiveParameter(node, "threshold", 0, frame, frames, frameValues),
          this.readEffectiveParameter(node, "sampleFrequency", 0, frame, frames, frameValues),
          safeRate,
          hasInput(nodeId, "In"),
          nodeId,
        );
      } else if (node?.type === "expAdsr") {
        const state = this.expAdsrStates.get(nodeId) || this.createExpAdsrState();
        this.expAdsrStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.expAdsrSample(
          state,
          mixInput(nodeId, "Gate"),
          {
            attack: read("attack", 0.08),
            attackShape: read("attackShape", 0.3),
            decay: read("decay", 0.22),
            delay: read("delay", 0),
            level: read("level", 1),
            loop: read("loop", 0),
            release: read("release", 0.45),
            releaseShape: read("releaseShape", 0.0001),
            sustain: read("sustain", 0.55),
          },
          safeRate,
        );
      } else if (node?.type === "linearEnvelope") {
        const state = this.linearEnvelopeStates.get(nodeId) || this.createLinearEnvelopeState();
        this.linearEnvelopeStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.linearEnvelopeSample(
          state,
          mixInput(nodeId, "Gate"),
          {
            attack: read("attack", 0.08),
            decay: read("decay", 0.22),
            delay: read("delay", 0),
            level: read("level", 1),
            loop: read("loop", 0),
            release: read("release", 0.45),
            sustain: read("sustain", 0.55),
          },
          safeRate,
        );
      } else if (node?.type === "pluckEnvelope") {
        const state = this.pluckEnvelopeStates.get(nodeId) || this.createPluckEnvelopeState();
        this.pluckEnvelopeStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.pluckEnvelopeSample(
          state,
          mixInput(nodeId, "Trigger"),
          mixInput(nodeId, "Release"),
          {
            attackFeedback: read("attackFeedback", 0.002),
            autoReleaseTime: read("autoReleaseTime", 0.08),
            decay: read("decay", 0.35),
            decayModCurve: read("decayModCurve", 0),
            decayModEnd: read("decayModEnd", 0.55),
            decayModFrequency: read("decayModFrequency", 1.5),
            decayModStart: read("decayModStart", 0.08),
            delayTime: read("delayTime", 0),
            endingDecay: read("endingDecay", 0.8),
            level: read("level", 1),
            releaseFeedback: read("releaseFeedback", 0.35),
            velocity: read("velocity", 1),
            velocitySensitivity: read("velocitySensitivity", 0),
          },
          safeRate,
        );
      } else if (node?.type === "vactrolEnvelope" || node?.type === "vactrolEnvelopeC4") {
        const state = this.vactrolEnvelopeStates.get(nodeId) || this.createVactrolEnvelopeState();
        this.vactrolEnvelopeStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const isC4 = node?.type === "vactrolEnvelopeC4";
        value = this.vactrolEnvelopeSample(
          state,
          mixInput(nodeId, "Light"),
          {
            attack: read("attack", isC4 ? 0.006 : 0.0025),
            curve: read("curve", 1),
            darkCurrent: read("darkCurrent", 0),
            lightOffset: read("lightOffset", 0),
            release: read("release", isC4 ? 1.5 : 0.035),
            sensitivity: read("sensitivity", 1),
          },
          safeRate,
        );
      } else if (node?.type === "flowerChildEnvelopeFollower") {
        const state = this.flowerChildEnvelopeFollowerStates.get(nodeId) ||
          this.createFlowerChildEnvelopeFollowerState();
        this.flowerChildEnvelopeFollowerStates.set(nodeId, state);
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        value = this.flowerChildEnvelopeFollowerSample(
          state,
          mixInput(nodeId, "In"),
          {
            attack: read("attack", 0.001),
            decay: read("decay", 0.001),
            hold: read("hold", 0.001),
          },
          safeRate,
        );
      } else if (node?.type === "sandboxVisuals") {
        const screenShake = this.smoothVisualControl(
          "screenShake",
          this.visualControlIntensity(mixInput(nodeId, "Shake"), nodeId, "screen visuals shake"),
          safeRate,
        );
        const x = this.smoothVisualControl(
          "x",
          this.visualControlSigned(mixInput(nodeId, "X"), nodeId, "sandbox visuals x"),
          safeRate,
          0.045,
          -1,
          1,
        );
        const y = this.smoothVisualControl(
          "y",
          this.visualControlSigned(mixInput(nodeId, "Y"), nodeId, "sandbox visuals y"),
          safeRate,
          0.045,
          -1,
          1,
        );
        const screenDim = this.smoothVisualControl(
          "screenDim",
          this.visualControlIntensity(mixInput(nodeId, "Dim"), nodeId, "screen visuals dim"),
          safeRate,
        );
        const red = this.smoothVisualControl(
          "red",
          this.visualControlIntensity(mixInput(nodeId, "Red"), nodeId, "sandbox visuals red"),
          safeRate,
        );
        const green = this.smoothVisualControl(
          "green",
          this.visualControlIntensity(mixInput(nodeId, "Green"), nodeId, "sandbox visuals green"),
          safeRate,
        );
        const blue = this.smoothVisualControl(
          "blue",
          this.visualControlIntensity(mixInput(nodeId, "Blue"), nodeId, "sandbox visuals blue"),
          safeRate,
        );
        const scopeTracesOff = this.smoothVisualControl(
          "scopeTracesOff",
          this.visualControlIntensity(mixInput(nodeId, "Scope Off"), nodeId, "screen visuals scope off"),
          safeRate,
          0,
        );
        const scopePaused = this.smoothVisualControl(
          "scopePaused",
          this.visualControlIntensity(mixInput(nodeId, "Pause"), nodeId, "screen visuals pause"),
          safeRate,
          0,
        );
        value = {
          Blue: blue,
          Green: green,
          Pause: scopePaused,
          Red: red,
          ScopeOff: scopeTracesOff,
          ScreenDim: screenDim,
          ScreenShake: screenShake,
          X: x,
          Y: y,
        };
      } else if (node?.type === "screenSpaceShader") {
        value = this.screenSpaceShaderSample(
          node,
          (port) => mixInput(nodeId, port),
          safeRate,
          nodeId,
        );
      } else if (node?.type === "bloomGlow") {
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const screenDim = this.smoothVisualControl(
          "screenDim",
          read("screenDim", 0),
          safeRate,
        );
        const visualBrightness = this.smoothVisualControl(
          "visualBrightness",
          read("visualBrightness", 0.55),
          safeRate,
        );
        const visualBloom = this.smoothVisualControl(
          "visualBloom",
          read("visualBloom", 0.45),
          safeRate,
        );
        const visualGlow = this.smoothVisualControl(
          "visualGlow",
          read("visualGlow", 0.6),
          safeRate,
        );
        value = {
          Bloom: visualBloom,
          Brightness: visualBrightness,
          Dim: screenDim,
          Glow: visualGlow,
        };
      } else if (node?.type === "rgbaHsla") {
        const rgbRed = this.visualControlIntensity(mixInput(nodeId, "Red"), nodeId, "rgba hsla red");
        const rgbGreen = this.visualControlIntensity(mixInput(nodeId, "Green"), nodeId, "rgba hsla green");
        const rgbBlue = this.visualControlIntensity(mixInput(nodeId, "Blue"), nodeId, "rgba hsla blue");
        const hue = this.visualControlIntensity(mixInput(nodeId, "Hue"), nodeId, "rgba hsla hue");
        const saturation = this.visualControlIntensity(mixInput(nodeId, "Saturation"), nodeId, "rgba hsla saturation");
        const lightness = this.visualControlIntensity(mixInput(nodeId, "Lightness"), nodeId, "rgba hsla lightness");
        const hslMix = this.visualControlIntensity(mixInput(nodeId, "HSL Mix"), nodeId, "rgba hsla hsl mix");
        const hslRgb = this.visualHslToRgb(hue, saturation, lightness);
        const red = this.smoothVisualControl("red", rgbRed * (1 - hslMix) + hslRgb[0] * hslMix, safeRate);
        const green = this.smoothVisualControl("green", rgbGreen * (1 - hslMix) + hslRgb[1] * hslMix, safeRate);
        const blue = this.smoothVisualControl("blue", rgbBlue * (1 - hslMix) + hslRgb[2] * hslMix, safeRate);
        const alpha = this.smoothVisualControl(
          "screenDim",
          this.visualControlIntensity(mixInput(nodeId, "Alpha"), nodeId, "rgba hsla alpha"),
          safeRate,
        );
        value = { Alpha: alpha, Blue: blue, Green: green, Red: red };
      } else if (node?.type === "chromaColor") {
        const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
        const chromaHue = this.smoothVisualControl(
          "chromaHue",
          read("chromaHue", 0.58),
          safeRate,
        );
        const chromaSaturation = this.smoothVisualControl(
          "chromaSaturation",
          read("chromaSaturation", 0.82),
          safeRate,
        );
        const chromaLightness = this.smoothVisualControl(
          "chromaLightness",
          read("chromaLightness", 0.52),
          safeRate,
        );
        const chromaAlpha = this.smoothVisualControl(
          "chromaAlpha",
          read("chromaAlpha", 0.35),
          safeRate,
        );
        const chromaDrift = this.smoothVisualControl(
          "chromaDrift",
          read("chromaDrift", 0.25),
          safeRate,
        );
        const chromaSpread = this.smoothVisualControl(
          "chromaSpread",
          read("chromaSpread", 0.4),
          safeRate,
        );
        const visualBrightness = this.smoothVisualControl(
          "visualBrightness",
          read("visualBrightness", 0.55),
          safeRate,
        );
        const visualBloom = this.smoothVisualControl(
          "visualBloom",
          read("visualBloom", 0.45),
          safeRate,
        );
        const visualGlow = this.smoothVisualControl(
          "visualGlow",
          read("visualGlow", 0.6),
          safeRate,
        );
        value = {
          Alpha: chromaAlpha,
          Bloom: visualBloom,
          Chroma: chromaSaturation,
          Drift: chromaDrift,
          Glow: visualGlow,
          Hue: chromaHue,
          Light: chromaLightness,
          Spread: chromaSpread,
          TraceBrightness: visualBrightness,
        };
      } else if (node?.type === "badvalMonitor") {
        value = this.monitorBadValueSample(mixInput(nodeId), nodeId);
      } else if (node?.type === "speakerProtection") {
        value = this.speakerProtectionSample(mixInput(nodeId), nodeId);
      } else if (node?.type === "groupOutput") {
        value = {
          Out: mixInput(nodeId, "In"),
        };
      } else if (node?.type === "clapPlugin") {
        value = {
          Left: 0,
          Right: 0,
        };
      } else if (node?.type === "output") {
        const outputMonoIn = mixInput(nodeId, "Mono");
        const outputLeftIn = mixInput(nodeId, "Left");
        const outputRightIn = mixInput(nodeId, "Right");
        value = {
          Left: outputMonoIn + outputLeftIn,
          Out: outputMonoIn + (outputLeftIn + outputRightIn) * 0.5,
          Right: outputMonoIn + outputRightIn,
        };
      }
      frameValues.set(nodeId, value);
      this.nodeOutputs.set(nodeId, value);
    }

    const outputNode = this.nodes.get(this.outputNode || "output");
    const outputVolume = outputNode
      ? this.readEffectiveParameter(outputNode, "volume", 0.1, frame, frames, frameValues)
      : 1;

    const outputMono = mixInput(this.outputNode || "output", "Mono");
    this.currentFrameValues = frameValues;
    return {
      left: (outputMono + mixInput(this.outputNode || "output", "Left")) * outputVolume,
      right: (outputMono + mixInput(this.outputNode || "output", "Right")) * outputVolume,
    };
  }

  process(inputs, outputs) {
    const blockStartedAt = globalThis.performance?.now?.() || 0;
    const output = outputs[0] || [];
    const frames = output[0]?.length || 128;
    const input = inputs[0] || [];
    const oversamplingRatio = Math.max(1, Math.min(4, Math.round(this.oversamplingRatio) || 1));
    const engineSampleRate = Math.max(1, this.engineSampleRate || sampleRate || 44100);
    const engineFrames = frames * oversamplingRatio;
    if (!this.nodes.size || !this.order.length) {
      for (const channel of output) {
        channel.fill(0);
      }
      return true;
    }

    for (let frame = 0; frame < frames; frame += 1) {
      const inputLeft = Number(input[0]?.[frame]) || 0;
      const inputRight = Number(input[1]?.[frame]) || inputLeft;
      this.inputMeterPeak = Math.max(this.inputMeterPeak, Math.abs(inputLeft), Math.abs(inputRight));
      this.inputMeterSquareSum += (inputLeft * inputLeft + inputRight * inputRight) * 0.5;
      this.inputMeterSamples += 1;
      let leftSum = 0;
      let rightSum = 0;
      let decimatedLeft = 0;
      let decimatedRight = 0;
      const useRaptEllipticDecimator = oversamplingRatio === 4;
      for (let subframe = 0; subframe < oversamplingRatio; subframe += 1) {
        const engineFrame = frame * oversamplingRatio + subframe;
        const subframeOutput = this.evaluateFrame(engineFrame, engineFrames, inputs, engineSampleRate, frame);
        this.advanceMetronome(engineSampleRate);
        const metronomeClick = this.metronomeSample(engineFrame, engineFrames, engineSampleRate, frame);
        if (useRaptEllipticDecimator) {
          decimatedLeft = this.processRaptEllipticDecimatorSample(
            subframeOutput.left + metronomeClick,
            this.raptEllipticDecimatorLeft,
          );
          decimatedRight = this.processRaptEllipticDecimatorSample(
            subframeOutput.right + metronomeClick,
            this.raptEllipticDecimatorRight,
          );
        } else {
          leftSum += subframeOutput.left + metronomeClick;
          rightSum += subframeOutput.right + metronomeClick;
        }
        this.captureModuleScopeFrame(this.currentFrameValues, engineFrame, engineFrames);
        this.scopeCounter += 1;
        if (this.scopeCounter >= Math.max(1, Math.floor(engineSampleRate / 30))) {
          this.scopeCounter = 0;
          this.postModuleScopeSnapshot();
        }
        this.visualControlCounter += 1;
        if (this.visualControlCounter >= Math.max(1, Math.floor(engineSampleRate / 30))) {
          this.visualControlCounter = 0;
          this.postVisualControls();
        }
      }
      const frameOutput = {
        left: useRaptEllipticDecimator ? decimatedLeft : leftSum / oversamplingRatio,
        right: useRaptEllipticDecimator ? decimatedRight : rightSum / oversamplingRatio,
      };
      if (this.outputSampleClipped(frameOutput.left)) {
        this.meterClipCount += 1;
      }
      if (this.outputSampleClipped(frameOutput.right)) {
        this.meterClipCount += 1;
      }
      if (
        this.outputSampleTripsEarProtection(frameOutput.left) ||
        this.outputSampleTripsEarProtection(frameOutput.right)
      ) {
        this.meterProtectionMuteCount += 1;
        this.speakerProtectionPeak = Math.max(
          Number(this.speakerProtectionPeak) || 0,
          Number.isFinite(Number(frameOutput.left)) ? Math.abs(Number(frameOutput.left)) : Infinity,
          Number.isFinite(Number(frameOutput.right)) ? Math.abs(Number(frameOutput.right)) : Infinity,
        );
        this.speakerProtectionNodeId = "output";
        for (let channelIndex = 0; channelIndex < output.length; channelIndex += 1) {
          output[channelIndex][frame] = 0;
        }
        continue;
      }
      const protectedFrame = this.earProtector.protect(frameOutput.left, frameOutput.right);
      if (protectedFrame.muted) {
        this.meterProtectionMuteCount += 1;
      }
      const left = this.clampValue(protectedFrame.left, -0.95, 0.95);
      const right = this.clampValue(protectedFrame.right, -0.95, 0.95);
      this.meterPeak = Math.max(this.meterPeak, Math.abs(left), Math.abs(right));
      this.meterSquareSum += (left * left + right * right) * 0.5;
      this.meterSamples += 1;
      for (let channelIndex = 0; channelIndex < output.length; channelIndex += 1) {
        output[channelIndex][frame] = channelIndex === 0 ? left : right;
      }
    }
    this.finishSmoothing();
    if (blockStartedAt > 0) {
      const elapsedMs = Math.max(0, (globalThis.performance?.now?.() || blockStartedAt) - blockStartedAt);
      const blockBudgetMs = (frames / Math.max(1, sampleRate || this.hostSampleRate || 44100)) * 1000;
      const budgetRatio = blockBudgetMs > 0 ? elapsedMs / blockBudgetMs : 0;
      this.maxBlockProcessMs = Math.max(Number(this.maxBlockProcessMs) || 0, elapsedMs);
      this.maxBlockBudgetRatio = Math.max(Number(this.maxBlockBudgetRatio) || 0, budgetRatio);
      if (budgetRatio >= 0.85) {
        this.meterOverrunCount += 1;
      }
    }
    this.meterCounter += frames;
    if (this.meterCounter >= sampleRate / 10) {
      this.port.postMessage({
        audioPlayerNodeId: this.audioPlayerMeterNodeId || this.audioPlayerNodeIds[0] || "",
        audioPlayerNodeIds: [...this.audioPlayerNodeIds],
        audioPlayerPeak: this.audioPlayerMeterPeak,
        audioPlayerPhase: this.audioPlayerMeterPhase,
        audioPlayerReason: this.audioPlayerMeterReason,
        audioPlayerSamples: this.audioPlayerMeterSamples,
        clipCount: this.meterClipCount,
        badNumberCount: this.badNumberCount,
        lastBadValueReason: this.lastBadValueReason,
        lastBadValueNodeId: this.lastBadValueNodeId,
        lastBadValueSource: this.lastBadValueSource,
        inputPeak: this.inputMeterPeak,
        inputRms: Math.sqrt(this.inputMeterSquareSum / Math.max(1, this.inputMeterSamples)),
        maxBlockBudgetRatio: this.maxBlockBudgetRatio,
        maxBlockProcessMs: this.maxBlockProcessMs,
        overrunCount: this.meterOverrunCount,
        peak: this.meterPeak,
        protectionNodeId: this.speakerProtectionNodeId || "",
        protectionPeak: Number(this.speakerProtectionPeak) || 0,
        protectionMuteCount: this.meterProtectionMuteCount,
        sessionId: this.sessionId,
        rms: Math.sqrt(this.meterSquareSum / Math.max(1, this.meterSamples)),
        type: "meter",
      });
      this.meterCounter = 0;
      this.inputMeterPeak = 0;
      this.audioPlayerMeterNodeId = "";
      this.audioPlayerMeterPeak = 0;
      this.audioPlayerMeterPhase = 0;
      this.audioPlayerMeterReason = "";
      this.audioPlayerMeterSamples = 0;
      this.inputMeterSamples = 0;
      this.inputMeterSquareSum = 0;
      this.meterClipCount = 0;
      this.badNumberCount = 0;
      this.maxBlockProcessMs = 0;
      this.maxBlockBudgetRatio = 0;
      this.meterOverrunCount = 0;
      this.lastBadValueReason = "";
      this.lastBadValueNodeId = "";
      this.lastBadValueSource = "";
      this.meterPeak = 0;
      this.meterProtectionMuteCount = 0;
      this.speakerProtectionNodeId = "";
      this.speakerProtectionPeak = 0;
      this.meterSamples = 0;
      this.meterSquareSum = 0;
    }
    return true;
  }
}

registerProcessor("node-live-audio-processor", NodeLiveAudioProcessor);
