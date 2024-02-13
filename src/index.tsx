import React, { Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { DbProvider } from "./DbContext";
import { AppContextProvider } from "./AppContext";
import "./i18n";
import { fetchDbFunc } from "./db";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import ErrorBoundary from "./ErrorBoundary";
import { CollectionContextProvider } from "./CollectionContext";
import { ReactNativeContextProvider } from "./ReactNativeContext";
const App = lazy(() => import("./App"));

const isHuman = () => {
  const agents = [
    "googlebot",
    "bingbot",
    "slurp",
    "duckduckbot",
    "baiduspider",
    "yandexbot",
    "facebot",
    "ia_archiver",
    "sitecheckerbotcrawler",
    "chrome-lighthouse",
  ];
  return !navigator.userAgent.match(new RegExp(agents.join("|"), "i"));
};

// content is render only for human
if (isHuman()) {
  // performance consideration
  // the app is highly orientated by the routes data
  // fetching should be done to avoid unnecessary rendering
  // Target: render only if development or prerendering or in registered app or lazy loading page
  const prerenderStyle = document.querySelector("style[prerender]");
  const workboxPromise = serviceWorkerRegistration.register({
    onUpdate: (_, skipWaiting) => {
      skipWaiting();
    },
  });
  const fetchDb = fetchDbFunc();
  const allPromise = Promise.all([fetchDb, workboxPromise]);

  // remove prerendered style
  if (prerenderStyle instanceof HTMLStyleElement) {
    document.getElementById("root").innerHTML = "";
    prerenderStyle.innerHTML = "";
  }
  const Container = () => {
    const [state, setState] = useState({
      initialized: false,
      workbox: undefined,
      db: undefined,
    });

    useEffect(() => {
      allPromise.then(([fetchDbResult, workbox]) => {
        setState({ initialized: true, workbox: workbox, db: fetchDbResult });
      });
    }, []);

    if (!state.initialized) return <></>;

    return (
      <ErrorBoundary>
        <DbProvider initialDb={state.db}>
          <CollectionContextProvider>
            <AppContextProvider workbox={state.workbox}>
              <ReactNativeContextProvider>
                <Suspense fallback={<div>Loading...</div>}>
                  <App />
                </Suspense>
              </ReactNativeContextProvider>
            </AppContextProvider>
          </CollectionContextProvider>
        </DbProvider>
      </ErrorBoundary>
    );
  };

  const root = createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <Container />
    </React.StrictMode>
  );
}
