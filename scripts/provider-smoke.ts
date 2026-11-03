import { Provider } from "../src/lib/inference";
import { emptyRequirements } from "../src/lib/idea-analysis";
import { analyzeIdea, rankFoundations } from "../src/server/ai";
import { providerStatus } from "../src/server/providers/config";
import { safeProviderError } from "../src/server/providers/errors";

const index = process.argv.indexOf("--provider");
if (index !== -1)
  process.env.AI_PROVIDER = Provider.parse(process.argv[index + 1]);
const status = providerStatus();
if (!status.ready) {
  if (status.issue?.code !== "configuration_required") process.exitCode = 1;
  console.log(
    JSON.stringify({
      state: "skipped",
      provider: status.provider,
      model: status.model,
      issue: status.issue,
      liveInference: false,
    }),
  );
} else {
  const steps: unknown[] = [];
  try {
    const input = {
      ...emptyRequirements,
      idea: "A personal address book. Each customer works independently with their own saved contacts. No customer payments, file uploads or background tasks are needed.",
      experience: "comfortable" as const,
    };
    const analysis = await analyzeIdea(input);
    steps.push({ check: "idea_analysis", state: "passed", ...analysis.meta });
    // Explicit smoke-run answers override all proposals. This is not automatic user confirmation.
    const answered = {
      ...input,
      accountModel: "individual" as const,
      billing: "no" as const,
      uploads: "no" as const,
      background: "no" as const,
    };
    const ranking = await rankFoundations(answered);
    if (ranking.rankings[0]?.foundationId !== "individual")
      throw new Error("Unexpected recommendation");
    steps.push({ check: "recommendation", state: "passed", ...ranking.meta });
    console.log(
      JSON.stringify({ state: "passed", liveInference: true, steps }, null, 2),
    );
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          state: "failed",
          provider: status.provider,
          model: status.model,
          steps,
          issue: safeProviderError(error),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
}
