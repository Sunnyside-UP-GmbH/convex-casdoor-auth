import Sdk from "casdoor-js-sdk";
import { CasdoorAuthConfig } from "./types";
import { useCasdoorAuth as useCasdoorAuthHook } from "./useCasdoorAuth";
import { setToken } from "./state";

export function createCasdoorReactClient(config: CasdoorAuthConfig) {
    const storage = config.storageType === 'session' ? sessionStorage : localStorage;

    function autoLogin(autoLogin: boolean) {
        localStorage.setItem('autoLogin', autoLogin.toString());
    }
    function isAutoLogin() {
        return localStorage.getItem('autoLogin') === 'true';
    }
    const CasdoorSDK = new Sdk(config);

    function login() {
        CasdoorSDK.signin_redirect()
    }
    function logout() {
        autoLogin(false);
        if(config.storageType === 'memory') {
            setToken(null)
        } else {
            storage.removeItem(config.storageKey);
        }
    }
    return {
        useCasdoorAuth: () => useCasdoorAuthHook(config, CasdoorSDK),
        login,
        logout,
        isAutoLogin,
        autoLogin,
        CasdoorSDK,
    }
}

// Re-export all modules and types for library consumers
export * from "./types";
export { useCasdoorAuth } from "./useCasdoorAuth";
export { default as Callback } from "./Callback";
export * from "./state";
export * from "./error";
