# Dia 1 - Gestion avanzada de datos de prueba

Proyecto de ejercicios de la **Sesion 1** (Certificacion 5 - QA Cloud-Native).
Todo esta listo para ejecutar. Aprenderas a **generar**, **anonimizar** y
**versionar** datos de prueba, el cimiento de cualquier automatizacion cloud-native.

> Regla de oro del dia: un dato de prueba sirve solo si es
> **realista + suficiente + aislado + legal**.

---

## Requisitos

- **Node.js v20 o superior** (`node --version`)
- Terminal **PowerShell** (Windows)
- (Opcional) Cuenta en [mockaroo.com](https://mockaroo.com) para el Ejercicio 1

## Instalacion (una vez)

Desde esta carpeta (`datos-sinteticos`):

```powershell
npm install
```

Esto instala `@faker-js/faker` y `json-server`.

---

## Estructura del proyecto

```
datos-sinteticos/
├── package.json            # scripts npm (ver abajo)
├── README.md               # este archivo
├── .gitignore              # versiona el seed, ignora la copia de trabajo
│
├── 1-mockaroo/             # Ejercicio 1: Mockaroo
│   ├── inspeccionar-mockaroo.js   # lee el dataset y muestra resumen
│   ├── usuarios.csv               # dataset de ejemplo pre-generado
│   ├── usuarios.json              # mismo dataset en JSON
│   └── README.md                  # como se configuro en Mockaroo
│
├── 2-faker/                # Ejercicio 2: Faker
│   ├── generar-usuarios.js        # genera 1000 usuarios con seed reproducible
│   └── usuarios.json              # salida: { "usuarios": [...] } (se regenera)
│
├── 3-anomizar/             # Ejercicio 3: GDPR y anonimizacion
│   ├── 1-generar-dump-real.js     # crea dump simulado con datos personales
│   └── 2-anonimizar.js            # aplica mask/hash/sustitucion/generalizacion
│
├── seed/                   # Ejercicio 4: Versionado y paralelo
│   ├── seed.js                    # todos los modos del Ej.4 (seed/restaurar/paralelo)
│   ├── restaurar.ps1              # restaura data/ desde el seed (alternativa PowerShell)
│   └── usuarios.seed.json         # estado original (se genera, versionar en Git)
│
└── data/                   # copia de trabajo desechable (se genera, NO versionar)
    └── usuarios.json
```

## Scripts npm disponibles

| Comando               | Que hace                                                        |
|-----------------------|-----------------------------------------------------------------|
| `npm run inspeccionar`| Ej.1 — inspecciona el dataset de Mockaroo                       |
| `npm run generar`     | Ej.2 — genera 1000 usuarios con Faker (seed fija)               |
| `npm run dump-real`   | Ej.3A — genera un dump "real" simulado de clientes              |
| `npm run anonimizar`  | Ej.3B — anonimiza el dump para cumplir GDPR                     |
| `npm run seed`        | Ej.4A — crea seed/usuarios.seed.json + data/usuarios.json       |
| `npm run restaurar`   | Ej.4A — restaura data/ desde el seed (equivalente al .ps1)      |
| `npm run api`         | levanta json-server sobre `data/usuarios.json` (puerto 3000)    |
| `npm run paralelo`    | Ej.4B — demo de aislamiento por prefijo (requiere API arriba)   |
| `npm run todo`        | encadena: generar + dump-real + anonimizar + seed               |

---

## Ejercicio 1 - Mockaroo (datos sinteticos visuales)

En clase generas tu propio dataset en mockaroo.com. Aqui dejamos uno listo en
`1-mockaroo/` para inspeccionarlo. Ver `1-mockaroo/README.md` para las columnas.

```powershell
npm run inspeccionar
```

Salida esperada: total de usuarios, paises distintos, cuantos por estado y cuantos
**sin estado** (los casos de borde del `blank 10%`), mas dos chequeos de calidad.

---

## Ejercicio 2 - Faker (datos por codigo, reproducibles)

```powershell
npm run generar
```

Genera `2-faker/usuarios.json` con 1000 usuarios en formato `{ "usuarios": [...] }`,
listo para subirlo como servicio directamente:

```powershell
npx json-server 2-faker/usuarios.json --port 3000
# -> http://localhost:3000/usuarios
```

**Demostracion clave (reproducibilidad):**

1. Corre `npm run generar` dos veces: los primeros usuarios son **identicos**
   (gracias a `faker.seed(123)`).
2. Abre `2-faker/generar-usuarios.js`, comenta la linea `faker.seed(123);`
   y corre de nuevo: los datos **cambian** en cada corrida.

> Faker vive dentro del pipeline y, con semilla, siempre produce el mismo
> dataset. Util para reproducir fallos.

---

## Ejercicio 3 - Anonimizacion GDPR

**Paso A — generar un dump "real" (simulado):**

```powershell
npm run dump-real
```

Crea `3-anomizar/clientes.json` con datos personales (nombre, email, documento,
telefono, fecha de nacimiento). Representa una copia de produccion que **NO**
puede usarse cruda en test.

**Paso B — anonimizar:**

```powershell
npm run anonimizar
```

Crea `3-anomizar/clientes-anonimos.json` aplicando 4 tecnicas:

| Campo             | Tecnica               | Resultado                     |
|-------------------|-----------------------|-------------------------------|
| `nombre`          | Sustitucion sintetica | nombre falso de Faker         |
| `email`           | Enmascarado (mask)    | `ca***@***.com`               |
| `documento`       | Hash SHA-256          | `9f2a1c4b7e08` (irreversible) |
| `telefono`        | Enmascarado (mask)    | `********01`                  |
| `anio_nacimiento` | Generalizacion        | solo el anio                  |

> Abre los dos JSON lado a lado en VS Code (Open to the Side) para ver
> el cambio campo por campo.

---

## Ejercicio 4 - Versionado y ejecucion paralela

**Paso A — preparar el seed** (necesita haber corrido `npm run generar`):

```powershell
npm run seed
```

Crea `seed/usuarios.seed.json` (estado original, versionar en Git) y
`data/usuarios.json` (copia de trabajo, desechable).

**Paso B — demostrar el determinismo (patron seed/restore):**

```powershell
# 1) levanta la API sobre la copia de trabajo
npm run api
```

En **otra** terminal:

```powershell
# 2) contamina el dataset creando un usuario
Invoke-RestMethod -Method POST http://localhost:3000/usuarios `
  -ContentType 'application/json' `
  -Body '{"nombre":"Intruso","email":"x@test.com","estado":"activo"}'

# comprueba: http://localhost:3000/usuarios  (hay uno mas)
```

Deten la API (Ctrl+C) y restaura:

```powershell
npm run restaurar        # opcion A: Node
./seed/restaurar.ps1     # opcion B: PowerShell directo
```

Vuelve a levantar `npm run api`: el intruso desaparecio. **Estado determinista.**

**Paso C — aislamiento por prefijo (para paralelo):**

Con la API corriendo (`npm run api` en otra terminal):

```powershell
npm run paralelo
```

Simula 3 corridas paralelas (`a-`, `b-`, `c-`) que crean usuarios a la vez,
borra **solo** `b-` y verifica que `a-` y `c-` no se tocaron.

---

## Flujo rapido (todo de una vez)

```powershell
npm install
npm run todo        # genera + dump-real + anonimiza + seed
npm run api         # deja esto corriendo en esta terminal...
# ...y en otra terminal:
npm run paralelo
```

## Que te llevas

- Generar datos sinteticos **visualmente** (Mockaroo) y **por codigo** (Faker, reproducible).
- **Anonimizar** datos reales para cumplir **GDPR**: mask, hash, sustitucion, generalizacion.
- **Versionar** con seed/restore para ejecucion **paralela** determinista.
