# Adding a Hardcoded Sandbox Module to the Current WebUI

This guide describes the current WebUI path for adding a module to
`soemdsp-sandbox`.

Current state: WebUI modules are hardcoded sandbox modules. Adding one means
editing sandbox source code. There is not yet a user-facing custom module
loader, manifest-driven module registry, plugin API, WASM module format, CLAP
or JUCE module path, or server-persisted project/module format.

This guide does not describe the final C++ API.

## Edit Points

Use the existing modules as the template: `osc`, `noise`, `gain`, and `bias`.

1. Define the module type in `public/node-graph-module-definitions.js`.

   Main anchor: `nodeGraphModuleDefinitions`.

   Add the new module key, ports, and parameters. A source module usually has
   `outputs`. A processor usually has `inputs` and `outputs`. The `output`
   module is special and should not be used as a template for ordinary modules.

2. Add a user-visible label in `public/node-graph-module-definitions.js`.

   Main anchor: `nodeGraphNodeLabels`.

   The label is used by module headers, port labels, accessibility labels, and
   debug/UI text.

3. Add the module to the empty-scene Add Module menu if users should create it
   from the WebUI.

   File: `public/index.html`.

   Current menu buttons use `data-context-module`:

   ```html
   <button type="button" role="menuitem" data-context-module="noise">Noise</button>
   ```

4. Add offline Render Sample behavior if the module produces or transforms
   audio.

   File: `public/node-graph-live-frame-evaluator.js`.

   Main anchor: `evaluateNodeGraphPlanFrame(...)`.

   Add a branch for the new `node.type`. Use existing helpers such as effective
   parameter reads and input mixing where possible.

5. Add matching Live Audio behavior if the module should sound the same while
   Live Audio is running.

   File: `public/node-live-audio-worklet.js`.

   Main anchor: `NodeLiveAudioProcessor.evaluateFrame(...)`.

   Render Sample and Live Audio are sibling browser execution lanes. A module
   with sound behavior must be implemented in both lanes to preserve audible
   parity.

6. Update the smoke test when the new module becomes part of the durable
   sandbox contract.

   File: `scripts/smoke_test.py`.

   Add checks for the source anchors, menu marker, metadata shape, execution
   branch, and worklet branch that should not regress.

## Parameter Metadata

Module parameters use the existing metadata shape. Use only fields the current
WebUI understands:

- `key`
- `label`
- `defaultValue`
- `min`
- `mid`
- `max`
- `step`
- `kind`
- `unit`
- `choices`
- `displayChoices`
- `divideChoicesVisibly`
- `showSign`
- `wraparound`
- `linearSmoothing`

The backend metadata kind source is mirrored from
`soemdsp/include/soemdsp/meta.hpp` through the sandbox metadata templates. Keep
metadata names and meanings aligned with that source when a module uses shared
metadata kinds.

## Patch JSON Boundary

Patch JSON can save and load current WebUI authoring state:

- module instances
- module positions
- parameter values
- parameter metadata
- signal connections
- modulation connections
- bypassed nodes
- visual settings
- floating window positions

Patch JSON cannot define a new module type by itself yet. A patch can instantiate
only module types already hardcoded in the sandbox source.

## Runtime Boundary

The sandbox server is read-only. It serves static files and inspection artifacts.
It does not persist modules, projects, or patch files server-side.

The browser compiler is demo-scoped UI machinery. It is not the production
`soemdsp` scheduler, not a plugin layer, and not a committed project format.

The WebUI does not instantiate real C++ DSP objects yet. Live Audio currently
uses browser JavaScript and AudioWorklet equivalents.

Preserve this architecture boundary:

- Circuit does not own concrete DSP objects.
- DSP objects do not know Circuit.
- Binding is the bridge.

## Checklist

Before considering a hardcoded module complete:

- The module type exists in `nodeGraphModuleDefinitions`.
- The module label exists in `nodeGraphNodeLabels`.
- The Add Module menu includes a `data-context-module` button if user creation
  is intended.
- Render Sample behavior exists in `evaluateNodeGraphPlanFrame(...)` if the
  module affects audio.
- Live Audio behavior exists in `NodeLiveAudioProcessor.evaluateFrame(...)` if
  the module affects audio.
- Smoke tests cover the source markers and behavior contract that must survive
  future edits.
- The documentation still states that this is not a plugin API, manifest module
  format, WASM module format, CLAP/JUCE path, or final C++ module API.
