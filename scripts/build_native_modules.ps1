$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$clang = "C:\Program Files\LLVM\bin\clang++.exe"

if (!(Test-Path -LiteralPath $clang)) {
  throw "clang++ not found at $clang"
}

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_slew_limiter_create" `
  "-Wl,--export=soemdsp_slew_limiter_destroy" `
  "-Wl,--export=soemdsp_slew_limiter_sample" `
  "-Wl,--export=soemdsp_slew_limiter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\slew_limiter\slew_limiter.wasm" `
  "$root\native_modules\slew_limiter\slew_limiter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_sample_hold_create" `
  "-Wl,--export=soemdsp_sample_hold_destroy" `
  "-Wl,--export=soemdsp_sample_hold_sample" `
  "-Wl,--export=soemdsp_sample_hold_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\sample_hold\sample_hold.wasm" `
  "$root\native_modules\sample_hold\sample_hold.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_exp_adsr_create" `
  "-Wl,--export=soemdsp_exp_adsr_destroy" `
  "-Wl,--export=soemdsp_exp_adsr_sample" `
  "-Wl,--export=soemdsp_exp_adsr_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\exp_adsr\exp_adsr.wasm" `
  "$root\native_modules\exp_adsr\exp_adsr.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_linear_envelope_create" `
  "-Wl,--export=soemdsp_linear_envelope_destroy" `
  "-Wl,--export=soemdsp_linear_envelope_sample" `
  "-Wl,--export=soemdsp_linear_envelope_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\linear_envelope\linear_envelope.wasm" `
  "$root\native_modules\linear_envelope\linear_envelope.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_pluck_envelope_create" `
  "-Wl,--export=soemdsp_pluck_envelope_destroy" `
  "-Wl,--export=soemdsp_pluck_envelope_sample" `
  "-Wl,--export=soemdsp_pluck_envelope_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\pluck_envelope\pluck_envelope.wasm" `
  "$root\native_modules\pluck_envelope\pluck_envelope.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_flower_child_envelope_follower_create" `
  "-Wl,--export=soemdsp_flower_child_envelope_follower_destroy" `
  "-Wl,--export=soemdsp_flower_child_envelope_follower_sample" `
  "-Wl,--export=soemdsp_flower_child_envelope_follower_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\flower_child_envelope_follower\flower_child_envelope_follower.wasm" `
  "$root\native_modules\flower_child_envelope_follower\flower_child_envelope_follower.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_lorenz_attractor_create" `
  "-Wl,--export=soemdsp_lorenz_attractor_destroy" `
  "-Wl,--export=soemdsp_lorenz_attractor_sample" `
  "-Wl,--export=soemdsp_lorenz_attractor_x" `
  "-Wl,--export=soemdsp_lorenz_attractor_y" `
  "-Wl,--export=soemdsp_lorenz_attractor_z" `
  "-Wl,--export=soemdsp_lorenz_attractor_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\lorenz_attractor\lorenz_attractor.wasm" `
  "$root\native_modules\lorenz_attractor\lorenz_attractor.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_cookbook_filter_create" `
  "-Wl,--export=soemdsp_cookbook_filter_destroy" `
  "-Wl,--export=soemdsp_cookbook_filter_sample" `
  "-Wl,--export=soemdsp_cookbook_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\cookbook_filter\cookbook_filter.wasm" `
  "$root\native_modules\cookbook_filter\cookbook_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_sine_wavetable_sin" `
  "-Wl,--export=soemdsp_sine_wavetable_cos" `
  "-Wl,--export=soemdsp_sine_wavetable_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\sine_wavetable\sine_wavetable.wasm" `
  "$root\native_modules\sine_wavetable\sine_wavetable.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_additive_osc_sample" `
  "-Wl,--export=soemdsp_additive_osc_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\additive_osc\additive_osc.wasm" `
  "$root\native_modules\additive_osc\additive_osc.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_delay_effect_create" `
  "-Wl,--export=soemdsp_delay_effect_destroy" `
  "-Wl,--export=soemdsp_delay_effect_sample" `
  "-Wl,--export=soemdsp_delay_effect_last_wet" `
  "-Wl,--export=soemdsp_delay_effect_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\delay_effect\delay_effect.wasm" `
  "$root\native_modules\delay_effect\delay_effect.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_random_walk_create" `
  "-Wl,--export=soemdsp_random_walk_destroy" `
  "-Wl,--export=soemdsp_random_walk_sample" `
  "-Wl,--export=soemdsp_random_walk_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\random_walk\random_walk.wasm" `
  "$root\native_modules\random_walk\random_walk.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_chord_memory_create" `
  "-Wl,--export=soemdsp_chord_memory_destroy" `
  "-Wl,--export=soemdsp_chord_memory_sample" `
  "-Wl,--export=soemdsp_chord_memory_note" `
  "-Wl,--export=soemdsp_chord_memory_arp" `
  "-Wl,--export=soemdsp_chord_memory_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\chord_memory\chord_memory.wasm" `
  "$root\native_modules\chord_memory\chord_memory.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_turing_machine_create" `
  "-Wl,--export=soemdsp_turing_machine_destroy" `
  "-Wl,--export=soemdsp_turing_machine_sample" `
  "-Wl,--export=soemdsp_turing_machine_scale" `
  "-Wl,--export=soemdsp_turing_machine_gate" `
  "-Wl,--export=soemdsp_turing_machine_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\turing_machine\turing_machine.wasm" `
  "$root\native_modules\turing_machine\turing_machine.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_chaotic_phase_locking_filter_create" `
  "-Wl,--export=soemdsp_chaotic_phase_locking_filter_destroy" `
  "-Wl,--export=soemdsp_chaotic_phase_locking_filter_sample" `
  "-Wl,--export=soemdsp_chaotic_phase_locking_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\chaotic_phase_locking_filter\chaotic_phase_locking_filter.wasm" `
  "$root\native_modules\chaotic_phase_locking_filter\chaotic_phase_locking_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_dsf_oscillator_create" `
  "-Wl,--export=soemdsp_dsf_oscillator_destroy" `
  "-Wl,--export=soemdsp_dsf_oscillator_reset" `
  "-Wl,--export=soemdsp_dsf_oscillator_sample" `
  "-Wl,--export=soemdsp_dsf_oscillator_out" `
  "-Wl,--export=soemdsp_dsf_oscillator_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\dsf_oscillator\dsf_oscillator.wasm" `
  "$root\native_modules\dsf_oscillator\dsf_oscillator.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_robin_supersaw_create" `
  "-Wl,--export=soemdsp_robin_supersaw_destroy" `
  "-Wl,--export=soemdsp_robin_supersaw_reset" `
  "-Wl,--export=soemdsp_robin_supersaw_sample" `
  "-Wl,--export=soemdsp_robin_supersaw_left" `
  "-Wl,--export=soemdsp_robin_supersaw_right" `
  "-Wl,--export=soemdsp_robin_supersaw_mono" `
  "-Wl,--export=soemdsp_robin_supersaw_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\robin_supersaw\robin_supersaw.wasm" `
  "$root\native_modules\robin_supersaw\robin_supersaw.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_flower_child_filter_create" `
  "-Wl,--export=soemdsp_flower_child_filter_destroy" `
  "-Wl,--export=soemdsp_flower_child_filter_sample" `
  "-Wl,--export=soemdsp_flower_child_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\flower_child_filter\flower_child_filter.wasm" `
  "$root\native_modules\flower_child_filter\flower_child_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_human_filter_create" `
  "-Wl,--export=soemdsp_human_filter_destroy" `
  "-Wl,--export=soemdsp_human_filter_sample" `
  "-Wl,--export=soemdsp_human_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\human_filter\human_filter.wasm" `
  "$root\native_modules\human_filter\human_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_resonator_filter_create" `
  "-Wl,--export=soemdsp_resonator_filter_destroy" `
  "-Wl,--export=soemdsp_resonator_filter_sample" `
  "-Wl,--export=soemdsp_resonator_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\resonator_filter\resonator_filter.wasm" `
  "$root\native_modules\resonator_filter\resonator_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_rsmet_filter_create" `
  "-Wl,--export=soemdsp_rsmet_filter_destroy" `
  "-Wl,--export=soemdsp_rsmet_filter_sample" `
  "-Wl,--export=soemdsp_rsmet_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\rsmet_filter\rsmet_filter.wasm" `
  "$root\native_modules\rsmet_filter\rsmet_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_superlove_filter_create" `
  "-Wl,--export=soemdsp_superlove_filter_destroy" `
  "-Wl,--export=soemdsp_superlove_filter_sample" `
  "-Wl,--export=soemdsp_superlove_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\superlove_filter\superlove_filter.wasm" `
  "$root\native_modules\superlove_filter\superlove_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_yellowjacket_filter_create" `
  "-Wl,--export=soemdsp_yellowjacket_filter_destroy" `
  "-Wl,--export=soemdsp_yellowjacket_filter_sample" `
  "-Wl,--export=soemdsp_yellowjacket_filter_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\yellowjacket_filter\yellowjacket_filter.wasm" `
  "$root\native_modules\yellowjacket_filter\yellowjacket_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_change_detector_create" `
  "-Wl,--export=soemdsp_change_detector_destroy" `
  "-Wl,--export=soemdsp_change_detector_sample" `
  "-Wl,--export=soemdsp_change_detector_up" `
  "-Wl,--export=soemdsp_change_detector_same" `
  "-Wl,--export=soemdsp_change_detector_down" `
  "-Wl,--export=soemdsp_change_detector_changed" `
  "-Wl,--export=soemdsp_change_detector_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\change_detector\change_detector.wasm" `
  "$root\native_modules\change_detector\change_detector.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_ellipsoid_sample" `
  "-Wl,--export=soemdsp_ellipsoid_vector_sample" `
  "-Wl,--export=soemdsp_ellipsoid_mono" `
  "-Wl,--export=soemdsp_ellipsoid_x" `
  "-Wl,--export=soemdsp_ellipsoid_y" `
  "-Wl,--export=soemdsp_ellipsoid_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\ellipsoid\ellipsoid.wasm" `
  "$root\native_modules\ellipsoid\ellipsoid.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -msimd128 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_sabrina_reverb_create" `
  "-Wl,--export=soemdsp_sabrina_reverb_destroy" `
  "-Wl,--export=soemdsp_sabrina_reverb_reset" `
  "-Wl,--export=soemdsp_sabrina_reverb_set_params" `
  "-Wl,--export=soemdsp_sabrina_reverb_process" `
  "-Wl,--export=soemdsp_sabrina_reverb_left" `
  "-Wl,--export=soemdsp_sabrina_reverb_right" `
  "-Wl,--export=soemdsp_sabrina_reverb_wet" `
  "-Wl,--export=soemdsp_sabrina_reverb_wet_left" `
  "-Wl,--export=soemdsp_sabrina_reverb_wet_right" `
  "-Wl,--export=soemdsp_sabrina_reverb_version" `
  "-Wl,--export=soemdsp_sabrina_reverb_process_block" `
  "-Wl,--export=soemdsp_sabrina_reverb_block_input_left_ptr" `
  "-Wl,--export=soemdsp_sabrina_reverb_block_input_right_ptr" `
  "-Wl,--export=soemdsp_sabrina_reverb_block_output_left_ptr" `
  "-Wl,--export=soemdsp_sabrina_reverb_block_output_right_ptr" `
  "-Wl,--export=soemdsp_sabrina_reverb_max_block_frames" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\sabrina_reverb\sabrina_reverb.wasm" `
  "$root\native_modules\sabrina_reverb\sabrina_reverb.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_pll_version" `
  "-Wl,--export=soemdsp_pll_create" `
  "-Wl,--export=soemdsp_pll_destroy" `
  "-Wl,--export=soemdsp_pll_reset" `
  "-Wl,--export=soemdsp_pll_set_params" `
  "-Wl,--export=soemdsp_pll_process" `
  "-Wl,--export=soemdsp_pll_vco_out" `
  "-Wl,--export=soemdsp_pll_pc_out" `
  "-Wl,--export=soemdsp_pll_lpf_out" `
  "-Wl,--export=soemdsp_pll_locked" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\pll\pll.wasm" `
  "$root\native_modules\pll\pll.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_helmholtz_version" `
  "-Wl,--export=soemdsp_helmholtz_create" `
  "-Wl,--export=soemdsp_helmholtz_destroy" `
  "-Wl,--export=soemdsp_helmholtz_set_params" `
  "-Wl,--export=soemdsp_helmholtz_process" `
  "-Wl,--export=soemdsp_helmholtz_frequency" `
  "-Wl,--export=soemdsp_helmholtz_fidelity" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\helmholtz\helmholtz.wasm" `
  "$root\native_modules\helmholtz\helmholtz.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -msimd128 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_noise_generator_create" `
  "-Wl,--export=soemdsp_noise_generator_destroy" `
  "-Wl,--export=soemdsp_noise_generator_sample" `
  "-Wl,--export=soemdsp_noise_generator_left" `
  "-Wl,--export=soemdsp_noise_generator_right" `
  "-Wl,--export=soemdsp_noise_generator_version" `
  "-Wl,--export=soemdsp_noise_generator_process_block" `
  "-Wl,--export=soemdsp_noise_generator_block_output_left_ptr" `
  "-Wl,--export=soemdsp_noise_generator_block_output_right_ptr" `
  "-Wl,--export=soemdsp_noise_generator_max_block_frames" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\noise_generator\noise_generator.wasm" `
  "$root\native_modules\noise_generator\noise_generator.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_soft_clipper_sample" `
  "-Wl,--export=soemdsp_soft_clipper_version" `
  "-Wl,--export=soemdsp_soft_clipper_metadata_json" `
  "-Wl,--export=soemdsp_soft_clipper_metadata_json_size" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\soft_clipper\soft_clipper.wasm" `
  "$root\native_modules\soft_clipper\soft_clipper.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -msimd128 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_fbm_create" `
  "-Wl,--export=soemdsp_fbm_destroy" `
  "-Wl,--export=soemdsp_fbm_reset" `
  "-Wl,--export=soemdsp_fbm_sample" `
  "-Wl,--export=soemdsp_fbm_x" `
  "-Wl,--export=soemdsp_fbm_y" `
  "-Wl,--export=soemdsp_fbm_z" `
  "-Wl,--export=soemdsp_fbm_x_raw" `
  "-Wl,--export=soemdsp_fbm_y_raw" `
  "-Wl,--export=soemdsp_fbm_z_raw" `
  "-Wl,--export=soemdsp_fbm_version" `
  "-Wl,--export=soemdsp_fbm_process_block" `
  "-Wl,--export=soemdsp_fbm_block_output_x_ptr" `
  "-Wl,--export=soemdsp_fbm_block_output_y_ptr" `
  "-Wl,--export=soemdsp_fbm_block_output_z_ptr" `
  "-Wl,--export=soemdsp_fbm_block_output_x_raw_ptr" `
  "-Wl,--export=soemdsp_fbm_block_output_y_raw_ptr" `
  "-Wl,--export=soemdsp_fbm_block_output_z_raw_ptr" `
  "-Wl,--export=soemdsp_fbm_max_block_frames" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\fractal_brownian_noise\fractal_brownian_noise.wasm" `
  "$root\native_modules\fractal_brownian_noise\fractal_brownian_noise.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_ladder_filter_create" `
  "-Wl,--export=soemdsp_ladder_filter_destroy" `
  "-Wl,--export=soemdsp_ladder_filter_sample" `
  "-Wl,--export=soemdsp_ladder_filter_version" `
  "-Wl,--export=soemdsp_ladder_filter_metadata_json" `
  "-Wl,--export=soemdsp_ladder_filter_metadata_json_size" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\ladder_filter\ladder_filter.wasm" `
  "$root\native_modules\ladder_filter\ladder_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_tb303_filter_create" `
  "-Wl,--export=soemdsp_tb303_filter_destroy" `
  "-Wl,--export=soemdsp_tb303_filter_sample" `
  "-Wl,--export=soemdsp_tb303_filter_version" `
  "-Wl,--export=soemdsp_tb303_filter_metadata_json" `
  "-Wl,--export=soemdsp_tb303_filter_metadata_json_size" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\tb303_filter\tb303_filter.wasm" `
  "$root\native_modules\tb303_filter\tb303_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_passive_filter_create" `
  "-Wl,--export=soemdsp_passive_filter_destroy" `
  "-Wl,--export=soemdsp_passive_filter_sample" `
  "-Wl,--export=soemdsp_passive_filter_version" `
  "-Wl,--export=soemdsp_passive_filter_metadata_json" `
  "-Wl,--export=soemdsp_passive_filter_metadata_json_size" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\passive_filter\passive_filter.wasm" `
  "$root\native_modules\passive_filter\passive_filter.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_vactrol_envelope_create" `
  "-Wl,--export=soemdsp_vactrol_envelope_destroy" `
  "-Wl,--export=soemdsp_vactrol_envelope_sample" `
  "-Wl,--export=soemdsp_vactrol_envelope_version" `
  "-Wl,--export=soemdsp_vactrol_envelope_metadata_json" `
  "-Wl,--export=soemdsp_vactrol_envelope_metadata_json_size" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\vactrol_envelope\vactrol_envelope.wasm" `
  "$root\native_modules\vactrol_envelope\vactrol_envelope.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_shooting_star_explosion_power" `
  "-Wl,--export=soemdsp_shooting_star_explosion_version" `
  "-Wl,--export=soemdsp_shooting_star_explosion_metadata_json" `
  "-Wl,--export=soemdsp_shooting_star_explosion_metadata_json_size" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\shooting_star_explosion\shooting_star_explosion.wasm" `
  "$root\native_modules\shooting_star_explosion\shooting_star_explosion.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_polyblep_create" `
  "-Wl,--export=soemdsp_polyblep_destroy" `
  "-Wl,--export=soemdsp_polyblep_reset" `
  "-Wl,--export=soemdsp_polyblep_sample" `
  "-Wl,--export=soemdsp_polyblep_out" `
  "-Wl,--export=soemdsp_polyblep_saw" `
  "-Wl,--export=soemdsp_polyblep_ramp" `
  "-Wl,--export=soemdsp_polyblep_square" `
  "-Wl,--export=soemdsp_polyblep_tri" `
  "-Wl,--export=soemdsp_polyblep_sine" `
  "-Wl,--export=soemdsp_polyblep_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\polyblep\polyblep.wasm" `
  "$root\native_modules\polyblep\polyblep.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_logistic_map_create" `
  "-Wl,--export=soemdsp_logistic_map_destroy" `
  "-Wl,--export=soemdsp_logistic_map_sample" `
  "-Wl,--export=soemdsp_logistic_map_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\logistic_map\logistic_map.wasm" `
  "$root\native_modules\logistic_map\logistic_map.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_pitch_quantizer_create" `
  "-Wl,--export=soemdsp_pitch_quantizer_destroy" `
  "-Wl,--export=soemdsp_pitch_quantizer_sample" `
  "-Wl,--export=soemdsp_pitch_quantizer_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\pitch_quantizer\pitch_quantizer.wasm" `
  "$root\native_modules\pitch_quantizer\pitch_quantizer.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_henon_map_create" `
  "-Wl,--export=soemdsp_henon_map_destroy" `
  "-Wl,--export=soemdsp_henon_map_sample" `
  "-Wl,--export=soemdsp_henon_map_x" `
  "-Wl,--export=soemdsp_henon_map_y" `
  "-Wl,--export=soemdsp_henon_map_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\henon_map\henon_map.wasm" `
  "$root\native_modules\henon_map\henon_map.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_chua_attractor_create" `
  "-Wl,--export=soemdsp_chua_attractor_destroy" `
  "-Wl,--export=soemdsp_chua_attractor_sample" `
  "-Wl,--export=soemdsp_chua_attractor_x" `
  "-Wl,--export=soemdsp_chua_attractor_y" `
  "-Wl,--export=soemdsp_chua_attractor_z" `
  "-Wl,--export=soemdsp_chua_attractor_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\chua_attractor\chua_attractor.wasm" `
  "$root\native_modules\chua_attractor\chua_attractor.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_surge_oscillator_create" `
  "-Wl,--export=soemdsp_surge_oscillator_destroy" `
  "-Wl,--export=soemdsp_surge_oscillator_reset" `
  "-Wl,--export=soemdsp_surge_oscillator_sample" `
  "-Wl,--export=soemdsp_surge_oscillator_out" `
  "-Wl,--export=soemdsp_surge_oscillator_saw" `
  "-Wl,--export=soemdsp_surge_oscillator_square" `
  "-Wl,--export=soemdsp_surge_oscillator_tri" `
  "-Wl,--export=soemdsp_surge_oscillator_sine" `
  "-Wl,--export=soemdsp_surge_oscillator_synced" `
  "-Wl,--export=soemdsp_surge_oscillator_internal_sync" `
  "-Wl,--export=soemdsp_surge_oscillator_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\surge_oscillator\surge_oscillator.wasm" `
  "$root\native_modules\surge_oscillator\surge_oscillator.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbwirdo_create" `
  "-Wl,--export=soemdsp_jbwirdo_destroy" `
  "-Wl,--export=soemdsp_jbwirdo_reset" `
  "-Wl,--export=soemdsp_jbwirdo_sample" `
  "-Wl,--export=soemdsp_jbwirdo_x" `
  "-Wl,--export=soemdsp_jbwirdo_y" `
  "-Wl,--export=soemdsp_jbwirdo_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_wirdo_spiral\jerobeam_wirdo_spiral.wasm" `
  "$root\native_modules\jerobeam_wirdo_spiral\jerobeam_wirdo_spiral.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbblubb_create" `
  "-Wl,--export=soemdsp_jbblubb_destroy" `
  "-Wl,--export=soemdsp_jbblubb_reset" `
  "-Wl,--export=soemdsp_jbblubb_sample" `
  "-Wl,--export=soemdsp_jbblubb_x" `
  "-Wl,--export=soemdsp_jbblubb_y" `
  "-Wl,--export=soemdsp_jbblubb_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_blubb\jerobeam_blubb.wasm" `
  "$root\native_modules\jerobeam_blubb\jerobeam_blubb.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbmushroom_create" `
  "-Wl,--export=soemdsp_jbmushroom_destroy" `
  "-Wl,--export=soemdsp_jbmushroom_reset" `
  "-Wl,--export=soemdsp_jbmushroom_sample" `
  "-Wl,--export=soemdsp_jbmushroom_x" `
  "-Wl,--export=soemdsp_jbmushroom_y" `
  "-Wl,--export=soemdsp_jbmushroom_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_mushroom\jerobeam_mushroom.wasm" `
  "$root\native_modules\jerobeam_mushroom\jerobeam_mushroom.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbboing_create" `
  "-Wl,--export=soemdsp_jbboing_destroy" `
  "-Wl,--export=soemdsp_jbboing_reset" `
  "-Wl,--export=soemdsp_jbboing_sample" `
  "-Wl,--export=soemdsp_jbboing_x" `
  "-Wl,--export=soemdsp_jbboing_y" `
  "-Wl,--export=soemdsp_jbboing_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_boing\jerobeam_boing.wasm" `
  "$root\native_modules\jerobeam_boing\jerobeam_boing.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbtorus_create" `
  "-Wl,--export=soemdsp_jbtorus_destroy" `
  "-Wl,--export=soemdsp_jbtorus_reset" `
  "-Wl,--export=soemdsp_jbtorus_sample" `
  "-Wl,--export=soemdsp_jbtorus_x" `
  "-Wl,--export=soemdsp_jbtorus_y" `
  "-Wl,--export=soemdsp_jbtorus_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_torus\jerobeam_torus.wasm" `
  "$root\native_modules\jerobeam_torus\jerobeam_torus.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbkepler_create" `
  "-Wl,--export=soemdsp_jbkepler_destroy" `
  "-Wl,--export=soemdsp_jbkepler_reset" `
  "-Wl,--export=soemdsp_jbkepler_sample" `
  "-Wl,--export=soemdsp_jbkepler_x" `
  "-Wl,--export=soemdsp_jbkepler_y" `
  "-Wl,--export=soemdsp_jbkepler_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_kepler_bouwkamp\jerobeam_kepler_bouwkamp.wasm" `
  "$root\native_modules\jerobeam_kepler_bouwkamp\jerobeam_kepler_bouwkamp.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbnyquist_create" `
  "-Wl,--export=soemdsp_jbnyquist_destroy" `
  "-Wl,--export=soemdsp_jbnyquist_reset" `
  "-Wl,--export=soemdsp_jbnyquist_sample" `
  "-Wl,--export=soemdsp_jbnyquist_x" `
  "-Wl,--export=soemdsp_jbnyquist_y" `
  "-Wl,--export=soemdsp_jbnyquist_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_nyquist_shannon\jerobeam_nyquist_shannon.wasm" `
  "$root\native_modules\jerobeam_nyquist_shannon\jerobeam_nyquist_shannon.cpp"

& $clang `
  --target=wasm32 `
  -O3 `
  -nostdlib `
  -fno-exceptions `
  -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_jbradar_create" `
  "-Wl,--export=soemdsp_jbradar_destroy" `
  "-Wl,--export=soemdsp_jbradar_reset" `
  "-Wl,--export=soemdsp_jbradar_sample" `
  "-Wl,--export=soemdsp_jbradar_x" `
  "-Wl,--export=soemdsp_jbradar_y" `
  "-Wl,--export=soemdsp_jbradar_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\jerobeam_radar\jerobeam_radar.wasm" `
  "$root\native_modules\jerobeam_radar\jerobeam_radar.cpp"

