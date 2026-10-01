/**
 * EJERCICIO 3 (parte B) - Anonimizar datos reales para cumplir GDPR.
 *
 * Toma reales/clientes.json (datos personales) y produce
 * reales/clientes-anonimos.json (seguro para usar en test) aplicando
 * cuatro tecnicas de anonimizacion:
 *
 *   1) Sustitucion sintetica  -> nombre real reemplazado por uno falso
 *   2) Enmascarado (mask)      -> email y telefono ocultan parte del valor
 *   3) Hash irreversible        -> documento -> SHA-256 (mismo doc = mismo hash)
 *   4) Generalizacion           -> fecha exacta de nacimiento -> solo el año
 *
 * Ejecutar desde la carpeta raiz del proyecto (antes corre: npm run dump-real):
 *   node reales/anonimizar.js
 *   npm run anonimizar
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { faker } from '@faker-js/faker';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpeta = __dirname;
const rutaEntrada = path.join(carpeta, 'clientes.json');
const rutaSalida = path.join(carpeta, 'clientes-anonimos.json');

// Semilla para que los nombres falsos tambien sean reproducibles
faker.seed(777);

// --- Tecnicas de anonimizacion ---

// 2) Enmascarar email: conserva 2 letras iniciales y oculta el resto
function maskEmail(email) {
  const [user, domain] = email.split('@');
  const tld = domain.split('.').pop();
  return user.slice(0, 2) + '***@***.' + tld;
}

// 2) Enmascarar telefono: deja visibles solo los ultimos 2 digitos
function maskTelefono(tel) {
  return String(tel).replace(/\d(?=\d{2})/g, '*');
}

// 3) Hash irreversible del documento (mismo doc -> mismo hash, no reversible)
//funcion mantiene la misma longitud deja los 2 primeros numeros y cambia l rtesto
function hashDoc(doc) {
  return crypto.createHash('sha256').update(String(doc)).digest('hex').slice(0, 12);
 }

// 4) Generalizar fecha de nacimiento a solo el año
function year(fechaISO) {
  
  return new Date(fechaISO).getFullYear();
}

// --- Proceso ---
if (!fs.existsSync(rutaEntrada)) {
  console.error('No existe reales/clientes.json. Corre primero:  npm run dump-real');
  process.exit(1);
}

const reales = JSON.parse(fs.readFileSync(rutaEntrada, 'utf-8'));

const anonimos = reales.map(c => ({
  id: c.id,
  nombre: faker.person.fullName(),      // 1) sustitucion sintetica
  email: maskEmail(c.email),            // 2) enmascarado
  documento: hashDoc(c.documento),      // 3) hash
  telefono: maskTelefono(c.telefono),   // 2) enmascarado
  anio_nacimiento: year(c.fecha_nacimiento) // 4) generalizacion
}));

fs.writeFileSync(rutaSalida, JSON.stringify(anonimos, null, 2));

// --- Demostracion en consola: antes vs despues ---
const r = reales[0];
const a = anonimos[0];
console.log('===== EJERCICIO 3B: anonimizacion GDPR =====');
console.log('Anonimizados ' + anonimos.length + ' registros en reales/clientes-anonimos.json');
console.log('');
console.log('ANTES  (real, NO puede salir de produccion):');
console.log('  nombre="' + r.nombre + '"  email="' + r.email + '"');
console.log('  documento="' + r.documento + '"  telefono="' + r.telefono + '"  nacimiento="' + r.fecha_nacimiento + '"');
console.log('');
console.log('DESPUES (anonimo, seguro para test):');
console.log('  nombre="' + a.nombre + '"  email="' + a.email + '"');
console.log('  documento="' + a.documento + '"  telefono="' + a.telefono + '"  año_nacimiento=' + a.anio_nacimiento);
console.log('');

// Propiedad clave del hash: estable (mismo input -> mismo output)
const doc = reales[0].documento;
const h1 = hashDoc(doc);
const h2 = hashDoc(doc);
console.log('Hash estable? mismo documento hasheado 2 veces: ' + (h1 === h2 ? 'SI (' + h1 + ')' : 'NO'));
console.log('  -> permite hacer joins sin exponer el dato, y es irreversible.');
console.log('=============================================');
