# Sistema de Renovación Automática de Tokens

## 🔄 Descripción

Este documento describe el sistema implementado para manejar la renovación automática de tokens JWT y mantener las sesiones activas sin interrupciones.

## 🏗️ Arquitectura del Sistema

### 1. **Renovación Proactiva**
- **Verificación automática**: Cada 4 minutos se verifica si el token está próximo a expirar
- **Renovación anticipada**: Se renueva el token 5 minutos antes de que expire
- **Manejo de errores**: Si la renovación falla, se limpian los tokens y se redirige al login

### 2. **Renovación Reactiva**
- **Detección de errores 401**: Cuando una petición recibe error 401, se intenta renovar automáticamente
- **Reintento automático**: Después de renovar, se reintenta la petición original
- **Fallback**: Si no se puede renovar, se cierra la sesión

### 3. **Componentes del Sistema**

#### `lib/api.ts`
- **`apiRequest()`**: Función principal que maneja todas las peticiones HTTP
- **`refreshTokenIfNeeded()`**: Verifica y renueva tokens automáticamente
- **`authService.refreshToken()`**: Llama al endpoint de renovación del backend

#### `hooks/use-token-refresh.ts`
- **Hook personalizado**: Maneja la renovación periódica cada 4 minutos
- **Limpieza automática**: Se limpia al desmontar el componente

#### `components/session-status.tsx`
- **Indicador visual**: Muestra el tiempo restante de la sesión
- **Renovación manual**: Botón para renovar manualmente
- **Estados visuales**: Verde (válido), Amarillo (próximo a expirar), Rojo (expirado)

## 🔧 Funcionamiento Detallado

### Flujo de Renovación Proactiva

```typescript
// Cada 4 minutos
useTokenRefresh() → refreshTokenIfNeeded() → authService.refreshToken()
```

1. **Verificación**: Se decodifica el token JWT para obtener la fecha de expiración
2. **Evaluación**: Si expira en menos de 5 minutos, se renueva
3. **Renovación**: Se llama al endpoint `/auth/token/refresh/`
4. **Almacenamiento**: Se guarda el nuevo token en localStorage
5. **Logs**: Se registra el proceso en la consola

### Flujo de Renovación Reactiva

```typescript
// Cuando una petición falla con 401
apiRequest() → Error 401 → refreshToken() → apiRequest() (reintento)
```

1. **Detección**: La petición recibe error 401 (token expirado)
2. **Renovación**: Se intenta renovar el token automáticamente
3. **Reintento**: Se reintenta la petición original con el nuevo token
4. **Fallback**: Si falla la renovación, se cierra la sesión

## 📊 Estados de la Sesión

### Indicadores Visuales

- 🟢 **Verde**: Token válido por más de 5 minutos
- 🟡 **Amarillo**: Token expira en menos de 5 minutos
- 🔴 **Rojo**: Token expira en menos de 1 minuto o ya expiró
- ⚫ **Gris**: No hay token válido

### Tiempos de Renovación

- **Verificación**: Cada 4 minutos
- **Renovación anticipada**: 5 minutos antes de expirar
- **Actualización visual**: Cada 30 segundos

## 🛠️ Configuración

### Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Configuración por Defecto

```typescript
AUTH_CONFIG = {
  TOKEN_KEY: 'access_token',
  REFRESH_TOKEN_KEY: 'refresh_token',
  USER_KEY: 'lotificacion_user',
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos
}
```

## 🔍 Debugging

### Logs del Sistema

```javascript
// Verificación de tokens
[API] Token expira en 1234 segundos
[API] Token próximo a expirar, renovando...
[API] Token renovado exitosamente

// Errores de renovación
[API] Error renovando token: Error details
[API] Token expirado, intentando renovar...

// Estado de autenticación
[AuthContext] Verificando estado de autenticación...
[AuthContext] Token válido, obteniendo perfil...
[AuthContext] Usuario autenticado: {user data}
```

### Componente de Debug

El componente `SessionStatus` muestra:
- Tiempo restante de la sesión
- Estado visual del token
- Botón de renovación manual
- Logs en consola al renovar

## 🚨 Manejo de Errores

### Casos de Error

1. **Token inválido**: Se limpia y redirige al login
2. **Refresh token expirado**: Se cierra la sesión
3. **Error de red**: Se reintenta automáticamente
4. **Backend no disponible**: Se muestra error y se cierra sesión

### Limpieza Automática

```typescript
// Cuando falla la renovación
localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY)
localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY)
localStorage.removeItem(AUTH_CONFIG.USER_KEY)
setUser(null)
```

## 📱 Uso del Usuario

### Renovación Automática
- **Transparente**: El usuario no necesita hacer nada
- **Continuo**: La sesión se mantiene activa automáticamente
- **Seguro**: Se renueva antes de que expire

### Renovación Manual
- **Indicador visual**: El usuario puede ver el tiempo restante
- **Botón de renovación**: Puede renovar manualmente si lo desea
- **Feedback**: Animación de carga durante la renovación

## 🔒 Seguridad

### Medidas Implementadas

1. **Renovación anticipada**: Evita interrupciones por tokens expirados
2. **Limpieza automática**: Elimina tokens inválidos
3. **Reintentos limitados**: Evita bucles infinitos
4. **Logs de auditoría**: Registra todas las renovaciones
5. **Manejo de errores**: Respuesta apropiada a fallos

### Consideraciones de Seguridad

- Los tokens se almacenan en localStorage (considerar httpOnly cookies en producción)
- La renovación es transparente para el usuario
- Se implementan timeouts para evitar ataques de fuerza bruta
- Los logs no incluyen información sensible

## 🎯 Beneficios

### Para el Usuario
- ✅ **Sesión continua**: No se cierra automáticamente
- ✅ **Experiencia fluida**: Sin interrupciones
- ✅ **Transparencia**: Indicador visual del estado
- ✅ **Control manual**: Opción de renovar manualmente

### Para el Sistema
- ✅ **Alta disponibilidad**: Menos errores de autenticación
- ✅ **Mejor rendimiento**: Menos peticiones de login
- ✅ **Seguridad mejorada**: Renovación proactiva
- ✅ **Debugging fácil**: Logs detallados

## 🔄 Próximas Mejoras

1. **Notificaciones**: Alertar al usuario cuando la sesión esté por expirar
2. **Configuración dinámica**: Permitir ajustar tiempos de renovación
3. **Métricas**: Registrar estadísticas de renovación
4. **Offline support**: Manejar renovación cuando vuelva la conexión
5. **Multi-tab sync**: Sincronizar estado entre pestañas
