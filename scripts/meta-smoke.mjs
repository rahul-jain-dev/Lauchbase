// A real, small structured-output request. Never prints credentials or response text.
const key = process.env.META_API_KEY?.trim();
if (!key || /replace_|your[_-]|<|placeholder/i.test(key)) {
  console.log(
    "SKIPPED: Meta configuration required. Set META_API_KEY in .env.local.",
  );
} else {
  try {
    const response = await fetch("https://api.meta.ai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.META_MODEL || "muse-spark-1.3",
        max_completion_tokens: 512,
        reasoning_effort: "minimal",
        messages: [{ role: "user", content: "Return ok true." }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "Smoke",
            strict: true,
            schema: {
              type: "object",
              properties: { ok: { type: "boolean" } },
              required: ["ok"],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (JSON.parse(data.choices?.[0]?.message?.content).ok !== true)
      throw new Error("Invalid structured response");
    console.log("PASSED: real Meta structured-output smoke request.");
  } catch {
    console.error(
      "FAILED: real Meta smoke request. Check account/model access and connectivity. Provider details withheld.",
    );
    process.exitCode = 1;
  }
}
