import type { SdkConfig } from "casdoor-js-sdk/lib/cjs/sdk";
import { Schema } from "effect";

export type CasdoorAuthConfig = SdkConfig & {
    storageKey: string;
    storageType: 'session' | 'memory' | 'local';
    callbackRedirectPath: string;
}

export const JWTDataSchema = Schema.Struct({
    access_token: Schema.String,
    refresh_token: Schema.String,
    id_token: Schema.optional(Schema.String),
    token_type: Schema.String,
    expires_in: Schema.Number,
    refresh_expires_in: Schema.optional(Schema.Number),
    scope: Schema.String,
});

export const tokenErrorSchema = Schema.Struct({
    error: Schema.String,
    error_description: Schema.String,
})

export const authDataWithErrorSchema = Schema.Union(JWTDataSchema, tokenErrorSchema)

export type JWTData = typeof JWTDataSchema.Type;

const schema = Schema.parseJson()
export const decodeJSON = Schema.decodeUnknownSync(schema)
