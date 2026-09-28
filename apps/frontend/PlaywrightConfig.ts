import { defineConfig } from "@playwright/test";
export default defineConfig({
  testMatch: "**/*Spec.ts",
  testDir: "./test/browser",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3101",
    ...(process.env.PLAYWRIGHT_CHANNEL
      ? { channel: process.env.PLAYWRIGHT_CHANNEL }
      : {}),
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101/login",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
