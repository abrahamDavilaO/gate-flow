# Patio

Control de patio para un CEDIS: el transportista saca cita y QR antes de llegar, la caseta valida en segundos y el tablero sigue estancia, andenes y cuellos de botella.

## Qué incluye

- **Portal de citas.** Placa, chofer, documentos y ventana. Al guardar se emite un código QR (`PT-XXXX`).
- **Caseta.** Lectura de QR o placa (incluye simulación de cámara LPR). Si el expediente está completo, abre pluma y asigna andén o cajón.
- **Tablero de patio.** Mapa de andenes, tiempos de entrada / inicio / salida y alertas cuando una unidad se pasa del SLA.

Los datos de muestra recrean el CEDIS Norte en Tepotzotlán. En local viven en PGlite (memoria del proceso). En la app publicada usan Postgres.

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre [http://localhost:3847](http://localhost:3847).

Flujo rápido de prueba:

1. En el portal abre el pase `PT-NORTE1`.
2. En caseta pega ese token o la placa `ABC-45-01` y abre pluma.
3. En el tablero inicia la operación y da salida.

## Notas

- Publica la app como **privada** o **de equipo**: es un patio operativo, no una página pública.
- En local el visor está simulado (`dev@example.com`). En Cursor se usa la sesión real.
- SLA de muestra: 15 min de espera a andén, 20 min para arrancar, 60/90 min de carga/descarga, 120 min de estancia total.
