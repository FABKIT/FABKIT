import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import getCardbacks from "./vite_generate_backgrounds.js";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(async ({mode}) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the
    // `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');
    fs.writeFileSync('./src/config/cardbacks.js', await getCardbacks(env.SOURCE));

    return {
        base: '/',
        plugins: [
            vue()
        ],
        server: {
            // uncomment for local network testing
            // host: '0.0.0.0',
            port: 8080,
        },
        build: {
          cssCodeSplit: true,
          rollupOptions: {
            output: {
              manualChunks: {
                lottie: ['lottie-web'],
                tiptap: ['@tiptap/core', 'prosemirror-transform', 'prosemirror-model', 'prosemirror-view'],
                emoji: ['@tiptap/extension-emoji'],
                konva: ['konva'],
              }
            }
          }
        }
    }
})
