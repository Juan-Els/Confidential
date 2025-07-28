# 🔒 Chat Confidencial

Una aplicación web de chat en tiempo real con autenticación por contraseña y diseño optimizado para móviles.

## 📱 Características

- **3 usuarios independientes** con contraseñas únicas
- **Chat grupal en tiempo real** donde los 3 usuarios pueden comunicarse
- **Diseño responsive** optimizado para dispositivos móviles
- **Indicadores de escritura** en tiempo real
- **Interfaz moderna** con tema oscuro
- **Seguridad** con autenticación por contraseña

## 👥 Usuarios y Contraseñas

| Usuario | Contraseña | Icono |
|---------|------------|-------|
| User 1  | 1234      | 👤    |
| User 2  | 1234      | 👥    |
| User 3  | 1234      | 🔐    |

## 🚀 Configuración de Firebase

### Paso 1: Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear un proyecto"
3. Nombra tu proyecto (ej: "chat-confidencial")
4. Acepta los términos y crea el proyecto

### Paso 2: Configurar Realtime Database

1. En el panel izquierdo, haz clic en "Realtime Database"
2. Haz clic en "Crear base de datos"
3. Selecciona una ubicación (preferiblemente cerca de tus usuarios)
4. Selecciona "Comenzar en modo de prueba" para desarrollo
5. Haz clic en "Habilitar"

### Paso 3: Configurar reglas de seguridad

En la pestaña "Reglas" de Realtime Database, reemplaza el contenido con:

```json
{
  "rules": {
    "messages": {
      ".read": true,
      ".write": true
    },
    "typing": {
      ".read": true,
      ".write": true
    },
    "users": {
      ".read": true,
      ".write": true
    }
  }
}
```

### Paso 4: Obtener configuración de la aplicación web

1. Ve a "Configuración del proyecto" (ícono de engranaje)
2. En la pestaña "General", busca "Tus aplicaciones"
3. Haz clic en "Agregar aplicación" y selecciona el ícono web `</>`
4. Registra tu aplicación con un nombre (ej: "Chat Web")
5. **NO** marques "También configurar Firebase Hosting"
6. Haz clic en "Registrar aplicación"
7. Copia la configuración que aparece

### Paso 5: Configurar la aplicación

1. Abre el archivo `script.js`
2. Busca la sección que dice:
   ```javascript
   const firebaseConfig = {
       apiKey: "TU_API_KEY",
       authDomain: "TU_PROJECT_ID.firebaseapp.com",
       // ... resto de la configuración
   };
   ```
3. Reemplaza todos los valores con los de tu proyecto Firebase

**Ejemplo de configuración:**
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC123456789abcdefghijklmnop",
    authDomain: "mi-chat-confidencial.firebaseapp.com",
    databaseURL: "https://mi-chat-confidencial-default-rtdb.firebaseio.com/",
    projectId: "mi-chat-confidencial",
    storageBucket: "mi-chat-confidencial.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789"
};
```

## 📁 Estructura del proyecto

```
chat-confidencial/
├── index.html          # Página principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── firebase-config.js  # Configuración de Firebase (referencia)
└── README.md          # Este archivo
```

## 🌐 Cómo usar

1. Abre `index.html` en tu navegador web
2. Selecciona un usuario (User 1, User 2, o User 3)
3. Ingresa la contraseña correspondiente
4. ¡Comienza a chatear en tiempo real!

## 📱 Características del diseño

- **Responsive**: Se adapta perfectamente a móviles y tablets
- **Tema oscuro**: Diseño moderno y elegante
- **Animaciones suaves**: Transiciones fluidas entre pantallas
- **Indicadores visuales**: Estados de conexión y escritura
- **Interfaz intuitiva**: Fácil de usar en dispositivos táctiles

## 🔧 Funcionalidades técnicas

- **Mensajes en tiempo real** usando Firebase Realtime Database
- **Indicador de escritura** que muestra cuando alguien está escribiendo
- **Persistencia de mensajes** - los mensajes se guardan automáticamente
- **Detección de conexión** - muestra el estado de la conexión
- **Scroll automático** - se desplaza automáticamente a los nuevos mensajes

## 🛠️ Desarrollo

### Para desarrollo local:

1. Clona o descarga los archivos
2. Configura Firebase según las instrucciones
3. Abre `index.html` en tu navegador
4. Para desarrollo, puedes usar un servidor local:
   ```bash
   # Con Python 3
   python -m http.server 8000
   
   # Con Node.js (si tienes http-server instalado)
   npx http-server
   ```

### Para producción:

1. Configura reglas de seguridad más estrictas en Firebase
2. Considera implementar autenticación real de Firebase
3. Optimiza los archivos CSS y JavaScript
4. Configura Firebase Hosting para deployment

## 🔒 Seguridad

**Para desarrollo:**
- Las reglas actuales permiten lectura/escritura libre
- Las contraseñas están en el código (solo para demo)

**Para producción:**
- Implementa autenticación real de Firebase
- Usa reglas de seguridad más estrictas
- Considera encriptar las contraseñas
- Implementa validación del lado del servidor

## 🐛 Debugging

La aplicación incluye herramientas de debugging. En la consola del navegador puedes usar:

```javascript
// Ver usuario actual
debugChat.getCurrentUser()

// Ver configuración de usuarios
debugChat.getUsers()

// Limpiar todos los mensajes
debugChat.clearMessages()

// Enviar mensaje de prueba
debugChat.sendTestMessage("Hola mundo!")
```

## 📞 Soporte

Si tienes problemas:

1. Verifica que Firebase esté configurado correctamente
2. Revisa la consola del navegador para errores
3. Asegúrate de que las reglas de Realtime Database permitan lectura/escritura
4. Verifica que la URL de la base de datos sea correcta

## 🎨 Personalización

Puedes personalizar fácilmente:

- **Colores**: Modifica las variables CSS en `:root`
- **Usuarios**: Cambia nombres, iconos y contraseñas en `script.js`
- **Mensajes**: Personaliza el formato en la función `displayMessage()`
- **Animaciones**: Ajusta las transiciones en `styles.css`
