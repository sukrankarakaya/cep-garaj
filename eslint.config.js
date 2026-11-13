// ESLint flat config. Forbidden dependencies: docs/architecture.md (1-4), docs/security.md,
// docs/conventions.md (clock only in src/app). Proven by tools/eslint-rules.test.ts.
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

// Forbidden 4 — no network APIs in Faz 1 (sensitive area 2, KVKK).
const NETWORK_MSG = "Faz 1'de ağ çağrısı yasak (docs/architecture.md, Forbidden dependencies 4).";
const NETWORK_APIS = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"];
const networkGlobals = NETWORK_APIS.map((name) => ({ name, message: NETWORK_MSG }));
const networkProperties = [
  ["navigator", "sendBeacon"],
  ...["window", "globalThis", "self"].flatMap((object) =>
    NETWORK_APIS.map((property) => [object, property]),
  ),
].map(([object, property]) => ({ object, property, message: NETWORK_MSG }));
// no-restricted-properties matches object.property only, so chains like window.navigator.sendBeacon
// or window.self.fetch escape it (Known traps; review 0001 L-2): match the property by name.
const networkMember = {
  selector: `MemberExpression[property.name=/^(sendBeacon|${NETWORK_APIS.join("|")})$/]`,
  message: NETWORK_MSG,
};

const CLOCK_MSG = "Saat yalnızca src/app/ saat sağlayıcısında okunur (docs/architecture.md).";
const dateNow = { object: "Date", property: "now", message: CLOCK_MSG };
const clockSyntax = [
  "NewExpression[callee.name='Date']",
  "CallExpression[callee.name='Date']", // Date() without new also returns the current time
  "NewExpression[callee.property.name='Date']", // new globalThis.Date()
  "CallExpression[callee.property.name='Date']",
  "MemberExpression[object.property.name='Date'][property.name='now']", // window.Date.now()
].map((selector) => ({ selector, message: CLOCK_MSG }));
const innerHtml = {
  selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
  message: "dangerouslySetInnerHTML yasak (docs/security.md).",
};

// Forbidden 1 — domain imports nothing of the app or its frameworks.
const domainForbidden = {
  group: [
    "react",
    "react/**",
    "react-dom",
    "react-dom/**",
    "dexie",
    "dexie/**",
    "**/storage",
    "**/storage/**",
    "**/features",
    "**/features/**",
    "**/ui",
    "**/ui/**",
    "**/app",
    "**/app/**",
  ],
  message: "domain/ hiçbir şey import etmez (docs/architecture.md, Forbidden dependencies 1).",
};
// Forbidden 2 — features reach data only through the public interface of storage.
const featuresStorage = [
  { group: ["dexie", "dexie/**"], message: "features Dexie kullanmaz (Forbidden dependencies 2)." },
  {
    group: ["**/storage/*"],
    message: "features yalnızca storage/index kullanır (Forbidden dependencies 2).",
  },
];
// Forbidden 3 — no feature reaches into the internals of another feature; only its index.
const DEEP_MSG =
  "Başka bir feature yalnızca index.ts üzerinden kullanılır (Forbidden dependencies 3).";
const featuresNoDeepImports = [
  { group: ["**/features/*/*"], message: DEEP_MSG },
  // a sibling feature by relative path: "../<feature>/<file>" (not "../../…")
  { regex: "^\\.\\./(?!\\.\\.)[^/]+/.+", message: DEEP_MSG },
];

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "dist/",
      "coverage/",
      "adapters/",
      "docs/",
      "prompts/",
      "specs/",
      "workflows/",
      "scripts/",
      ".anew-dev/",
      ".claude/",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", ...networkGlobals],
      "no-restricted-properties": ["error", ...networkProperties, dateNow],
      "no-restricted-syntax": ["error", innerHtml, networkMember, ...clockSyntax],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-properties": ["error", ...networkProperties],
      "no-restricted-syntax": ["error", innerHtml, networkMember],
    },
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: { "no-restricted-imports": ["error", { patterns: [domainForbidden] }] },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [...featuresStorage, ...featuresNoDeepImports] },
      ],
    },
  },
  {
    files: ["*.config.{js,ts}", "tools/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
);
