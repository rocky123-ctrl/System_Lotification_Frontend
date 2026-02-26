# Verificación: Comunicación Frontend (Lotes / Lotificaciones) con Backend Django

## Base URL

- **Frontend:** `config.api.baseUrl` = `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`
- **Peticiones:** Todas usan `API_BASE_URL + endpoint` = `http://localhost:8000/api` + endpoint
- **Django:** En `system_lotificacion/urls.py` → `path('api/lotes/', include('lotes.urls'))`
- **Resultado:** Las rutas del frontend que empiezan por `/lotes/` se resuelven a `http://localhost:8000/api/lotes/...` ✅

---

## Lotificaciones (apartado "Lotificaciones")

| Frontend (lotificacion-service) | Método | URL final Django | Backend (lotes/views.py) |
|---------------------------------|--------|-------------------|---------------------------|
| getLotificaciones()             | GET    | /api/lotes/lotificaciones/ | LotificacionViewSet.list |
| getLotificacion(id)             | GET    | /api/lotes/lotificaciones/{id}/ | LotificacionViewSet.retrieve |
| createLotificacion(data)        | POST   | /api/lotes/lotificaciones/ | LotificacionViewSet.create |
| updateLotificacion(id, data)    | PUT    | /api/lotes/lotificaciones/{id}/ | LotificacionViewSet.update |
| deleteLotificacion(id)          | DELETE | /api/lotes/lotificaciones/{id}/ | LotificacionViewSet.destroy |
| getManzanas(id, todas?)         | GET    | /api/lotes/lotificaciones/{id}/manzanas/?todas=1 | LotificacionViewSet.manzanas |
| createManzana(lotifId, data)    | POST   | /api/lotes/manzanas/ | ManzanaViewSet.create |
| updateManzana(id, data)         | PATCH  | /api/lotes/manzanas/{id}/ | ManzanaViewSet.partial_update |
| getPlanoSvg(lotifId)            | GET    | /api/lotes/lotificaciones/{id}/plano-svg/ | LotificacionViewSet.plano_svg |
| getLotesPlano(lotifId)          | GET    | /api/lotes/lotificaciones/{id}/lotes/ | LotificacionViewSet.lotes (action) |
| getLotePorIdentificador(lotifId, id) | GET | /api/lotes/lotificaciones/{id}/lotes/{identificador}/ | LotificacionViewSet.lote_por_identificador |
| registrarLoteDesdePlano(lotifId, payload) | POST | /api/lotes/lotificaciones/{id}/registrar-lote/ | LotificacionViewSet.registrar_lote |
| subirPlanoSvg(id, file)         | POST   | /api/lotes/lotificaciones/{id}/subir-plano-svg/ | LotificacionViewSet.subir_plano_svg |
| eliminarPlanoSvg(id)            | DELETE | /api/lotes/lotificaciones/{id}/eliminar-plano-svg/ | LotificacionViewSet.eliminar_plano_svg |

Todas las rutas existen en el backend y coinciden con el uso del frontend.

---

## Lotes (apartado "Lotes")

| Frontend (lotes-service) | Método | URL final Django | Backend (lotes/views.py) |
|---------------------------|--------|-------------------|---------------------------|
| getLotes(filters?)        | GET    | /api/lotes/lotes/?lotificacion=...&estado=... | LoteViewSet.list (filtros por query params) |
| getLote(id)               | GET    | /api/lotes/lotes/{id}/ | LoteViewSet.retrieve |
| createLote(data)          | POST   | /api/lotes/lotes/ | LoteViewSet.create |
| updateLote(id, data)      | PUT    | /api/lotes/lotes/{id}/ | LoteViewSet.update |
| deleteLote(id)            | DELETE | /api/lotes/lotes/{id}/ | LoteViewSet.destroy |
| getLotesDisponibles()     | GET    | /api/lotes/lotes/disponibles/ | LoteViewSet.disponibles |
| getEstadisticas()         | GET    | /api/lotes/lotes/estadisticas/ | LoteViewSet.estadisticas |

Todas las rutas existen en el backend y coinciden con el uso del frontend.

---

## Autenticación

Las peticiones usan `apiRequest()`, que añade el header `Authorization: Bearer <token>` usando `refreshTokenIfNeeded()`. El backend debe tener configurado JWT (p. ej. `rest_framework_simplejwt`) y CORS para el origen del frontend (p. ej. `http://localhost:3000`).

---

## Resumen

- Las rutas de **Lotificaciones** y **Lotes** del frontend coinciden con las definidas en Django (`lotes/urls.py` + ViewSets).
- La base URL es `http://localhost:8000/api` (o la que definas con `NEXT_PUBLIC_API_URL`).
- No se detectaron discrepancias en métodos HTTP ni en paths; la comunicación con Django está correctamente alineada.
