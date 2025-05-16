import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import backgrounds from "./vite_generate_backgrounds.js";
import fs from 'fs';

fs.writeFileSync('./src/config/cardbacks.js', backgrounds);

// https://vitejs.dev/config/
export default defineConfig({
    base: '/FABKIT/',
    plugins: [
        tailwindcss(),
        vue()
    ],
    server: {
        port: 8080,
    }
});