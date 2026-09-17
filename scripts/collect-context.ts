import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const repoRoot = path.resolve(__dirname, "..");

function readFile(relativePath: string): string {
    const fullPath = path.join(repoRoot, relativePath);

    if (!fs.existsSync(fullPath)) {
        return "";
    }

    return fs.readFileSync(fullPath, "utf-8");
}

function getChangedFiles(): string[] {

    const baseSha =
        process.env.BASE_SHA || "origin/dev";

    const headSha =
        process.env.HEAD_SHA || "HEAD";

    const command =
        `git diff --name-only ${baseSha}...${headSha}`;

    const output =
        execSync(command, {
            cwd: repoRoot,
            encoding: "utf-8"
        });

    return output
        .split("\n")
        .map(file => file.trim())
        .filter(Boolean)
        .filter(file =>
            /\.(ts|tsx|js|jsx)$/.test(file)
        )
        .filter(file =>
            !file.includes("node_modules")
        )
        .filter(file =>
            !file.includes("dist/")
        )
        .filter(file =>
            !file.includes(".ai-generated-tests/")
        );
}

function getModuleInfo(file: string) {

    const backendMatch = file.match(
        /^Backend\/src\/modules\/([^/]+)\/(.+)$/
    );

    if (backendMatch) {

        return {
            application: "backend",
            moduleName: backendMatch[1],
            modulePath:
                `Backend/src/modules/${backendMatch[1]}`
        };
    }

    const frontendMatch = file.match(
        /^frontend\/src\/modules\/([^/]+)\/(.+)$/
    );

    if (frontendMatch) {

        return {
            application: "frontend",
            moduleName: frontendMatch[1],
            modulePath:
                `frontend/src/modules/${frontendMatch[1]}`
        };
    }

    return null;
}

function getModuleContext(file: string) {

    const moduleInfo = getModuleInfo(file);

    if (!moduleInfo) {
        return {
            application: "",
            moduleName: "",
            context: "",
            endpoints: ""
        };
    }

    const contextPath = path.join(
        repoRoot,
        moduleInfo.modulePath,
        ".ai-context",
        "context.txt"
    );

    const endpointsPath = path.join(
        repoRoot,
        moduleInfo.modulePath,
        ".ai-context",
        "endpoints.txt"
    );

    return {
        application: moduleInfo.application,
        moduleName: moduleInfo.moduleName,
        context: fs.existsSync(contextPath)
            ? fs.readFileSync(contextPath, "utf-8")
            : "",

        endpoints: fs.existsSync(endpointsPath)
            ? fs.readFileSync(endpointsPath, "utf-8")
            : ""
    };
}

export function collectContext() {

    const changedFiles = getChangedFiles();
    const sourceFiles = changedFiles.map(file => {
        
        const moduleContext = getModuleContext(file);

        return {
            file,
            content: readFile(file),

            application:
                moduleContext.application,

            moduleName:
                moduleContext.moduleName,

            moduleContext:
                moduleContext.context,

            endpoints:
                moduleContext.endpoints
        };
    });

    return {
        changedFiles,

        architecture: readFile(
            ".ai-context/architecture.txt"
        ),

        testing: readFile(
            ".ai-context/testing.txt"
        ),

        conventions: readFile(
            ".ai-context/conventions.txt"
        ),

        backend: readFile(
            ".ai-context/backend.txt"
        ),

        frontend: readFile(
            ".ai-context/frontend.txt"
        ),

        sourceFiles
    };
}