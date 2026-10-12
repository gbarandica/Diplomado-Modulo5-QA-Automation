# Dia 4 — Testing IA-Driven: Playwright + Screenplay + BDD (Python) + MCP

Framework E2E que automatiza los **3 casos definidos en Azure Test Plans (Dia 3)**
sobre la **app Tienda**, usando:

- **Playwright** como motor de navegador
- **pytest-bdd** para escribir los casos en **Gherkin**
- **patron Screenplay** (actores, tasks, questions) para que las pruebas se lean como negocio
- **Faker** para datos (coherente con el Dia 1)
- **MCP** (servidor de Playwright) para sumar un agente de IA que ayuda a crear/mantener pruebas

> Puente con el Dia 3: en **Azure Test Plans los casos NO estan en Gherkin**
> (son pasos manuales con resultado esperado). Aqui, al **automatizar**, esos
> mismos casos SI se escriben en **Gherkin** y se conectan al patron Screenplay.
> El caso de negocio no cambia; cambia quien lo ejecuta.

---

## Estructura

```
tienda-e2e/
├─ app-tienda/              # La app bajo prueba (front + API), con Faker
│  ├─ servidor/server.js    # Express: sirve el front y la API
│  ├─ public/index.html     # Front con data-testid (catalogo, carrito, checkout)
│  └─ datos/generar-datos.js# genera db.json con Faker (semilla fija)
├─ screenplay/              # El patron Screenplay (reutilizable)
│  ├─ actor.py              # Actor: intenta(tasks) y pregunta(questions)
│  ├─ abilities.py          # NavegarConElNavegador (Playwright Page)
│  ├─ interactions.py       # acciones atomicas: Abrir, HacerClic, Escribir, Seleccionar
│  ├─ tasks.py              # acciones de negocio: AgregarAlCarrito, ConfirmarPedido...
│  └─ questions.py          # observaciones: ContadorCarrito, NumeroDePedido...
├─ features/                # Los casos en Gherkin (keywords en ingles, texto en espanol)
│  ├─ catalogo.feature      # Filtrar por categoria
│  ├─ carrito.feature       # Agregar al carrito
│  └─ pedidos.feature       # Confirmar pedido
├─ tests/                   # Enlaza cada feature con sus steps (pytest-bdd)
│  ├─ steps_comunes.py      # Given/When/Then -> llaman tasks/questions del actor
│  └─ test_*.py             # scenarios("...feature")
├─ conftest.py              # fixtures: actor, base_url, reset de pedidos
├─ pytest.ini               # config de pytest + pytest-bdd
├─ requirements.txt         # dependencias Python
├─ mcp-claude-ejemplo.json  # config del servidor MCP para Claude Desktop (clave mcpServers)
└─ .vscode/mcp.json         # alternativa si usas VS Code como cliente MCP (clave servers)
```

---

## Pre-requisitos

| Herramienta | Version | Para que |
|---|---|---|
| **Node.js** | 18+ (20 recomendado) | correr la app Tienda |
| **Python**  | 3.10+ (probado en 3.11) | correr las pruebas |
| **Navegador Playwright** | Chromium (se instala) | ejecutar los tests |
| **Claude Desktop + cuenta Anthropic** | plan Free | usar el servidor MCP con IA |

---

## Puesta en marcha (paso a paso)

### 1) Arrancar la app Tienda — Terminal 1

```powershell
cd app-tienda
npm install        # instala Express + Faker y genera datos (postinstall)
npm start          # queda en http://localhost:3000
```

Deja esta terminal corriendo. Verifica abriendo <http://localhost:3000/>.

### 2) Preparar el entorno Python — Terminal 2

```powershell
# desde la raiz del proyecto (tienda-e2e)
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # activa el entorno (Windows PowerShell)
pip install -r requirements.txt
python -m playwright install chromium # descarga el navegador (una vez)
```

### 3) Correr las pruebas

```powershell
pytest                      # los 4 escenarios
pytest -m smoke             # solo los criticos (@smoke)
pytest tests/test_carrito.py
pytest --headed             # ver el navegador en accion
```

Salida esperada:

```
tests/test_carrito.py::test_agregar_un_producto_al_carrito PASSED
tests/test_carrito.py::test_agregar_dos_productos_distintos_al_carrito PASSED
tests/test_catalogo.py::test_filtrar_productos_por_categoria_hogar PASSED
tests/test_pedidos.py::test_confirmar_un_pedido_con_un_producto PASSED
4 passed
```

### Apuntar a otra URL (app desplegada)

```powershell
$env:BASE_URL="https://xxxx.awsapprunner.com"; pytest
# o
pytest --base-url-tienda https://xxxx.awsapprunner.com
```

---

## Integrar MCP con Claude — paso a paso

El **servidor MCP de Playwright** le da a un asistente de IA la capacidad de abrir
un navegador real, inspeccionar la pagina y generar/mantener pruebas. En esta
sesion el "cerebro" es **Claude (Claude Desktop)**.

### Pre-requisitos MCP
- **Cuenta de Anthropic (Claude):** gratuita; el plan Free alcanza para la demo.
- **Claude Desktop:** la app de escritorio (el MCP local se configura ahi, no en la web).
- **Node.js** instalado: `npx` baja el servidor la primera vez (no instalas nada mas).

### Paso A — Crear la cuenta e instalar Claude Desktop
1. Entra a `claude.ai` -> **Sign up** (correo, o Google/Apple). Verifica email y telefono.
2. Descarga **Claude Desktop** desde `claude.com/download` (en Windows, el instalador).
3. Instala, abre Claude Desktop e inicia sesion con tu cuenta Anthropic.

### Paso B — Anadir el servidor MCP de Playwright a Claude
1. En Claude Desktop: **Settings -> Developer -> Edit Config**. Eso abre
   `claude_desktop_config.json`.
2. Pega el bloque de abajo (archivo de ejemplo: `mcp-claude-ejemplo.json`).
   **La clave es `mcpServers`** (no `servers`). Si el archivo ya tiene contenido,
   agrega solo la entrada `playwright`.
   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["@playwright/mcp@latest"]
       }
     }
   }
   ```
3. Guarda y **cierra Claude por completo** (que no quede en la bandeja). Vuelve a abrirlo.
4. **Verifica:** en una conversacion nueva, el menu de herramientas debe listar las
   acciones de `playwright`.

Ubicacion del archivo (por si lo editas a mano):
```
Windows : %APPDATA%\Claude\claude_desktop_config.json
macOS   : ~/Library/Application Support/Claude/claude_desktop_config.json
```

### Paso C — Usar Claude + Playwright sobre la app
Con la app corriendo en `localhost:3000`, pidele a Claude (la primera vez aprueba
el permiso de la herramienta):
- *"Abre http://localhost:3000, filtra por categoria Hogar y dime cuantos productos quedan."*
- *"Genera un escenario Gherkin (keywords en ingles, texto en espanol) para agregar dos productos y confirmarlos."*
- *"Este selector fallo; proponme uno estable basado en data-testid."*

Luego **lleva el resultado al framework**: el escenario propuesto va a `features/` y
los pasos nuevos a `tests/steps_comunes.py`, reutilizando las tasks/questions del
patron Screenplay.

> La IA (Claude) es el "cerebro"; el servidor MCP solo expone las herramientas del
> navegador. Las pruebas siguen corriendo con `pytest` como siempre: MCP ayuda a
> **escribirlas y repararlas**, no las reemplaza.

### Problemas comunes
- **Claude no lista las herramientas:** confirma `node -v`, que la clave sea
  `mcpServers`, y que cerraste/abriste Claude por completo (no solo la ventana).
- **"command not found: npx":** instala Node.js (incluye `npx`) y reinicia Claude.

---

## Mapa Test Plans (Dia 3) -> Gherkin (Dia 4)

| Suite / Caso en Test Plans (manual) | Feature (Gherkin) | Escenario |
|---|---|---|
| Catalogo / Filtrar por categoria | `catalogo.feature` | Filtrar productos por categoria Hogar |
| Carrito / Agregar un producto | `carrito.feature` | Agregar un producto al carrito |
| Pedidos / Confirmar un pedido | `pedidos.feature` | Confirmar un pedido con un producto |

---

## Notas tecnicas

- **Gherkin en ingles, pasos en espanol:** pytest-bdd 7.x reconoce las palabras
  clave en ingles (`Feature/Scenario/Given/When/Then/And`). El TEXTO de cada paso
  va en espanol, asi el caso se lee como negocio para un hispanohablante.
- **data-testid:** el front expone atributos `data-testid` estables; las pruebas
  nunca dependen de textos ni posiciones fragiles.
- **Aislamiento:** antes de cada escenario se llama a `POST /api/test/reset` para
  dejar los pedidos en limpio.
- **Datos reproducibles:** Faker usa semilla fija (`faker.seed(12345)`), asi el
  catalogo es identico en toda maquina.
```
