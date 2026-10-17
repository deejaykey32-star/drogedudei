// Przygotowuje paczkę do publikacji: dist/web (PWA) + plik APK do pobrania ze strony „Aplikacja na Androida”.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(base, 'dist', 'web');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(base, 'www'), out, { recursive: true });
const apk = path.join(base, 'android/app/build/outputs/apk/debug/app-debug.apk');
if (fs.existsSync(apk)) {
  fs.copyFileSync(apk, path.join(out, 'drogedudei.apk'));
  fs.copyFileSync(apk, path.join(base, 'dist', 'drogedudei.apk'));
  console.log('dist: PWA + APK', (fs.statSync(apk).size / 1048576).toFixed(1), 'MB');
} else console.log('dist: PWA (brak APK – uruchom npm run android:build)');
