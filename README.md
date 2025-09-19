# convex-casdoor-auth

```
import { useCallback, useMemo } from "react";
import { createCasdoorReactClient, CasdoorAuthConfig } from "convex-casdoor-auth"

export const casdoorConfig: CasdoorAuthConfig = {
    serverUrl: "https://casdor.io",
    clientId: "",
    appName: "",
    organizationName: "",
    redirectPath: "/callback",
    scope: "openid profile email offline_access",
    storageKey: "jwt_token",
    storage: localStorage,
    storageType: "memory",
    callbackRedirectPath: "/",
}
export const { useCasdoorAuth, login, logout, isAutoLogin, autoLogin, CasdoorSDK } = createCasdoorReactClient(casdoorConfig);
export function useAuthFromCasdoor() {
    const { isLoading, isAuthenticated, getToken } = useCasdoorAuth();
    console.log('isAuthenticated', isAuthenticated, isLoading);
    const fetchAccessToken = useCallback(
        async ({ forceRefreshToken }: { forceRefreshToken?: boolean } = {}) => {
        return await getToken({ ignoreCache: forceRefreshToken });
    },[getToken]);

    return useMemo(
        () => ({
            isLoading: isLoading,
            isAuthenticated: isAuthenticated ?? false,
            fetchAccessToken,
        }),
        [isLoading, isAuthenticated, fetchAccessToken],
    );
}
```

```
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { CasdoorSDK, casdoorConfig, useAuthFromCasdoor } from "./useCasdoorAuth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Callback } from "convex-casdoor-auth";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function Root() {

  return (
      <BrowserRouter>
        <ConvexProviderWithAuth client={convex} useAuth={useAuthFromCasdoor}>
          <Routes>
            <Route path={casdoorConfig.redirectPath} element={<Callback casdoorConfig={casdoorConfig} CasdoorSDK={CasdoorSDK} loadingComponent={<p>Completing login...!!!</p>} />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </ConvexProviderWithAuth>
      </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
```
