import { useCallback } from "react";
import { Effect, Schema } from "effect";
import { decodeJSON, JWTData, JWTDataSchema, authDataWithErrorSchema, CasdoorAuthConfig } from "./types";
import { CasdoorAuthError } from "./error";
import Sdk from "casdoor-js-sdk";
import { useToken, useAuthStatus, setToken } from "./state";
export type { SdkConfig } from "casdoor-js-sdk/lib/cjs/sdk";

const getAuthDataFromStorage = (config: CasdoorAuthConfig) => {
    const storage = config.storageType === 'session' ? sessionStorage : localStorage;
    return Effect.gen(function* () {
        if(config.storageType === 'memory') {
            return {
                tokenData: useToken(),
                isAuthed: useAuthStatus(),
            }
        }
        

        const tokenRaw = yield* Effect.try({
            try: () => storage.getItem(config.storageKey),
            catch: (error) => {
                return new CasdoorAuthError({reason: 'Error getting auth data from storage', cause: error});
            }
        })
        if (!tokenRaw) return null;

        const tokenJSON = decodeJSON(tokenRaw);
        const token = yield* Schema.decodeUnknown(JWTDataSchema)(tokenJSON);
        return {
            tokenData: token,
            isAuthed: !!token.access_token,
        }
    }).pipe(Effect.catchTags({
        CasdoorAuthError: (error) => {
            return Effect.gen(function* () {
                yield* Effect.logError('Failed to get auth data from storage', error);
                return null;
            })
        },
        ParseError: (error) => {
            return Effect.gen(function* () {
                yield* Effect.logError('Failed to get auth data from local storage', error);
                yield* Effect.try({
                    try: () => storage.removeItem(config.storageKey),
                    catch: (error) => {
                        console.log('Failed to remove auth data from local storage', error);
                        return new CasdoorAuthError({reason: 'Failed to remove auth data from local storage', cause: error});
                    }
                })
                return null;
            })
        }
    }))
}

const refreshAuthData = (authData: JWTData, config: CasdoorAuthConfig, CasdoorSDK: Sdk) => {
    const storage = config.storageType === 'session' ? sessionStorage : localStorage;

    return Effect.gen(function* () {
        const resRaw = yield* Effect.tryPromise({
            try: () => CasdoorSDK.refreshAccessToken(authData.refresh_token),
            catch: (error) => {
                return new CasdoorAuthError({reason: 'Failed to refresh auth data', cause: error});
            }
        })
        const res = decodeJSON(JSON.stringify(resRaw));
        const resData = yield* Schema.decodeUnknown(authDataWithErrorSchema)(res);
        if( 'error' in resData) {
            yield* Effect.logError('Failed to refresh auth data', resData);
            yield* Effect.try({
            try: () => storage.removeItem(config.storageKey),
                catch: (error) => {
                    console.log('Failed to remove auth data from local storage', error);
                    return new CasdoorAuthError({reason: 'Failed to remove auth data from local storage', cause: error});
                }
            })
            return null;
        }

        return resData;
    }).pipe(Effect.catchAll(() => Effect.gen(function* () {
        yield* Effect.logError('Failed to refresh auth data');
        return null;
    })))
}

export function useCasdoorAuth(config: CasdoorAuthConfig, CasdoorSDK: Sdk) {
    // const tokenData = useToken();
    // const isAuthed = useAuthStatus();
    const data = Effect.runSync(getAuthDataFromStorage(config));
    if(!data) {
        return {
            CasdoorSDK,
            isLoading: false,
            isAuthenticated: false,
            getToken: () => null,
        }
    }
    const { tokenData, isAuthed } = data;

    const getToken = useCallback(async ({ ignoreCache }: { ignoreCache?: boolean } = {}) => {
        const authData = tokenData;
        console.log('authData', authData);
        if (!authData) {
            return null;
        }

        if (ignoreCache) {
            console.log('ignoreCache', ignoreCache);

            const jwtData = await Effect.runPromise(refreshAuthData(authData, config, CasdoorSDK));
            if(config.storageType === 'memory') {
                setToken(jwtData, false);
            }

            if (!jwtData) return null;
            return jwtData.access_token;
        }

        return authData.access_token;
    }, [tokenData]);

    function login() {
        CasdoorSDK.signin_redirect()
    }
    function logout() {
        setToken(null);
    }

    return {
        CasdoorSDK,
        isLoading: false,
        isAuthenticated: isAuthed,
        getToken,
    };
}