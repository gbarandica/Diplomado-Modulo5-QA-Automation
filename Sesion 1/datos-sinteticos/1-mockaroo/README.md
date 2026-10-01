# Ejercicio 1 - Mockaroo (datos sinteticos visuales)

Esta carpeta contiene un dataset de ejemplo **ya generado** para que puedas ver el
resultado sin depender del navegador. En clase, tu lo generas tu mismo en
[mockaroo.com](https://mockaroo.com); aqui lo dejamos listo para inspeccionarlo.

## Archivos

| Archivo         | Que es                                              |
|-----------------|-----------------------------------------------------|
| `usuarios.csv`  | 20 usuarios de ejemplo en formato CSV               |
| `usuarios.json` | Los mismos 20 usuarios en formato JSON              |

## Como se genero en Mockaroo (para replicarlo)

Columnas configuradas en mockaroo.com:

| Field            | Type            | Opciones                                  |
|------------------|-----------------|-------------------------------------------|
| `id`             | Row Number      |                                           |
| `nombre`         | Full Name       |                                           |
| `email`          | Email Address   |                                           |
| `pais`           | Country         |                                           |
| `fecha_registro` | Datetime        | formato ISO                               |
| `estado`         | Custom List     | activo, inactivo, pendiente (**blank 10%**) |

> El **blank 10%** es intencional: mete usuarios SIN estado para forzar
> **casos de borde**. Un buen dataset incluye datos imperfectos.

## Ver el dataset funcionando

Desde la carpeta raiz del proyecto (`datos-sinteticos`):

```powershell
npm run inspeccionar
```

Esto imprime un resumen: total de usuarios, cuantos hay por estado,
cuantos sin estado (casos de borde) y la lista de paises distintos.
