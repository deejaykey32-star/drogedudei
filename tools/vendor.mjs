// Kopiuje biblioteki z node_modules do www/vendor (aplikacja działa bez CDN, także offline w APK).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const base = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
};
copy(path.join(base, 'node_modules/leaflet/dist'), path.join(base, 'www/vendor/leaflet'));
copy(path.join(base, 'node_modules/three/build/three.module.min.js'), path.join(base, 'www/vendor/three/three.module.min.js'));
copy(path.join(base, 'node_modules/three/LICENSE'), path.join(base, 'www/vendor/three/LICENSE'));
console.log('vendor: leaflet + three skopiowane');
