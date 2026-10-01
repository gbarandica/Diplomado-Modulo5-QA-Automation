/**
 * EJERCICIO 1 - Inspeccionar el dataset generado en Mockaroo.
 *
 * No genera datos: LEE el dataset de la carpeta mockaroo/ y muestra un resumen.
 * Sirve para "ver funcionar" el Ejercicio 1 y para entender por que un buen
 * dataset incluye variedad y casos de borde (usuarios sin estado).
 *
 * Ejecutar desde la carpeta raiz del proyecto:
 *   node mockaroo/inspeccionar-mockaroo.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// El script vive dentro de mockaroo/, el JSON esta en la misma carpeta
const rutaJson = path.join(__dirname, 'MOCK_DATA (4).json');

// 1) Cargar el dataset
if (!fs.existsSync(rutaJson)) {
  console.error('No se encontro mockaroo/MOCK_DATA.json. ¿Corriste desde la carpeta raiz del proyecto?');
  process.exit(1);
}
const usuarios = JSON.parse(fs.readFileSync(rutaJson, 'utf-8'));

// 2) Calcular metricas simples
const total = usuarios.length;
const porEstado = {};
let sinEstado = 0;
const paises = new Set();

for (const u of usuarios) {
  paises.add(u.pais);
  if (!u.estado || u.estado.trim() === '') {
    sinEstado++;
  } else {
    porEstado[u.estado] = (porEstado[u.estado] || 0) + 1;
  }
}

// 3) Mostrar el resumen
console.log('===== EJERCICIO 1: dataset de Mockaroo =====');
console.log('Total de usuarios:        ' + total);
console.log('Paises distintos:         ' + paises.size + '  -> ' + [...paises].join(', '));
console.log('---- Usuarios por estado ----');
for (const [estado, n] of Object.entries(porEstado)) {
  console.log('  ' + estado.padEnd(10) + ' : ' + n);
}
console.log('  (sin estado)'.padEnd(13) + ': ' + sinEstado + '   <- CASOS DE BORDE (blank 10%)');

// 4) Validacion basica de "dato bueno": realista y con variedad
const okVariedad = paises.size >= 3;
const okBorde = sinEstado > 0;
console.log('---- Chequeos de calidad del dato ----');
console.log((okVariedad ? '  OK  ' : ' FALLA') + ' hay variedad de paises (>=3)');
console.log((okBorde ? '  OK  ' : ' FALLA') + ' incluye casos de borde (usuarios sin estado)');
console.log('=============================================');
