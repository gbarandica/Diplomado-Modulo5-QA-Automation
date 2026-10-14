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

> **La app bajo prueba NO vive aqui.** Esta en `prerequisito/app-tienda/` (raiz
> del repo `ProyectoTienda`, la app del Dia 3). El pipeline la arranca desde ahi
> (`APP_DIR`). Esta carpeta `e2e/` contiene SOLO la automatizacion.

```
e2e/                        # (esta carpeta) la automatizacion E2E
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
├─ azure-pipelines.yml      # MODELO del pipeline E2E "todo en un job" (copiar a la raiz del repo del Dia 3 como azure-pipelines-e2e.yml)
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

## Puesta en marcha

> **En el dia a dia NO corres nada local: todo corre en Azure** (commit + push ->
> el pipeline arranca la app y ejecuta las pruebas). Los pasos de abajo son SOLO
> para trabajar con el MCP (crear/reparar pruebas con IA antes de subirlas).

### 1) Arrancar la app Tienda (solo para autoria local con MCP) — Terminal 1

```powershell
# la app vive en la raiz del repo, no dentro de e2e/
cd ..\prerequisito\app-tienda
npm install        # instala Express + Faker y genera datos (postinstall)
npm start          # queda en http://localhost:3000
```

Deja esta terminal corriendo. Verifica abriendo <http://localhost:3000/>.

### 2) Preparar el entorno Python — Terminal 2

```powershell
# desde la carpeta e2e/
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # activa el entorno (Windows PowerShell)
pip install -r requirements.txt
python -m playwright install chromium # descarga el navegador (una vez)
```

### 3) Correr las pruebas en local (opcional, para la autoria con MCP)

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

## Pipeline que hace TODO en un solo job (y publica la evidencia)

El `azure-pipelines.yml` de este proyecto es el **modelo** del pipeline E2E. No
es un repo aparte: se copia a la **raiz del repo del Dia 3** (`ProyectoTienda`)
con el nombre `azure-pipelines-e2e.yml`, y esta carpeta se pega ahi como `e2e/`.
En **un solo job** arranca la app, corre el smoke y la carga, y luego la
automatizacion E2E, y **publica la evidencia** (JUnit) en el propio run. El
pipeline del Dia 3 (Build/Smoke/Carga) **no se toca**.

### Por que "todo en un job" (lo importante)

En Azure cada **stage/job corre en un agente efimero distinto**. Si arrancas la
app en un stage, al terminar ese stage el agente se destruye y **la app muere**.
Por eso NO sirve "arrancar la app en Smoke y usarla en otro stage".

La solucion: hacer **todo en el mismo job**. Se arranca la app con `&` (segundo
plano) y, mientras sigue viva en ese agente, corren el smoke, la carga y el
pytest. Al terminar el job, el agente (y la app) se destruyen juntos. No queda
nada colgando.

### Como funciona (un solo repo)

- **Un solo `checkout: self`**: la app, los tests sencillos y el E2E viven en el
  mismo repo. NO hay `resources: repositories` ni dos checkout.
- Las rutas se controlan con variables al inicio del YAML: `APP_DIR`
  (`prerequisito/app-tienda`), `SMOKE_DIR` (`tienda-azure`), `E2E_DIR` (`e2e`).
- Un unico job `todo_en_uno` con los pasos en orden: arrancar app -> smoke ->
  carga -> pytest -> `PublishTestResults@2` (+ artefacto).
- `BASE_URL=http://localhost:3000` porque la app corre en el mismo agente.

### Como montarlo en Azure (sin tocar el Dia 3)

1. En el repo del Dia 3 (`ProyectoTienda`), crea una carpeta **`e2e/`** y pega
   ahi el contenido de este proyecto (features, steps, `requirements.txt`,
   `pytest.ini`, `conftest.py`...).
2. Copia este `azure-pipelines.yml` a la **raiz del repo** con un nombre NUEVO:
   **`azure-pipelines-e2e.yml`** (para no pisar el del Dia 3).
3. En Azure DevOps: **Pipelines -> New pipeline ->** el mismo repo
   `ProyectoTienda` **-> Existing Azure Pipelines YAML file ->**
   `/azure-pipelines-e2e.yml` **-> Run**.

Quedan **dos pipelines sobre el mismo repo**: el del Dia 3
(`azure-pipelines.yml`) y el E2E (`azure-pipelines-e2e.yml`). Son independientes.

Un solo navegador (chromium), sin Sauce ni IA: esa evolucion (matriz
multi-navegador + Sauce Labs + triaje con IA) es el **Dia 5**.

```powershell
# La misma evidencia que publica el pipeline, en local (solo para autoria con MCP):
# Terminal 1 (prerequisito/app-tienda): npm start   # http://localhost:3000
# Terminal 2 (carpeta e2e/):
pytest --junitxml=resultados/junit.xml      # genera tambien allure-results/
```

---

## Evidencias ricas con Allure (capturas, video y trace)

Ademas del XML de JUnit, la automatizacion deja **evidencia visual de por donde
paso cada prueba en la app**. El `conftest.py` adjunta, por cada escenario:

- **Una captura por cada paso Gherkin** (Given/When/Then) -> ves el estado de la
  pagina en cada momento del flujo.
- **El HTML de la pagina** si un paso falla (util para depurar el DOM real).
- **El video completo** de la sesion del navegador (`.webm`).
- **El trace de Playwright** (`.zip`), navegable paso a paso con red, consola y
  snapshots del DOM: `npx playwright show-trace trace-ultimo.zip`.

Todo eso alimenta un **reporte Allure** navegable (cada escenario con sus pasos y
sus capturas incrustadas).

### Ver el reporte Allure en local

```powershell
# 1) Correr las pruebas (genera ./allure-results con los adjuntos)
pytest

# 2a) Servir el reporte (lo abre en el navegador)
allure serve allure-results

# 2b) O generarlo como HTML estatico
allure generate allure-results -o allure-report --clean
```

> Requiere el **Allure CLI** (Java). En local: `scoop install allure` o
> `npm i -g allure-commandline`. En el pipeline se descarga solo.

### En el pipeline de Azure, al terminar el run

- Pestana **Tests**: los 4 escenarios Pass/Fail (JUnit).
- Artefacto **`allure-report-html`**: un **unico `index.html` autocontenido**.
  Lo descargas y lo abres con **doble clic** — se ve directo, sin servidor ni
  CORS (todas las capturas van embebidas en el propio archivo).
- Artefacto **`allure-report`**: el reporte completo (por si prefieres servirlo
  con `allure open allure-report`).
- Artefacto **`evidencia-e2e`**: `junit.xml`, videos `.webm`, trace `.zip`.

> **Por que el reporte normal no abre con doble clic:** el `index.html` de un
> reporte Allure corriente carga sus datos por `fetch`, que el navegador bloquea
> en `file://` (CORS). Por eso generamos tambien la version **single-file**: un
> solo HTML con todo embebido que si abre directo. En el pipeline esto es
> `allure generate allure-results -o allure-single --single-file`.

### Verlo SIN descargar nada (opcional)

Dos caminos para que el reporte quede "publicado" y accesible por un clic:

1. **Extension de Azure DevOps "Allure Test Reports"** (Marketplace, gratis).
   Un admin de la organizacion la instala una vez; luego el pipeline publica el
   reporte como una **pestana "Allure" dentro del run** (bloque opcional del
   `azure-pipelines.yml`, paso 11). Se ve embebido, sin bajar archivos.
2. **Publicarlo en una URL** (GitHub Pages, Azure Static Web Apps o un
   Storage/Blob estatico): subes el contenido de `allure-report/` y queda un
   enlace que cualquiera abre en el navegador.

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
- **Evidencia por paso:** los hooks `pytest_bdd_after_step` y
  `pytest_bdd_step_error` del `conftest.py` adjuntan a Allure una captura tras
  cada paso y, si falla, el HTML de la pagina. El video y el trace de Playwright
  se adjuntan al cerrar cada escenario.
```
