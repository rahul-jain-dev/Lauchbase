# Settings screenshot evidence

`settings-active-desktop.png` and `settings-active-mobile.png` show the AI connections dialog at desktop and 390px mobile widths. Both were captured from a production build by the browser tests using clearly named model fixtures and synthetic connection/test responses. They contain no real API keys and establish no live provider verification.

The flows check model search, credit disclosure, compatibility failure then success, explicit activation, key replacement/disconnect, no key in browser persistent storage, centered/no-overflow layout, and retained intake answers when Settings closes. Actual server cookie lifecycle/isolation is separately covered by route-handler tests with provider HTTP fixtures.

Cloud preparation changed routine output to ignored `artifacts/screenshots/`. Use `PLAYWRIGHT_SCREENSHOT_DIR=docs/screenshots` only for an intentional reviewed fixture refresh; do not treat a fresh image as live provider evidence.
