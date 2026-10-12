"""Configuracion compartida de pytest para las pruebas E2E.

Fixtures:
  - base_url     : URL de la app (local por defecto, configurable con BASE_URL)
  - actor        : un Actor Screenplay con la habilidad de navegar
Tambien reinicia los pedidos antes de cada prueba (endpoint /api/test/reset).
"""
import os
import sys
from pathlib import Path

import pytest
import requests

# Permite importar el paquete screenplay/ sin instalarlo
sys.path.insert(0, str(Path(__file__).parent))

from screenplay.actor import Actor
from screenplay.abilities import NavegarConElNavegador


def pytest_addoption(parser):
    parser.addoption(
        "--base-url-tienda",
        action="store",
        default=None,
        help="URL base de la app Tienda (ej. http://localhost:3000)",
    )


@pytest.fixture(scope="session")
def base_url(request):
    # Prioridad: flag de linea de comandos > variable de entorno > local
    return (
        request.config.getoption("--base-url-tienda")
        or os.environ.get("BASE_URL")
        or "http://localhost:3000"
    )


@pytest.fixture(autouse=True)
def _reset_pedidos(base_url):
    """Deja los pedidos en limpio antes de cada escenario (si la app lo soporta)."""
    try:
        requests.post(f"{base_url}/api/test/reset", timeout=3)
    except requests.RequestException:
        pass  # si no esta disponible, seguimos; no es critico
    yield


@pytest.fixture
def actor(page, base_url) -> Actor:
    """Un actor llamado Ana que puede navegar con el navegador de Playwright."""
    return Actor.llamado("Ana").que_puede(
        NavegarConElNavegador.usando(page, base_url)
    )
