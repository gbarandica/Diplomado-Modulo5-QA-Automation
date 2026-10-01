/**
 * EJERCICIO 3 (parte A) - Generar un dump "real" de clientes.
 *
 * Simula una copia de produccion con datos PERSONALES: nombre, email,
 * documento, telefono y fecha de nacimiento. En la vida real esto vendria
 * de un backup de la base de datos; aqui lo fabricamos con Faker para
 * poder practicar la anonimizacion SIN usar datos de personas reales.
 *
 * IMPORTANTE: este archivo representa datos que NO pueden salir de produccion
 * sin anonimizar. El siguiente paso (anonimizar.js) los vuelve seguros.
 *
 * Ejecutar desde la carpeta raiz del proyecto:
 *   node reales/generar-dump-real.js
 *   npm run dump-real
 */
import { faker } from '@faker-js/faker';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// El script vive dentro de reales/, la salida va en la misma carpeta
const carpeta = __dirname;
const ruta = path.join(carpeta, 'clientes.json');

const CANTIDAD = 15;

// Semilla distinta a la del otro script: son datos "de otra fuente".
faker.seed(2024);

function documentoAleatorio() {
  // Documento de 10 digitos (tipo cedula), como string
  return String(faker.number.int({ min: 1000000000, max: 9999999999 }));
}

function telefonoAleatorio() {
  // Telefono de 10 digitos, solo numeros (facil de enmascarar despues)
  return String(faker.number.int({ min: 3000000000, max: 3999999999 }));
}

function crearCliente(id) {
  return {
    id,
    nombre: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    documento: documentoAleatorio(),
    telefono: telefonoAleatorio(),
    fecha_nacimiento: faker.date
      .birthdate({ min: 18, max: 80, mode: 'age' })
      .toISOString()
      .slice(0, 10)
  };
}

const clientes = Array.from({ length: CANTIDAD }, (_, i) => crearCliente(i + 1));

fs.mkdirSync(carpeta, { recursive: true });
fs.writeFileSync(ruta, JSON.stringify(clientes, null, 2));

console.log('===== EJERCICIO 3A: dump "real" (SIMULADO) =====');
console.log('Generados ' + clientes.length + ' clientes en reales/clientes.json');
console.log('OJO: trae datos personales (documento, email, telefono). NO usar crudo en test.');
console.log('Ejemplo (real): ' + clientes[0].nombre + ' | ' + clientes[0].email +
  ' | doc ' + clientes[0].documento + ' | tel ' + clientes[0].telefono);
console.log('Siguiente paso:  npm run anonimizar');
console.log('================================================');
