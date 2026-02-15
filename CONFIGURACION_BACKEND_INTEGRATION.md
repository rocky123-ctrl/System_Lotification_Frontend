# 🔧 Integración de Configuración con Backend

## 📋 **Descripción General**

Este documento describe la integración completa del módulo de configuración con el backend Django existente. El sistema permite gestionar tanto la configuración general de la lotificación como los parámetros financieros para el cálculo de cuotas.

## 🏗️ **Arquitectura**

### **Componentes Principales:**

1. **`lib/configuracion-service.ts`** - Servicios de API
2. **`components/configuracion.tsx`** - Componente principal de configuración
3. **`hooks/use-configuracion.ts`** - Hook para estado global
4. **`components/configuracion-resumen.tsx`** - Resumen para dashboard

### **Flujo de Datos:**

```
Backend API ←→ configuracion-service.ts ←→ use-configuracion.ts ←→ Componentes UI
```

## 🔌 **Endpoints Integrados**

### **Configuración General**
- `GET /api/configuracion/general/activa/` - Obtener configuración activa
- `GET /api/configuracion/general/resumen/` - Obtener resumen con estadísticas
- `GET /api/configuracion/general/estadisticas/` - Obtener estadísticas del sistema
- `POST /api/configuracion/general/` - Crear nueva configuración
- `PUT /api/configuracion/general/{id}/` - Actualizar configuración
- `POST /api/configuracion/general/{id}/activar/` - Activar configuración

### **Configuración Financiera**
- `GET /api/configuracion/financiera/activa/` - Obtener configuración financiera activa
- `POST /api/configuracion/financiera/` - Crear configuración financiera
- `PUT /api/configuracion/financiera/{id}/` - Actualizar configuración financiera
- `POST /api/configuracion/financiera/crear_para_activa/` - Crear para configuración activa

## 📊 **Interfaces TypeScript**

### **Configuración General**
```typescript
interface ConfiguracionGeneral {
  id: number
  nombre_lotificacion: string
  ubicacion: string
  descripcion: string
  direccion_completa: string
  telefono: string
  email: string
  sitio_web: string
  fecha_inicio: string
  total_lotes: number
  area_total: string
  tasa_anual: string
  activo: boolean
  logo?: string
  created_at: string
  updated_at: string
}
```

### **Configuración Financiera**
```typescript
interface ConfiguracionFinanciera {
  id: number
  plazo_minimo_meses: number
  plazo_maximo_meses: number
  enganche_minimo_porcentaje: string
  enganche_maximo_porcentaje: string
  costo_instalacion_default: string
  permitir_pagos_anticipados: boolean
  aplicar_penalizacion_atrasos: boolean
  penalizacion_atraso_porcentaje: string
  configuracion_general: number
  created_at: string
  updated_at: string
}
```

## 🎯 **Funcionalidades Implementadas**

### **1. Gestión de Configuración General**
- ✅ **Crear configuración** nueva
- ✅ **Editar configuración** existente
- ✅ **Activar/desactivar** configuraciones
- ✅ **Subir logo** de la lotificación
- ✅ **Validación de formularios** completa

### **2. Gestión de Configuración Financiera**
- ✅ **Configurar plazos** mínimo y máximo
- ✅ **Definir rangos** de enganche
- ✅ **Establecer costo** de instalación por defecto
- ✅ **Configurar penalizaciones** por atrasos
- ✅ **Habilitar/deshabilitar** pagos anticipados

### **3. Visualización de Datos**
- ✅ **Resumen de configuración** en dashboard
- ✅ **Estadísticas en tiempo real** de lotes
- ✅ **Información financiera** formateada
- ✅ **Estado de configuración** activa/inactiva

### **4. Estado Global**
- ✅ **Context de configuración** para toda la app
- ✅ **Carga automática** al iniciar
- ✅ **Actualización en tiempo real** de cambios
- ✅ **Manejo de errores** robusto

## 🎨 **Componentes UI**

### **Configuracion.tsx**
- **Tabs organizados** para general y financiera
- **Formularios completos** con validación
- **Modales responsivos** para edición
- **Estados de carga** y error
- **Formateo automático** de datos

### **ConfiguracionResumen.tsx**
- **Resumen visual** de configuración activa
- **Métricas clave** en cards
- **Acciones rápidas** con enlaces
- **Estado de configuración** financiera
- **Navegación directa** a módulos

## 🔧 **Servicios de API**

### **configuracionGeneralService**
```typescript
// Métodos principales
getConfiguracionActiva(): Promise<ConfiguracionGeneral>
getConfiguracionResumen(): Promise<ConfiguracionResumen>
createConfiguracion(data): Promise<ConfiguracionGeneral>
updateConfiguracion(id, data): Promise<ConfiguracionGeneral>
activarConfiguracion(id): Promise<void>
subirLogo(id, file): Promise<ConfiguracionGeneral>
```

### **configuracionFinancieraService**
```typescript
// Métodos principales
getConfiguracionActiva(): Promise<ConfiguracionFinanciera>
createConfiguracion(data): Promise<ConfiguracionFinanciera>
updateConfiguracion(id, data): Promise<ConfiguracionFinanciera>
crearParaActiva(data): Promise<ConfiguracionFinanciera>
```

## 🎯 **Hook useConfiguracion**

### **Estado Global**
```typescript
const {
  configuracionActiva,      // Configuración general activa
  configuracionResumen,     // Resumen con estadísticas
  configuracionFinanciera,  // Configuración financiera activa
  isLoading,               // Estado de carga
  error,                   // Errores
  refreshConfiguracion,    // Refrescar configuración
  refreshFinanciera        // Refrescar financiera
} = useConfiguracion()
```

### **Uso en Componentes**
```typescript
import { useConfiguracion } from '@/hooks/use-configuracion'

function MiComponente() {
  const { configuracionActiva, isLoading } = useConfiguracion()
  
  if (isLoading) return <div>Cargando...</div>
  
  return (
    <div>
      <h1>{configuracionActiva?.nombre_lotificacion}</h1>
    </div>
  )
}
```

## 🔄 **Flujo de Trabajo**

### **1. Carga Inicial**
1. **ConfiguracionProvider** se inicializa en `app/layout.tsx`
2. **useConfiguracion** carga configuración activa y resumen
3. **Componentes** reciben datos vía context

### **2. Edición de Configuración**
1. **Usuario** hace clic en "Editar"
2. **Formulario** se carga con datos actuales
3. **Validación** en tiempo real
4. **Envío** al backend via service
5. **Actualización** automática del estado global

### **3. Creación de Configuración**
1. **Usuario** hace clic en "Crear"
2. **Formulario vacío** con valores por defecto
3. **Validación** completa antes de envío
4. **Creación** en backend
5. **Activación** automática si es la primera

## 🎨 **Formateo de Datos**

### **Funciones Helper**
```typescript
formatearPorcentaje("12.50") // "12.50%"
formatearMoneda("150000.00") // "Q 150,000.00"
formatearArea("15000.00")    // "15,000 m²"
```

### **Uso en Componentes**
```typescript
import { formatearPorcentaje, formatearMoneda } from '@/lib/configuracion-service'

// En el componente
<div>{formatearPorcentaje(configuracion.tasa_anual)}</div>
<div>{formatearMoneda(configuracionFinanciera.costo_instalacion_default)}</div>
```

## 🚀 **Beneficios de la Integración**

### **1. Centralización**
- ✅ **Un solo lugar** para toda la configuración
- ✅ **Estado global** accesible desde cualquier componente
- ✅ **Actualización automática** en toda la app

### **2. Consistencia**
- ✅ **Mismos datos** en todos los módulos
- ✅ **Formateo uniforme** de valores
- ✅ **Validación centralizada**

### **3. Experiencia de Usuario**
- ✅ **Carga rápida** con estados de loading
- ✅ **Feedback visual** de errores
- ✅ **Navegación fluida** entre módulos

### **4. Mantenibilidad**
- ✅ **Código reutilizable** con hooks
- ✅ **Tipado fuerte** con TypeScript
- ✅ **Separación clara** de responsabilidades

## 🔧 **Configuración del Sistema**

### **Variables de Entorno**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### **Dependencias**
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 📝 **Próximos Pasos**

1. **Integrar configuración** en otros módulos (lotes, reportes)
2. **Agregar validaciones** más específicas
3. **Implementar caché** para mejor rendimiento
4. **Agregar notificaciones** de cambios
5. **Crear backups** automáticos de configuración

---

**¡La integración de configuración está lista para usar! 🎉**
