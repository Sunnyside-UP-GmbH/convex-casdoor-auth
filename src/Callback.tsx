import { useEffect, useRef, type ReactNode } from "react";
import { Effect } from "effect";
import { setToken } from "./state";
import { useNavigate } from "react-router-dom";
import { CasdoorAuthConfig } from "./types";
import Sdk from "casdoor-js-sdk";

function AuthCallback({ loadingComponent, casdoorConfig, CasdoorSDK }: { casdoorConfig: CasdoorAuthConfig, CasdoorSDK: Sdk, loadingComponent?: ReactNode }) {
  const ranRef = useRef(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    Effect.runFork(HandleCallback(navigate, casdoorConfig, CasdoorSDK));
  }, []);

  return loadingComponent ?? <p>Authenticating...</p>;
}

export default AuthCallback;

const HandleCallback = (navigate: ReturnType<typeof useNavigate>, config: CasdoorAuthConfig, CasdoorSDK: Sdk) => {
  return Effect.gen(function* () {
    const token = yield* Effect.tryPromise({
      try: () => CasdoorSDK.exchangeForAccessToken(),
      catch: (error) => {
        console.error('Error exchanging for access token:', error);
        throw error;
      },
    });
    if(config.storageType === 'memory') {
      setToken(token);
    } else {
      const storage = config.storageType === 'session' ? sessionStorage : localStorage;
      storage.setItem(config.storageKey, JSON.stringify(token));
    }
    navigate(config.callbackRedirectPath);
  })
}