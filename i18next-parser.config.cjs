module.exports = {
  contextSeparator: "_",
  createOldCatalogs: false,
  defaultNamespace: "translation",
  defaultValue: "",
  indentation: 2,
  input: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "context/**/*.{ts,tsx}",
    "hooks/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!i18n/**",
  ],
  keepRemoved: false,
  keySeparator: ".",
  lexers: {
    default: ["JavascriptLexer"],
    js: [{ lexer: "JavascriptLexer", functions: ["t"] }],
    jsx: [
      {
        lexer: "JsxLexer",
        attr: "i18nKey",
        componentFunctions: ["Trans"],
        functions: ["t"],
      },
    ],
    ts: [
      {
        lexer: "JavascriptLexer",
        functions: ["t"],
        namespaceFunctions: ["useTranslation", "withTranslation"],
      },
    ],
    tsx: [
      {
        lexer: "JsxLexer",
        attr: "i18nKey",
        componentFunctions: ["Trans"],
        functions: ["t"],
        namespaceFunctions: ["useTranslation", "withTranslation"],
      },
    ],
  },
  lineEnding: "auto",
  locales: ["en", "my", "zh", "th"],
  namespaceSeparator: ":",
  output: "i18n/extracted/$LOCALE/$NAMESPACE.json",
  pluralSeparator: "_",
  sort: true,
};
