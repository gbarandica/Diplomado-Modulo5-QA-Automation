
import { fakerES } from '@faker-js/faker';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rutaSalida = path.join(__dirname, 'usuarios.json');

// Cuantos usuarios generar (puedes cambiarlo)
const CANTIDAD = 1000;

// Semilla fija -> mismos datos en cada corrida (reproducible en CI).
// Comenta esta linea para ver datos distintos cada vez.
fakerES.seed(123);

const estados = ['activo', 'inactivo', 'pendiente'];

function crearUsuario(id) {
  return {
    id,
    nombre: fakerES.person.fullName(),
    //email: faker.internet.email().toLowerCase(),
    //email: '${faker.internet.username().toLowerCase()}@correo.com',
    email: `${fakerES.internet.username().toLowerCase()}@example.com`,
    pais: fakerES.location.country(),
    fecha_registro: fakerES.date.past({ years: 2 }).toISOString(),
    telefono: fakerES.phone.number(),
    //telefono: faker.internet.username(),
    // 10% sin estado -> casos de borde, igual que el blank% de Mockaroo
    estado: fakerES.number.float() < 0.1 ? '' : fakerES.helpers.arrayElement(estados)
  };
}

const usuarios = Array.from({ length: CANTIDAD }, (_, i) => crearUsuario(i + 1));

// Estructura compatible con json-server: { "usuarios": [...] }
// Esto permite hacer:  npx json-server 2-faker/usuarios.json --port 3000
// y tener el endpoint /usuarios disponible directamente.
const db = { usuarios };

fs.writeFileSync(rutaSalida, JSON.stringify(db, null, 2));

// Resumen en consola
const sinEstado = usuarios.filter(u => !u.estado).length;
console.log('===== EJERCICIO 2: Faker con seed =====');
console.log('Generados ' + usuarios.length + ' usuarios en 2-faker/usuarios.json');
console.log('Formato: { usuarios: [...] }  -> listo para json-server');
console.log('Casos de borde (sin estado): ' + sinEstado);
console.log('Primeros 2 (iguales en cada corrida con seed):');
console.log('  1) ' + usuarios[0].nombre + '  <' + usuarios[0].email + '>  ' + usuarios[0].pais);
console.log('  2) ' + usuarios[1].nombre + '  <' + usuarios[1].email + '>  ' + usuarios[1].pais);
console.log('');
console.log('Para subirlo como servicio:');
console.log('  npx json-server 2-faker/usuarios.json --port 3000');
console.log('  -> http://localhost:3000/usuarios');
console.log('=======================================');
