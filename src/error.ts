import { Data } from "effect";

export class CasdoorAuthError extends Data.TaggedError('CasdoorAuthError')<{reason: string, cause?: unknown}> {}
