import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir:'./demo-e2e', workers:1,
  use:{baseURL:'http://127.0.0.1:8878',headless:true,
    launchOptions:process.env.MODELSHEET_CHROMIUM ? {executablePath:process.env.MODELSHEET_CHROMIUM} : {},
    screenshot:'only-on-failure'},
  webServer:{command:'python3 -m http.server 8878 --bind 127.0.0.1 --directory ../site',
    url:'http://127.0.0.1:8878/playground/',reuseExistingServer:!process.env.CI},
});
