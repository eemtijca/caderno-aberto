import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"

// Lint rigoroso: nada de variável morta, hook sem dependência declarada,
// any explícito, console em código de produção ou entidade sem escapar.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "react-hooks/exhaustive-deps": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    // componentes shadcn/ui gerados e hooks do template: regras do react-compiler
    // desligadas apenas aqui (padrão da ferramenta), sem relaxar o app em si
    files: ["src/components/ui/**", "src/hooks/use-toast.ts", "src/hooks/use-mobile.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // scripts de build registram progresso no terminal por natureza
    files: ["scripts/**", "tests/**"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // imagens do editor vêm de URLs externas do professor; next/image exigiria
    // whitelist de domínio arbitrário, então <img> segue como escolha técnica
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "examples/**",
      "skills",
      "tests/**",
      "e2e/**",
      "tools/**",
      "public/**",
      "playwright.config.*",
    ],
  },
]

export default eslintConfig
