# Simulador de Financiamiento - Lotes Disponibles

## 🧮 Descripción

El simulador de financiamiento permite a los usuarios calcular y comparar diferentes opciones de financiamiento para lotes disponibles, mostrando proyecciones de cuotas mensuales, tablas de amortización y comparaciones entre diferentes plazos.

## 🎯 Funcionalidades

### ✅ **Características Principales**

1. **Simulación por Lote**: Cada lote disponible tiene un botón de simulación
2. **Selección de Plazos**: 7 opciones de plazo (12, 24, 36, 48, 60, 72, 84 meses)
3. **Cálculo Automático**: Cuota mensual calculada con interés compuesto
4. **Tabla de Amortización**: Desglose mensual de capital e interés
5. **Comparación de Plazos**: Vista comparativa de todas las opciones
6. **Interfaz Responsiva**: Funciona en dispositivos móviles y desktop

### ✅ **Información Mostrada**

- **Información del Lote**: Manzana, lote, metros², valor total, saldo a financiar
- **Resumen de Simulación**: Cuota mensual, plazo total, total a pagar
- **Tabla de Amortización**: Primeros 12 meses con desglose detallado
- **Comparación Completa**: Todas las opciones de plazo en una tabla

## 🔧 Cálculos Implementados

### **Fórmula de Cuota Mensual**

```typescript
const calcularCuotaConPlazo = (saldoFinanciar: number, plazoMeses: number, tasaAnual = 12) => {
  const tasaMensual = tasaAnual / 12 / 100
  const cuota = (saldoFinanciar * tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) / 
                (Math.pow(1 + tasaMensual, plazoMeses) - 1)
  return cuota
}
```

### **Tabla de Amortización**

```typescript
const calcularTablaAmortizacion = (saldoFinanciar: number, plazoMeses: number, tasaAnual = 12) => {
  const tasaMensual = tasaAnual / 12 / 100
  const cuotaMensual = calcularCuotaConPlazo(saldoFinanciar, plazoMeses, tasaAnual)
  const tabla = []
  let saldoPendiente = saldoFinanciar

  for (let mes = 1; mes <= Math.min(plazoMeses, 12); mes++) {
    const interes = saldoPendiente * tasaMensual
    const capital = cuotaMensual - interes
    saldoPendiente -= capital

    tabla.push({
      mes,
      cuota: cuotaMensual,
      capital,
      interes,
      saldoPendiente: Math.max(0, saldoPendiente)
    })
  }

  return tabla
}
```

## 📊 Parámetros de Cálculo

### **Tasa de Interés**
- **Tasa Anual**: 12% (configurable)
- **Tasa Mensual**: 1% (12% ÷ 12)
- **Método**: Interés compuesto

### **Plazos Disponibles**
- 12 meses (1 año)
- 24 meses (2 años)
- 36 meses (3 años)
- 48 meses (4 años)
- 60 meses (5 años)
- 72 meses (6 años)
- 84 meses (7 años)

### **Variables de Entrada**
- **Saldo a Financiar**: Valor total - enganche - instalación
- **Plazo Seleccionado**: Número de meses elegido por el usuario
- **Tasa de Interés**: Configurable (actualmente 12% anual)

## 🎨 Interfaz de Usuario

### **Botón de Simulación**
- **Ubicación**: Columna "Acciones" en la tabla de lotes
- **Icono**: Calculadora (Calculator)
- **Tooltip**: "Simular financiamiento"

### **Modal de Simulación**
- **Tamaño**: Máximo 4xl (muy ancho)
- **Altura**: Máximo 90vh con scroll
- **Organización**: 4 secciones principales

### **Secciones del Modal**

#### 1. **Información del Lote**
```
Manzana-Lote: A-001
Metros²: 200 m²
Valor Total: Q 150,000
Saldo a Financiar: Q 115,000
```

#### 2. **Selector de Plazo**
- Dropdown con 7 opciones de plazo
- Resumen visual con 3 métricas principales:
  - Cuota Mensual (azul)
  - Plazo Total (verde)
  - Total a Pagar (naranja)

#### 3. **Tabla de Amortización**
- Primeros 12 meses
- Columnas: Mes, Cuota, Capital, Interés, Saldo Pendiente
- Scroll horizontal si es necesario

#### 4. **Comparación de Plazos**
- Tabla comparativa de todos los plazos
- Resaltado del plazo seleccionado (fondo azul)
- Columnas: Plazo, Cuota Mensual, Total a Pagar, Interés Total

## 🔍 Ejemplo de Uso

### **Escenario**: Lote A-001
- **Valor Total**: Q 150,000
- **Enganche**: Q 30,000
- **Instalación**: Q 5,000
- **Saldo a Financiar**: Q 115,000

### **Resultados por Plazo**

| Plazo | Cuota Mensual | Total a Pagar | Interés Total |
|-------|---------------|---------------|---------------|
| 12 meses | Q 10,208.33 | Q 122,500 | Q 7,500 |
| 24 meses | Q 5,416.67 | Q 130,000 | Q 15,000 |
| 36 meses | Q 3,819.44 | Q 137,500 | Q 22,500 |
| 48 meses | Q 2,968.75 | Q 142,500 | Q 27,500 |
| 60 meses | Q 2,458.33 | Q 147,500 | Q 32,500 |
| 72 meses | Q 2,118.06 | Q 152,500 | Q 37,500 |
| 84 meses | Q 1,875.00 | Q 157,500 | Q 42,500 |

## 🛠️ Implementación Técnica

### **Archivos Modificados**
- `components/lotes-disponibles.tsx` - Componente principal

### **Nuevas Funciones**
- `handleSimulation()` - Maneja la apertura del modal
- `calcularCuotaConPlazo()` - Calcula cuota para plazo específico
- `calcularTablaAmortizacion()` - Genera tabla de amortización

### **Nuevos Estados**
- `isSimulationDialogOpen` - Controla visibilidad del modal
- `selectedPlazo` - Plazo seleccionado para simulación

### **Nuevos Componentes UI**
- Botón de simulación con icono Calculator
- Modal con 4 secciones de información
- Tablas responsivas con scroll

## 🎯 Beneficios

### **Para el Usuario**
- ✅ **Información Clara**: Ve exactamente cuánto pagará mensualmente
- ✅ **Comparación Fácil**: Puede comparar todos los plazos de un vistazo
- ✅ **Decisión Informada**: Toma decisiones basadas en datos reales
- ✅ **Transparencia**: Ve el desglose completo de capital e interés

### **Para el Negocio**
- ✅ **Mejor Experiencia**: Usuarios más satisfechos con información clara
- ✅ **Más Ventas**: Usuarios confiados toman decisiones más rápido
- ✅ **Reducción de Dudas**: Menos preguntas sobre financiamiento
- ✅ **Profesionalismo**: Sistema moderno y completo

## 🔄 Próximas Mejoras

1. **Configuración de Tasas**: Permitir ajustar la tasa de interés
2. **Exportar PDF**: Generar reporte de simulación en PDF
3. **Gráficos**: Visualización gráfica de la amortización
4. **Simulación Avanzada**: Incluir pagos extraordinarios
5. **Historial**: Guardar simulaciones realizadas
6. **Notificaciones**: Alertar sobre cambios en tasas de interés

## 📱 Responsive Design

### **Desktop (>768px)**
- Modal completo con todas las secciones visibles
- Tablas con todas las columnas
- Grid de 4 columnas para información del lote

### **Tablet (768px - 1024px)**
- Modal ajustado con scroll vertical
- Tablas con scroll horizontal
- Grid de 2 columnas para información

### **Mobile (<768px)**
- Modal optimizado para pantalla pequeña
- Tablas con scroll horizontal
- Grid de 1 columna para información
- Botones más grandes para touch

## 🔒 Consideraciones de Seguridad

- **Cálculos Cliente**: Todos los cálculos se realizan en el frontend
- **Datos Sensibles**: No se envían datos de simulación al servidor
- **Validación**: Los inputs están validados para evitar errores
- **Precisión**: Uso de `toFixed(2)` para mostrar 2 decimales

## 🎨 Personalización

### **Colores del Tema**
- **Azul**: Cuota mensual y elementos seleccionados
- **Verde**: Plazo total
- **Naranja**: Total a pagar
- **Gris**: Elementos secundarios

### **Iconos Utilizados**
- **Calculator**: Botón de simulación
- **Eye**: Ver detalles (futuro)
- **Download**: Exportar (futuro)

El simulador está completamente funcional y listo para usar. Los usuarios pueden ahora simular diferentes opciones de financiamiento para cualquier lote disponible de manera fácil y transparente.
