/** Paths into the generated corpus fixture. */
import path from "node:path";
import { fileURLToPath } from "node:url";

// vitest runs from the repo root; the corpus lives in test/corpus next to this file.
export const CORPUS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
export const SCENARIOS_JSON = path.join(CORPUS_DIR, "scenarios.json");
