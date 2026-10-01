# App Tienda — Aplicación base del laboratorio

Aplicación de ejemplo (front + API) que sirve de **laboratorio común** para las
sesiones 3 a 7 de la Certificación 5 — QA Cloud-Native.

Es una tienda sencilla, **sin login**: un catálogo de productos, el detalle de
cada producto y un carrito que confirma pedidos contra la API. Toda la
automatización de pruebas de las siguientes sesiones se hace sobre esta app.

> **Pre-requisito del curso.** Aquí solo se entrega y se despliega la app. El
> despliegue detallado (local y en AWS) se explica paso a paso en la **Sesión 3**.

---

## 1. Qué incluye

```
app-tienda/
├── servidor/
│   └── server.js            # Express: sirve el front estático + la API REST
├── public/                  # FRONT (HTML/CSS/JS estático, sin build)
│   ├── index.html           #   Catálogo de productos (con filtros)
│   ├── producto.html        #   Detalle de un producto
│   ├── carrito.html         #   Carrito + confirmar pedido
│   ├── app.js               #   Utilidades (carrito en localStorage)
│   └── estilos.css          #   Estilos compartidos
├── datos/
│   ├── generar-datos.js     # Genera db.json con Faker (semilla fija)
│   └── db.json              # Datos generados (NO se versiona)
├── Dockerfile               # Imagen para desplegar en contenedor
├── .dockerignore
├── .gitignore
└── package.json
```

Un solo proceso sirve **todo**: el front en `/` y la API en `/api`. Un puerto,
un contenedor, un despliegue.

---

## 2. Requisitos

- **Node.js 20+** (verifica con `node --version`).
- Opcional: **Docker** si quieres correrla en contenedor.

---

## 3. Despliegue local (Node)

```powershell
# 1) Instalar dependencias (genera los datos automáticamente)
npm install

# 2) Arrancar la app
npm start
```

Al arrancar verás:

```
  App Tienda corriendo
  Front : http://localhost:3000/
  API   : http://localhost:3000/api/productos
  Salud : http://localhost:3000/api/health
```

Abre <http://localhost:3000/> en el navegador.

> Si ves el error `No existe datos/db.json`, corre `npm run generar` y vuelve a
> arrancar. `npm install` ya lo hace por ti (paso `postinstall`).

### Cambiar el puerto

```powershell
$env:PORT=8080; npm start        # PowerShell
```

---

## 4. Despliegue con Docker

```powershell
# Construir la imagen
docker build -t app-tienda .

# Correr el contenedor (mapea el puerto 3000)
docker run -p 3000:3000 app-tienda
```

La imagen genera los datos con Faker durante el build y expone `/api/health`
como healthcheck. Abre <http://localhost:3000/>.

---

## 5. La API

Base: `http://localhost:3000/api`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/productos` | Lista de productos |
| GET | `/productos?categoria=hogar` | Filtra por categoría |
| GET | `/productos?q=silla` | Busca por nombre |
| GET | `/productos/:id` | Un producto (404 si no existe) |
| GET | `/pedidos` | Lista de pedidos |
| POST | `/pedidos` | Crea un pedido |

**Crear un pedido** (POST `/pedidos`):

```json
{ "productoId": 1, "cliente": "cliente@tienda.demo", "cantidad": 2 }
```

Reglas de negocio (las mismas que se validan con tests):
- Campos obligatorios: `productoId`, `cliente`, `cantidad`.
- El producto debe existir (si no → `404`).
- `cantidad` debe ser al menos 1 (si no → `400`).
- El producto debe estar activo y con stock suficiente (si no → `409`).
- Un pedido nuevo nace con estado `pendiente`.

**Probar la API rápido:**

```powershell
# Listar productos
curl http://localhost:3000/api/productos

# Un producto
curl http://localhost:3000/api/productos/1

# Crear un pedido
curl -X POST http://localhost:3000/api/pedidos `
  -H "Content-Type: application/json" `
  -d '{ "productoId": 1, "cliente": "test@demo.com", "cantidad": 1 }'
```

---

## 6. El front

Tres páginas, sin framework ni build (HTML + JS plano):

| Página | Archivo | Qué hace |
|---|---|---|
| Catálogo | `index.html` | Lista productos; filtra por nombre y categoría |
| Detalle | `producto.html?id=N` | Muestra un producto; agrega al carrito |
| Carrito | `carrito.html` | Muestra el carrito; confirma el pedido (POST a la API) |

El carrito vive en `localStorage` del navegador (no hay backend de carrito).

### `data-testid` para automatización

Todos los elementos clave del front tienen atributos `data-testid`. Son los
**selectores estables** que usarán las pruebas E2E (Playwright) en las próximas
sesiones. Ejemplos:

- Catálogo: `lista-productos`, `producto-card`, `producto-nombre`,
  `producto-precio`, `ver-detalle`, `input-buscar`, `select-categoria`.
- Detalle: `detalle-nombre`, `detalle-precio`, `detalle-stock`,
  `input-cantidad`, `btn-agregar`, `mensaje-agregado`.
- Carrito: `fila-carrito`, `btn-quitar`, `btn-vaciar`, `btn-confirmar`,
  `carrito-total`, `pedido-confirmado`.

> En la **Sesión 6** cambiaremos alguno de estos `data-testid` a propósito para
> romper las pruebas y repararlas con IA (MCP). Por eso importan.

---

## 7. Datos con Faker

`datos/generar-datos.js` genera **12 productos** y **6 pedidos** con una
**semilla fija** (`faker.seed(2025)`): los datos son los mismos en cada corrida,
lo que hace que las pruebas sean deterministas.

```powershell
npm run generar     # regenera datos/db.json
```

El último producto queda **inactivo y sin stock** a propósito: es un caso de
borde para las pruebas (no se puede pedir, el botón queda deshabilitado).

---

## 8. Qué sigue

- **Sesión 3 — Azure DevOps:** cómo desplegar y disponibilizar esta app en local
  y en AWS, y cómo montar su pipeline en Azure (Test Plans, Pipelines).
- **Sesión 4 — Testing IA-Driven:** automatizar el catálogo, el detalle y el
  carrito con Playwright + Screenplay (screenpy) + BDD en Python, con datos de
  Faker, e integrar MCP.
- **Sesiones 5–7:** ejecución en Sauce Labs, contenedores + Pact, y cierre.

---

Certificación 5 — QA Cloud-Native · Lite Thinking University of Technology
