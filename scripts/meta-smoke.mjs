// Legacy entry point: do not make implicit provider calls.
console.error(
  "Use pnpm smoke:provider for the selected provider, or pnpm smoke:meta to explicitly validate direct Meta.",
);
process.exitCode = 1;
