// Providers support different JSON Schema subsets. Runtime Zod still enforces
// lengths and all application constraints after this portable wire schema.
export function wireSchema(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid schema");
  const schema = value as Record<string, unknown>;
  const allowed = [
    "type",
    "enum",
    "required",
    "additionalProperties",
    "minItems",
    "maxItems",
    "description",
  ];
  const result: Record<string, unknown> = {};
  // Some provider subsets accept enum but not const. Never discard literal constraints.
  if (Object.hasOwn(schema, "const")) result.enum = [schema.const];
  for (const key of allowed)
    if (schema[key] !== undefined) result[key] = schema[key];
  if (schema.properties)
    result.properties = Object.fromEntries(
      Object.entries(schema.properties as Record<string, unknown>).map(
        ([key, v]) => [key, wireSchema(v)],
      ),
    );
  if (schema.items) result.items = wireSchema(schema.items);
  if (schema.anyOf) result.anyOf = (schema.anyOf as unknown[]).map(wireSchema);
  return result;
}
