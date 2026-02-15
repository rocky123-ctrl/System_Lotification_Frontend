# Sistema de Paginación para Tablas

## Descripción

Se ha implementado un sistema completo de paginación para todas las tablas del sistema de lotificaciones. Esto mejora significativamente el rendimiento y la experiencia del usuario al manejar grandes cantidades de datos.

## Componentes Implementados

### 1. Hook de Paginación (`hooks/use-pagination.ts`)

Un hook personalizado que maneja toda la lógica de paginación:

```typescript
const {
  currentData,        // Datos de la página actual
  currentPage,        // Página actual
  totalPages,         // Total de páginas
  itemsPerPage,       // Elementos por página
  totalItems,         // Total de elementos
  startIndex,         // Índice de inicio
  endIndex,           // Índice de fin
  goToPage,           // Función para ir a una página específica
  setItemsPerPage,    // Función para cambiar elementos por página
} = usePagination({
  data: filteredData,
  itemsPerPage: 10,
})
```

### 2. Componente de Paginación (`components/ui/table-pagination.tsx`)

Un componente reutilizable que incluye:

- **Información de elementos mostrados**: "Mostrando 1 a 10 de 50 elementos"
- **Selector de elementos por página**: 5, 10, 20, 50, 100
- **Navegación de páginas**: Botones de anterior/siguiente y números de página
- **Páginas con elipsis**: Para manejar muchas páginas de forma elegante

## Características

### ✅ Funcionalidades Implementadas

1. **Paginación automática**: Los datos se dividen automáticamente en páginas
2. **Selector de elementos por página**: El usuario puede elegir cuántos elementos ver
3. **Navegación intuitiva**: Botones para ir a la página anterior/siguiente
4. **Números de página**: Navegación directa a páginas específicas
5. **Información contextual**: Muestra qué elementos se están viendo
6. **Responsive**: Se adapta a diferentes tamaños de pantalla
7. **Integración con filtros**: La paginación funciona correctamente con los filtros existentes

### 🎨 Diseño y UX

- **Interfaz limpia**: Diseño minimalista que no interfiere con el contenido
- **Estados visuales**: Botones deshabilitados cuando no hay más páginas
- **Accesibilidad**: Etiquetas ARIA y navegación por teclado
- **Consistencia**: Mismo diseño en todas las tablas del sistema

## Uso en los Componentes

### Ejemplo de Implementación

```typescript
// 1. Importar el hook y componente
import { usePagination } from "@/hooks/use-pagination"
import { TablePagination } from "@/components/ui/table-pagination"

// 2. Filtrar los datos
const filteredLotes = lotes.filter(/* lógica de filtrado */)

// 3. Aplicar paginación
const {
  currentData: paginatedLotes,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  goToPage,
  setItemsPerPage,
} = usePagination({
  data: filteredLotes,
  itemsPerPage: 10,
})

// 4. Usar los datos paginados en la tabla
{paginatedLotes.map((lote) => (
  <TableRow key={lote.id}>
    {/* contenido de la fila */}
  </TableRow>
))}

// 5. Agregar el componente de paginación
<TablePagination
  currentPage={currentPage}
  totalPages={totalPages}
  itemsPerPage={itemsPerPage}
  totalItems={totalItems}
  startIndex={startIndex}
  endIndex={endIndex}
  onPageChange={goToPage}
  onItemsPerPageChange={setItemsPerPage}
/>
```

## Componentes Actualizados

Los siguientes componentes ya incluyen paginación:

1. **Lotes Disponibles** (`components/lotes-disponibles.tsx`)
2. **Lotes Financiados** (`components/lotes-financiados.tsx`)
3. **Lotes Reservados** (`components/lotes-reservados.tsx`)
4. **Lotes Pagados** (`components/lotes-pagados.tsx`)

## Beneficios

### 🚀 Rendimiento
- **Carga más rápida**: Solo se renderizan los elementos visibles
- **Menos uso de memoria**: No se cargan todos los datos en el DOM
- **Mejor respuesta**: La interfaz responde más rápido con grandes datasets

### 👥 Experiencia del Usuario
- **Navegación clara**: El usuario sabe exactamente dónde está
- **Control total**: Puede elegir cuántos elementos ver por página
- **Búsqueda eficiente**: Los filtros funcionan con la paginación
- **Sin saturación**: Las tablas no se saturan con muchos datos

### 🔧 Mantenibilidad
- **Código reutilizable**: El hook se puede usar en cualquier tabla
- **Fácil de implementar**: Solo requiere 4 líneas de código
- **Consistente**: Mismo comportamiento en toda la aplicación

## Configuración

### Opciones de Elementos por Página
Por defecto: `[5, 10, 20, 50, 100]`

Se puede personalizar pasando la prop `itemsPerPageOptions`:

```typescript
<TablePagination
  // ... otras props
  itemsPerPageOptions={[10, 25, 50, 100, 200]}
/>
```

### Elementos por Página por Defecto
Por defecto: `10`

Se puede cambiar en el hook:

```typescript
const pagination = usePagination({
  data: filteredData,
  itemsPerPage: 20, // Cambiar aquí
})
```

## Consideraciones Técnicas

### Estado de la Paginación
- La paginación se reinicia automáticamente cuando cambian los filtros
- El estado se mantiene cuando se navega entre páginas
- Los cambios en elementos por página resetean a la primera página

### Integración con Filtros
- Los filtros se aplican antes de la paginación
- La paginación funciona con los datos filtrados
- Los contadores muestran los datos filtrados, no el total

### Responsive Design
- En pantallas pequeñas, los controles se apilan verticalmente
- Los números de página se adaptan al espacio disponible
- El texto "Previous/Next" se oculta en móviles para ahorrar espacio

## Próximas Mejoras

1. **Persistencia**: Guardar preferencias de elementos por página
2. **URL State**: Sincronizar paginación con la URL
3. **Virtualización**: Para datasets muy grandes (>1000 elementos)
4. **Exportación paginada**: Exportar solo la página actual
5. **Búsqueda en página**: Buscar dentro de la página actual
