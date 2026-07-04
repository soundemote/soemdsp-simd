# Progress — soemdsp-sandbox Bugfixes

Branch: `void/sandbox-bugfixes` (off `codex/restore-before-formula-visual`)
Base: commit `ed2533f Add Sabrina reverb WIP module`

## Agent Rules
- Do not ask questions unless truly blocked.
- Make reasonable assumptions and continue.
- Work on unfinished TODOs in order.
- Mark completed TODOs with [x].
- Add new bugs, ideas, or follow-up work as TODOs.
- Run smoke tests (`python scripts\smoke_test.py`) after each fix.
- Build native modules after editing `native_modules/*.cpp`.
- Do not run destructive commands, force pushes, production deploys, or database resets.
- When editing sandbox source, restore `public/presets/useruisettings.json` and `useruisettings.js` from commit `4639c84` before running smoke tests (the test's UI settings update contract writes them back dirty).

## Completed

- [x] **0b** — Fix stale smoke anchor: `patchNode.type === "canvas"` → capability-based check.
- [x] **A** — Patch serialization: add `graphConnections`, `codeScreen`, `windows` to `serializeNodeGraphPatch`. Round-trip verified.
- [x] **K** — Worklet stop session gate: add `sessionId`/`planSerial` guard to `stop` message, matching other message patterns.
- [x] **F** — Centralize unsupported-source gate: replace 45-type hardcoded whitelist with `nodeGraphModuleProducesOutputWithoutSignalInput(type)`. Derives no-input types automatically from module definitions.
- [x] **G** — Unify duplicate-edge policy: graph connections now silently dedupe (`.flatMap` + `return []`) like signal connections and modulations.
- [x] **H** — Share retired-type set: extract `nodeGraphRetiredNodeTypes` constant, UI settings uses same set.
- [x] **B** — Improve CLAP host disconnect error message: mentions under-construction state and `.cmd` launcher path.
- [x] **I** — Surface CLAP feedback as plan-time issue in `compileNodeGraphExecutionPlan`.
- [x] **J** — Log CLAP latency/tail errors via `console.warn` instead of silently degrading to zero.
- [x] **E** — Pad CLAP output buffer by one process chunk to absorb latency compensation shift, preventing trailing silence.
- [x] **O** — Document `/shutdown` route in CLAP host README.
- [x] **M** — Clean Sabrina native module: remove dead `modInc` assignment, raise sample rate cap from 48 kHz to 192 kHz. Wasm rebuilt (6695 bytes).
- [x] **C** — Remove dead rendered playback cursor code (`startNodeGraphRenderedPlaybackCursor`, `tickNodeGraphRenderedPlaybackCursor`).
- [x] **N** — Update stale doc file paths: `ADDING_HARDCODED_SANDBOX_MODULE.md` and `OSC_MODULE_NON_UI_REFERENCE.md` now reference correct files.
- [x] Smoke test passes (all steps green).
- [x] **Module pattern reference** — Wrote `docs/MODULE_PATTERN_REFERENCE.md` documenting the four edit points, definition shape, parameter shape, metadata kinds, runtime contract, native module pattern, and smoke test contract. Supports the DSP-to-module translation mission.
- [x] **Module translation example** — Wrote `docs/MODULE_TRANSLATION_EXAMPLE.md` demonstrating the full DSP-to-module translation workflow with a one-pole lowpass filter: definition, menu button, frame evaluator branch, worklet branch, state reset, verification steps, smoke test anchors.

## Active TODO

- [x] **Push branch** — `git push origin void/sandbox-bugfixes` so Codex can merge.

- [x] **E audit** — Full render-tail/latency audit for CLAP latency compensation. Finding: buffer padding fix prevents writes beyond bounds but trailing `latencyFrames` of output are still zero. `durationSeconds` includes this silence. Proper fix: pre-query latency from host before render, add to engineFrames, trim output. Do this during CLAP host re-enablement.

- [x] **L** — Double normalization on `commitNodeGraphPatch`. Audited: `cloneNodeGraphPatch` is called from ~100 sites, some with unvalidated input, so normalization cannot be removed from the clone itself. The redundant work in `commitNodeGraphPatch` is O(n) on patch size — microseconds for typical patches. Codex marked this intentional/defensive. No action without profiling data showing real cost.

## Backlog Ideas

- [ ] **D (DENIED as stated)** — Ellipsoid native module file-scope globals. Codex confirmed the current call pattern reads x/y/mono synchronously per-node, so no corruption today. Known future-risk for stateful native module templates.
- [ ] **Sabrina instance handles** — Add explicit handle model for multi-instance Sabrina reverb (currently uses a fixed pool of 2).
- [x] **CLAP host UI** — Re-enable CLAP host connect/plugins/diagnostics buttons when the under-construction state is lifted. Re-enablement checklist documented in `docs/WEBUI_CLAP_HOST_PLAN.md` Phase 2.
- [x] **Instance handle pattern** — Wrote `docs/INSTANCE_HANDLE_PATTERN.md` proposing the general native module handle pattern: create/destroy/reset/set_params/process exports, state pool layout, browser-side integration, migration path. Forward-looking design doc, not yet implemented.

## Blocked

BLOCKED. No autonomous work remains. Loop iterations are now no-ops.

State is stable and verified:
- Branch `void/sandbox-bugfixes` @ `4ba2a72` (14 commits, pushed)
- Smoke test passes
- Merge topology verified: fast-forward possible, zero conflicts
- Memory map updated with merge readiness
- Mailbox message to Codex sent, no reply yet
- All documentation complete (3 design docs + CLAP plan update)

Awaiting external input only:
- Architect merge signal (technical gate is clear)
- Codex Sabrina checklist reply
- Architect CLAP host re-enablement decision (for E proper fix)

Stop the loop. Further iterations add no value.
