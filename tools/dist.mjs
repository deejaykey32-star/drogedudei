// Przygotowuje paczkę do publikacji: dist/web (PWA) + plik APK do pobrania ze strony „Aplikacja na Androida”.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseApk = path.join(base, 'android/app/build/outputs/apk/release/app-release.apk');
const debugApk = path.join(base, 'android/app/build/outputs/apk/debug/app-debug.apk');
const apk = fs.existsSync(releaseApk) ? releaseApk : debugApk;

const www = path.join(base, 'www');
const wwwDownload = path.join(www, 'download');
const out = path.join(base, 'dist', 'web');
const outDownload = path.join(out, 'download');

if (fs.existsSync(apk)) {
  fs.mkdirSync(wwwDownload, { recursive: true });
  fs.copyFileSync(apk, path.join(www, 'drogedudei.apk'));
  fs.copyFileSync(apk, path.join(wwwDownload, 'drogedudei.apk'));
  fs.copyFileSync(apk, path.join(wwwDownload, 'DrogEduDei.apk'));
}

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(www, out, { recursive: true });

if (fs.existsSync(apk)) {
  fs.mkdirSync(path.join(base, 'dist'), { recursive: true });
  fs.copyFileSync(apk, path.join(base, 'dist', 'drogedudei.apk'));
  fs.mkdirSync(outDownload, { recursive: true });
  fs.copyFileSync(apk, path.join(out, 'drogedudei.apk'));
  fs.copyFileSync(apk, path.join(outDownload, 'drogedudei.apk'));
  fs.copyFileSync(apk, path.join(outDownload, 'DrogEduDei.apk'));
  const mb = (fs.statSync(apk).size / 1048576).toFixed(1);
  const type = apk === releaseApk ? 'RELEASE (podpisany cyfrowo)' : 'DEBUG';
  console.log(`dist: PWA + APK ${type} gotowy (${mb} MB) -> www/, dist/ oraz dist/web/`);
} else {
  console.log('dist: PWA (brak APK – uruchom najpierw npm run android:build)');
}
