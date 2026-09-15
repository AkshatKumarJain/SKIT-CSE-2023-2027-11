import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import "dotenv/config";

import { collectContext } from "./collect-context";

const repoRoot =
    path.resolve(__dirname, "..");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

function getSafeOutputPath(
    outputDirectory: string,
    relativeFilePath: string
): string {

    const resolved =
        path.resolve(
            outputDirectory,
            relativeFilePath
        );

    const normalizedOutput =
        path.resolve(
            outputDirectory
        );

    if (
        !resolved.startsWith(
            normalizedOutput + path.sep
        )
    ) {
        throw new Error(
            `Unsafe generated test path: ${relativeFilePath}`
        );
    }

    return resolved;
}

const GeneratedTest = z.object({
    filePath: z.string(),

    testType: z.enum([
        "unit",
        "integration"
    ]),

    explanation: z.string(),

    content: z.string()
});

const TestGenerationResult = z.object({
    summary: z.string(),

    tests: z.array(
        GeneratedTest
    )
});

async function main() {

    const context =
        collectContext();

    if (
        context.changedFiles.length === 0
    ) {
        console.log(
            "No relevant source files changed."
        );

        return;
    }

    const systemPrompt = `
You are an expert software testing engineer.

Your ONLY responsibility is to generate automated tests.

You MUST NOT:

- modify production code
- fix production bugs
- refactor production code
- rewrite production code
- generate production source files
- generate unrelated tests
- remove existing functionality

Developers are students and may not know how to write tests.

Therefore:

- generate complete runnable test files
- make tests understandable
- explain what each test verifies
- cover important success cases
- cover important failure cases
- cover important edge cases
- cover important business rules

UNIT TESTS:

Use unit tests for isolated business logic,
services, utilities and components.

Mock external dependencies when appropriate.

INTEGRATION TESTS:

Use integration tests for interactions between
multiple application layers.

For backend:
- routes
- middleware
- controllers
- services
- database interactions where appropriate

For frontend:
- components
- API interactions
- user workflows

IMPORTANT:

The AI is generating tests only.

The AI must never modify production code.

The test runner determines whether tests pass.

Passing tests does not prove that the application is correct.

Use the provided context and business rules.

Generate meaningful tests instead of maximizing test count.
`;

    const userPrompt = `
PROJECT CONTEXT

ARCHITECTURE:
${context.architecture}

TESTING RULES:
${context.testing}

CONVENTIONS:
${context.conventions}

BACKEND:
${context.backend}

FRONTEND:
${context.frontend}

CHANGED FILES:
${context.changedFiles.join("\n")}

CHANGED SOURCE AND MODULE CONTEXT:

${context.sourceFiles
    .map(file => `
APPLICATION:
${file.application}

MODULE:
${file.moduleName}

FILE:
${file.file}

MODULE CONTEXT:
${file.moduleContext}

MODULE ENDPOINTS:
${file.endpoints}

SOURCE:
${file.content}
`)
    .join("\n")}

Generate tests only for behavior affected by
the changed files.

Generate unit tests and integration tests
where appropriate.

Do not generate tests for unrelated modules.

Return complete runnable test files.
`;

    const response =
        await ai.models.generateContent({

            model:
                process.env.GEMINI_MODEL ||
                "gemini-3.6-flash",

            contents:
                userPrompt,

            config: {

                systemInstruction:
                    systemPrompt,

                responseMimeType:
                    "application/json",

                responseJsonSchema: {

                    type: "object",

                    properties: {

                        summary: {
                            type: "string"
                        },

                        tests: {

                            type: "array",

                            items: {

                                type: "object",

                                properties: {

                                    filePath: {
                                        type: "string"
                                    },

                                    testType: {
                                        type: "string",
                                        enum: [
                                            "unit",
                                            "integration"
                                        ]
                                    },

                                    explanation: {
                                        type: "string"
                                    },

                                    content: {
                                        type: "string"
                                    }
                                },

                                required: [
                                    "filePath",
                                    "testType",
                                    "explanation",
                                    "content"
                                ]
                            }
                        }
                    },

                    required: [
                        "summary",
                        "tests"
                    ]
                }
            }
        });

    const rawOutput =
        response.text;

    if (!rawOutput) {
        throw new Error(
            "Gemini returned an empty response."
        );
    }

    let parsedOutput: unknown;

    try {

        parsedOutput =
            JSON.parse(rawOutput);

    } catch {

        throw new Error(
            "Gemini returned invalid JSON."
        );
    }

    const result =
        TestGenerationResult.parse(
            parsedOutput
        );

    const outputDirectory =
        path.join(
            repoRoot,
            ".ai-generated-tests"
        );

    fs.mkdirSync(
        outputDirectory,
        {
            recursive: true
        }
    );

    for (
        const test of result.tests
    ) {

        const filePath =
    getSafeOutputPath(
        outputDirectory,
        test.filePath
    );

        fs.mkdirSync(
            path.dirname(filePath),
            {
                recursive: true
            }
        );

        fs.writeFileSync(
            filePath,
            test.content
        );

        console.log(
            `Generated ${test.testType} test: ${test.filePath}`
        );
    }

    fs.writeFileSync(
        path.join(
            outputDirectory,
            "test-report.json"
        ),
        JSON.stringify(
            result,
            null,
            2
        )
    );

    console.log(
        "\nAI Test Generation Complete"
    );

    console.log(
        result.summary
    );
}

main().catch(error => {

    console.error(
        "Test generation failed:",
        error
    );

    process.exit(1);
});