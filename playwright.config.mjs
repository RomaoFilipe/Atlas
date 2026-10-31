import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/browser',fullyParallel:false,workers:1,timeout:30000,
 use:{baseURL:'http://127.0.0.1:31482',headless:true,launchOptions:{args:['--no-sandbox']}},
 webServer:{command:'node scripts/browser-test-server.mjs',wait:{stdout:/Atlas pronto:/},gracefulShutdown:{signal:'SIGTERM',timeout:5000},reuseExistingServer:false,timeout:30000}
});
