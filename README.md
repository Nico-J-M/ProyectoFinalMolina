# ProyectoFinalMolina — Simulador Ecommerce

**Stack:** HTML + CSS + JavaScript (vanilla) · Datos remotos simulados con JSON · Librerías externas: SweetAlert2 y Day.js

## Funcionalidades
- Listado de productos con **filtros, búsqueda, ordenamiento y categorías**.
- **Carrito** persistente en `localStorage` con sumas, impuestos (21%) y total.
- **Checkout** con formulario precargado (puede editarse) y validación.
- **Simulación de compra**: genera un ID de orden, descuenta stock local y guarda la orden en `localStorage` (`neostore_last_order`).
- UI no bloqueante con **SweetAlert2** (nada de `alert/prompt/confirm`).

## Criterios de evaluación (cómo se cumplen)
- **Funcionalidad:** Flujo de compra completo (entrada → procesamiento → salida) sin errores de cómputo conocidos.
- **Interactividad:** Inputs y eventos adecuados; render asincrónico del HTML via JS (grid, carrito, drawer).
- **Escalabilidad:** Uso de **clases** (`Product`, `CartItem`, `Cart`), **arrays** dinámicos y recorridos óptimos; funciones con parámetros y separación de responsabilidades.
- **Integridad:** JS separado en `app.js`, datos estáticos JSON en `data/products.json` cargados con `fetch()`.

## Estructura
```
ProyectoFinalMolina/
├── index.html
├── styles.css
├── app.js
├── data/
│   └── products.json
└── README.md
```


## Sugerencias aplicadas
- Sin `console.log`.
- Reemplazo de `alert/prompt/confirm` con **SweetAlert2**.
- **Form** con datos precargados para acelerar la demo.

