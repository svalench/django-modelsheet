import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './e2e', workers:1, use: {
    baseURL:'http://127.0.0.1:8765', headless:true,
    launchOptions: process.env.MODELSHEET_CHROMIUM ? {executablePath:process.env.MODELSHEET_CHROMIUM} : {},
    screenshot:'only-on-failure', trace:'retain-on-failure',
  },
  webServer: {
    command:'python3 ../manage.py migrate --noinput && python3 ../manage.py seed_demo --rows 500 --create-user && python3 ../manage.py runserver 127.0.0.1:8765 --noreload',
    url:'http://127.0.0.1:8765/admin/login/', timeout:30000, reuseExistingServer: !process.env.CI,
  },
});
