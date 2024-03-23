module.exports = {
  parserOptions: {
    ecmaVersion: 13,
    extraFileExtensions: [".cjs", ".mjs"],
    sourceType: "module",
    requireConfigFile: false
  },

  parser: "@babel/eslint-parser",

  env: {
    browser: true,
    es6: true,
    jquery: true
  },

  extends: ["eslint:recommended", "@typhonjs-fvtt/eslint-config-foundry.js/0.8.0"],

  plugins: [
    "@stylistic/js",
    "jsdoc"
  ],

  ignorePatterns: ["foundry", "gulpfile.mjs", "update-build-tags.js"],

  rules: {
    // Temporarily disabled rules. These would require potentially
    // significant refactors and need testing first.
    "no-case-declarations": "off",
    "no-inner-declarations": "off",
    "no-var": "off",
    eqeqeq: ["off", "smart"],
    indent: "off",
    // indent: ["warn", "tab", { SwitchCase: 1 }],
    // Rules.
    "array-bracket-spacing": ["warn", "never"],
    "array-callback-return": "warn",
    "arrow-spacing": "warn",
    "comma-dangle": ["warn", "never"],
    "comma-style": "warn",
    "computed-property-spacing": "warn",
    "constructor-super": "error",
    "default-param-last": "warn",
    "dot-location": ["warn", "property"],
    "eol-last": ["error", "always"],
    "func-call-spacing": "warn",
    "func-names": ["warn", "never"],
    "getter-return": "warn",
    "lines-between-class-members": "warn",
    "new-parens": ["warn", "always"],
    "newline-per-chained-call": "warn",
    "no-alert": "warn",
    "no-array-constructor": "warn",
    "no-class-assign": "warn",
    "no-compare-neg-zero": "warn",
    "no-cond-assign": "warn",
    "no-const-assign": "error",
    "no-constant-condition": "warn",
    "no-constructor-return": "warn",
    "no-delete-var": "warn",
    "no-dupe-args": "warn",
    "no-dupe-class-members": "warn",
    "no-dupe-keys": "warn",
    "no-duplicate-case": "warn",
    "no-duplicate-imports": ["warn", { includeExports: true }],
    "no-else-return": "warn",
    "no-empty": ["warn", { allowEmptyCatch: true }],
    "no-empty-character-class": "warn",
    "no-empty-pattern": "warn",
    "no-func-assign": "warn",
    "no-global-assign": "warn",
    "no-implicit-coercion": ["warn", { allow: ["!!"] }],
    "no-implied-eval": "warn",
    "no-import-assign": "warn",
    "no-invalid-regexp": "warn",
    "no-irregular-whitespace": "warn",
    "no-iterator": "warn",
    "no-lone-blocks": "warn",
    "no-lonely-if": "warn",
    "no-misleading-character-class": "warn",
    "no-mixed-operators": "warn",
    "no-multi-str": "warn",
    "no-multiple-empty-lines": ["warn", { max: 1 }],
    "no-new-func": "warn",
    "no-new-object": "warn",
    "no-new-symbol": "warn",
    "no-new-wrappers": "warn",
    "no-nonoctal-decimal-escape": "warn",
    "no-obj-calls": "warn",
    "no-octal": "warn",
    "no-octal-escape": "warn",
    "no-promise-executor-return": "warn",
    "no-proto": "warn",
    "no-regex-spaces": "warn",
    "no-script-url": "warn",
    "no-self-assign": "warn",
    "no-self-compare": "warn",
    "no-setter-return": "warn",
    "no-sequences": "warn",
    "no-template-curly-in-string": "warn",
    "no-this-before-super": "error",
    "no-unexpected-multiline": "warn",
    "no-unmodified-loop-condition": "warn",
    "no-unneeded-ternary": "warn",
    "no-unreachable": "warn",
    "no-unreachable-loop": "warn",
    "no-unsafe-negation": ["warn", { enforceForOrderingRelations: true }],
    "no-unsafe-optional-chaining": ["warn", { disallowArithmeticOperators: true }],
    "no-unused-expressions": "warn",
    "no-useless-backreference": "warn",
    "no-useless-call": "warn",
    "no-useless-catch": "warn",
    "no-useless-computed-key": ["warn", { enforceForClassMembers: true }],
    "no-useless-concat": "warn",
    "no-useless-constructor": "warn",
    "no-useless-rename": "warn",
    "no-useless-return": "warn",
    "no-void": "warn",
    "no-whitespace-before-property": "warn",
    "prefer-numeric-literals": "warn",
    "prefer-object-spread": "warn",
    "prefer-regex-literals": "warn",
    "prefer-spread": "warn",
    "rest-spread-spacing": ["warn", "never"],
    "semi-spacing": "warn",
    "semi-style": ["warn", "last"],
    "space-unary-ops": ["warn", { words: true, nonwords: false }],
    "switch-colon-spacing": "warn",
    "symbol-description": "warn",
    "template-curly-spacing": ["warn", "never"],
    "unicode-bom": ["warn", "never"],
    "use-isnan": ["warn", { enforceForSwitchCase: true, enforceForIndexOf: true }],
    "valid-typeof": ["warn", { requireStringLiterals: true }],
    "wrap-iife": ["warn", "inside"],

    "arrow-parens": ["warn", "always"],
    "comma-spacing": "warn",
    "dot-notation": "warn",
    "key-spacing": "warn",
    "keyword-spacing": ["warn", { overrides: { catch: { before: true, after: false } } }],
    "max-len": [
      "warn",
      {
        code: 120,
        ignoreComments: true,
        ignoreTrailingComments: true,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }
    ],
    "no-extra-boolean-cast": ["warn", { enforceForLogicalOperands: true }],
    "no-extra-semi": "warn",
    "no-multi-spaces": ["warn", { ignoreEOLComments: true }],
    "no-throw-literal": "error",
    "no-trailing-spaces": "warn",
    "no-useless-escape": "warn",
    "no-unused-vars": ["warn", { args: "none" }],
    "nonblock-statement-body-position": ["warn", "beside"],
    "one-var": ["warn", "never"],
    "operator-linebreak": [
      "warn",
      "before",
      {
        overrides: { "=": "after", "+=": "after", "-=": "after" }
      }
    ],
    "prefer-template": "warn",
    semi: "warn",
    "space-before-blocks": ["warn", "always"],
    "space-before-function-paren": [
      "warn",
      {
        anonymous: "always",
        named: "never",
        asyncArrow: "always"
      }
    ],
    "spaced-comment": "warn",

    "@stylistic/js/quote-props": ["warn", "as-needed", { keywords: false }],
    "@stylistic/js/quotes": ["warn", "double", { avoidEscape: true, allowTemplateLiterals: true }],
    "@stylistic/js/space-in-parens": "warn",
    "@stylistic/js/object-curly-spacing": ["warn", "always"],
    "@stylistic/js/brace-style": ["warn", "stroustrup"],

    "jsdoc/check-access": "warn",
    "jsdoc/check-alignment": "warn",
    "jsdoc/check-examples": "off",
    "jsdoc/check-indentation": "off",
    "jsdoc/check-line-alignment": "off",
    "jsdoc/check-param-names": "warn",
    "jsdoc/check-property-names": "warn",
    "jsdoc/check-syntax": "off",
    "jsdoc/check-tag-names": "warn",
    "jsdoc/check-types": "warn",
    "jsdoc/check-values": "warn",
    "jsdoc/empty-tags": "warn",
    "jsdoc/implements-on-classes": "warn",
    "jsdoc/match-description": "off",
    "jsdoc/newline-after-description": "off",
    "jsdoc/no-bad-blocks": "warn",
    "jsdoc/no-defaults": "off",
    "jsdoc/no-types": "off",
    "jsdoc/no-undefined-types": "off",
    "jsdoc/require-description": "warn",
    "jsdoc/require-description-complete-sentence": "off",
    "jsdoc/require-example": "off",
    "jsdoc/require-file-overview": "off",
    "jsdoc/require-hyphen-before-param-description": ["warn", "never"],
    "jsdoc/require-jsdoc": "warn",
    "jsdoc/require-param": "warn",
    "jsdoc/require-param-description": "off",
    "jsdoc/require-param-name": "warn",
    "jsdoc/require-param-type": "warn",
    "jsdoc/require-property": "warn",
    "jsdoc/require-property-description": "off",
    "jsdoc/require-property-name": "warn",
    "jsdoc/require-property-type": "warn",
    "jsdoc/require-returns": "warn",
    "jsdoc/require-returns-check": "warn",
    "jsdoc/require-returns-description": "off",
    "jsdoc/require-returns-type": "warn",
    "jsdoc/require-throws": "off",
    "jsdoc/require-yields": "warn",
    "jsdoc/require-yields-check": "warn",
    "jsdoc/valid-types": "off"
  },

  globals: {
    DocumentSheetConfig: false,
    globalThis: false,
    PIXI: false,
    CodeMirror: false,
    Tokenizer: false,
    Color: false,
    Sequence: false,
    Tour: false,
    parseMarkdown: false,
    NumericTerm: false,
    OperatorTerm: false
  },

  overrides: [
    {
      files: ["./*.js", "./*.cjs", "./*.mjs"],
      env: {
        node: true
      }
    }
  ],

  settings: {
    jsdoc: {
      mode: "typescript",
      preferredTypes: {
        ".<>": "<>",
        Object: "object"
      },
      tagNamePreference: {
        augments: "extends"
      }
    }
  }
};
