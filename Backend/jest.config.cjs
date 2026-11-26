module.exports = {
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      { tsconfig: { module: "CommonJS", moduleResolution: "Node" } },
    ],
  },
  testEnvironment: "node",
  clearMocks: true,
  roots: ["<rootDir>/src"],
};
