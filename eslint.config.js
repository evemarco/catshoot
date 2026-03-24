import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                window: "readonly",
                document: "readonly",
                performance: "readonly",
                Math: "readonly",
                setTimeout: "readonly",
                requestAnimationFrame: "readonly",
                cancelAnimationFrame: "readonly",
            }
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^(ac|c|freq|t|i|angle|dist|ctx|s|data|isDog|size|margin|side|x|y|vx|vy|rect|scaleX|scaleY|clickX|clickY|dx|dy|dist|targetX|targetY|angle|speed|angleOffset|text|isGood|el|reason|deltaTime|timestamp|a|animal|mouseEvent|e)$" }],
            "no-undef": "error",
            "no-redeclare": "error",
            "no-const-assign": "error",
            "no-unreachable": "warn",
        }
    }
];
