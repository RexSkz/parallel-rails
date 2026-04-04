# Parallel Rails Docs Index

[中文](./README.md)

This doc set currently focuses on technical implementation so gameplay, charting, and design docs can be added later without mixing concerns.

## Documents

- `docs/architecture.en.md`
  - runtime architecture
  - module responsibilities
  - scene lifecycle
  - resource and render flow
- `docs/core-implementation.en.md`
  - input synchronization model
  - tick / timing math
  - editor ruler behavior
  - hit object positioning
  - judgement and scoring rules
- `docs/debug-and-dev.en.md`
  - debug entry points
  - local cache and chart export helpers
  - build, dev, and asset layout notes

## Suggested reading order

1. Start with `docs/architecture.en.md` for the big picture.
2. Then read `docs/core-implementation.en.md` for the gameplay/editor core logic.
3. Finish with `docs/debug-and-dev.en.md` for debugging and day-to-day development.

## Current scope

These documents describe how the code works today.

Still intentionally out of scope for now:

- gameplay explanation
- chart design principles
- feel / balance tuning notes
- art and audio production workflow
- full design specs for hold / switch mechanics
