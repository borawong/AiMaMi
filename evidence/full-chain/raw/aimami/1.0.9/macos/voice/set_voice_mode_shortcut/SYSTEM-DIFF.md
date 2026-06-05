# System Diff - set_voice_mode_shortcut

- AiMaMi 1.0.9 macos: frontend voice wrapper surface exists in the classification bundle, but backend command owner is absent from the same-platform IDB.
- upstream 1.1/master comparison: voice is recorded by the coordination bundle as removed/product-decision-required.
- Platform boundary: macos only; the other platform has its own raw leaf.
