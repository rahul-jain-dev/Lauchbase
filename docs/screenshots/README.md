# Milestone 1A.1 screenshots

Captured October 31, 2026 from the production build in headless Microsoft Edge.

- `1a1-initial-desktop.png` and `1a1-initial-mobile.png`: the initial form with four visible inputs and closed advanced/catalog sections.
- `1a1-results-desktop.png` and `1a1-results-mobile.png`: actual manual answers through the local API with a placeholder Meta key, showing a rules-only individual-foundation comparison and an explicit $0 budget.

These screenshots contain no AI extraction or live AI recommendation. The example idea and answers were entered by the browser check. Separate browser scenarios use labeled intercepted analysis fixtures to verify ambiguity, explicit-answer priority and unsupported requirements; those are not live Meta evidence.

Both layouts were visually inspected and checked for horizontal overflow. Routine browser runs now save images under ignored `artifacts/screenshots/`. To intentionally refresh reviewed screenshots in this directory, run `pnpm build` and then set `PLAYWRIGHT_SCREENSHOT_DIR=docs/screenshots` for `pnpm test:e2e`; inspect the images and update their evidence descriptions before committing. Test coverage and screenshot names have evolved since this capture.
