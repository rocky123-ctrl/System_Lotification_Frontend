// Configuración centralizada de variables de entorno
export const config = {
  // Configuración de la aplicación
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Lotificaciones System',
    port: parseInt(process.env.PORT || '3000', 10),
  },

  // Configuración del backend
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  // Configuración de autenticación
  auth: {
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
  },
}

export default config
