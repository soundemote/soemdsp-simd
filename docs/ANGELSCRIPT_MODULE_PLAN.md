# AngelScript Module Plan

Status: planning note. This is not an implementation contract yet.

## Purpose

AngelScript should become the middle lane between hardcoded sandbox modules and
compiled C++/WASM modules.

```text
Hardcoded sandbox modules: fastest app integration, least portable.
AngelScript modules: fast user/developer DSP iteration without compiling.
C++/WASM modules: stable high-performance modules for expensive DSP.
```

The goal is a scriptable DSP module path that feels close to C++ authoring but
does not require users to enter the compile/build loop.

## Boundary

AngelScript should define module behavior, ports, parameters, and optional UI
layout hints. It should not own browser UI interaction.

AngelScript may own:

- module metadata;
- input/output declarations;
- parameter declarations;
- per-sample or per-block DSP/control logic;
- persistent DSP state;
- optional requests for existing widget types.

AngelScript must not own:

- mouse/touch/keyboard behavior;
- raw DOM access;
- patch graph mutation;
- module-to-module hidden communication;
- floating window behavior;
- arbitrary drawing primitives for controls;
- new custom interaction models.

The sandbox remains the owner of interaction, persistence, modulation, widget
behavior, tooltips, sizing, skin selection, and graph rules.

## Module Tiers

### Hardcoded Sandbox Modules

These remain useful for app-native behavior, browser-specific tools, special
debug modules, and UI glue.

### AngelScript Modules

These should be good for:

- DSP sketches;
- user-authored generators/processors;
- control logic modules;
- examples that may later graduate to C++;
- shareable modules that do not require a compiler.

### C++/WASM Modules

These should be good for:

- expensive modules;
- stable production DSP;
- modules that need careful optimization;
- reference implementations that should not depend on browser scripting speed.

## First Version

Start with a file-based scripted module path, not an in-app code editor.

Suggested folder:

```text
angelscript_modules/
```

Suggested first example:

```text
angelscript_modules/sincos/SinCos.as
angelscript_modules/sincos/manifest.json
```

V1 should scan script module manifests, register modules in the browser catalog,
and execute a small DSP API. The editor window can come later after the runtime
is stable.

## Minimal Script API

Keep the API tiny and explicit.

Possible script shape:

```cpp
void prepare(float sampleRate) {
}

void process() {
    float phase = stateFloat("phase");
    float freq = param("Freq");
    float amp = param("Amp");

    phase += freq / sampleRate;
    if (phase >= 1.0f) phase -= 1.0f;

    out("Sin", sin(phase * TAU) * amp);
    out("Cos", cos(phase * TAU) * amp);

    setStateFloat("phase", phase);
}
```

The exact syntax can change. The important constraint is that scripts read
inputs and params, write outputs, and store local state through a small API.

## Metadata

Script metadata should describe the module without requiring UI code.

Example manifest direction:

```json
{
  "type": "scriptSinCos",
  "label": "Script SinCos",
  "category": "Oscillator",
  "script": "SinCos.as",
  "inputs": [
    { "key": "freq", "label": "Freq" },
    { "key": "amplitude", "label": "Amplitude" },
    { "key": "phase", "label": "0.1V" }
  ],
  "outputs": [
    { "key": "sin", "label": "Sin" },
    { "key": "cos", "label": "Cos" }
  ],
  "params": [
    { "key": "freq", "label": "Freq", "min": 0, "mid": 440, "max": 20000, "defaultValue": 440, "unit": "Hz" },
    { "key": "amp", "label": "Amp", "min": 0, "mid": 0.5, "max": 1, "defaultValue": 1 }
  ]
}
```

The manifest should normalize into the same module-definition shape used by
hardcoded modules wherever possible.

## UI Model

AngelScript should not create custom UI behavior. It may request existing
widgets for declared parameters.

Allowed widget requests should be semantic:

```text
slider
knob
toggle
button
menu
number
color
LED
meter
scope
```

The sandbox owns how those widgets behave.

Script-side layout hints may be allowed later:

```text
section "Oscillator"
slider "Freq"
knob "Amp"
LED "Active"
```

These are hints, not authority. The app can ignore, normalize, or remap them.

## Skinning Boundary

Skinning should be separate from AngelScript.

Mental model:

```text
AngelScript says what the module is.
The widget system says what controls exist and how they behave.
The skin system says how known controls are drawn.
```

A skin may define how to draw known things:

- knob;
- slider;
- LED;
- port;
- scope;
- meter;
- value text;
- switch;
- button.

A skin may not invent new things that need to be drawn or new interactions.

Rule:

```text
Here are the things that need drawing.
You may code how they get drawn.
You may not invent new things that need to be drawn.
```

## Editor Window

Do not make the first AngelScript implementation depend on the current editor
window.

The editor window can be a later convenience layer:

- open script for the selected module;
- show compile/runtime errors;
- reload script;
- revert to file/defaults.

V1 should work from files and manifests first.

## Runtime Notes

Open decisions:

- whether AngelScript runs inside a native/WASM helper or a browser-side runtime;
- whether processing is sample-by-sample or block-based first;
- how to safely expose state;
- how to report compile/runtime errors;
- how to keep Live Audio and Render Sample behavior identical.

Requirements:

- no hidden module-to-module communication;
- no DOM access;
- finite-number guarding at the runtime boundary;
- deterministic behavior between offline and live lanes where possible;
- clear status when a script fails to compile or execute.

## Phases

### Phase 1: File-Based Prototype

- Add `angelscript_modules/`.
- Add one manifest-driven script module.
- Register it in the module catalog.
- Execute a tiny DSP API.
- Surface compile/runtime errors as status text.
- No in-app editor.

### Phase 2: Stable Module Contract

- Normalize script manifests into existing module definitions.
- Add smoke checks for script discovery and metadata.
- Preserve script module references in patches.
- Add basic reload behavior.

### Phase 3: UI Hints

- Allow scripts to request existing widgets.
- Keep app-owned interaction.
- Ignore unsupported hints calmly.

### Phase 4: Editor Convenience

- Add module-local script editor/status window.
- Keep runtime file/manifest driven.
- Do not require editor state for playback or patch load.

### Phase 5: Promotion Path

- Document how an AngelScript module graduates into C++/WASM.
- Keep parameter and port metadata aligned so patches can migrate cleanly.

## Non-Goals

- AngelScript as a UI event language.
- AngelScript as a DOM scripting surface.
- A freeform custom widget system.
- Replacing C++/WASM modules.
- Replacing hardcoded app-native modules.
- Building a full in-app IDE before the runtime works.

