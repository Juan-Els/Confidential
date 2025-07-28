// Configuración de Firebase
// INSTRUCCIONES PARA CONFIGURAR:
// 1. Ve a https://console.firebase.google.com/
// 2. Selecciona tu proyecto o crea uno nuevo
// 3. Ve a "Configuración del proyecto" (ícono de engranaje)
// 4. En la pestaña "General", busca "Tus aplicaciones"
// 5. Haz clic en "Agregar aplicación" y selecciona "Web" (</>) 
// 6. Registra tu aplicación con un nombre
// 7. Copia la configuración que te proporciona Firebase y reemplaza los valores abajo

const firebaseConfig = {
    // Reemplaza estos valores con los de tu proyecto Firebase
    apiKey: "AIzaSyABzNYiDEAmTubW7iNJnBRbOMC6utmCwQw",
    authDomain: "confidential-node.firebaseapp.com", 
    databaseURL: "https://confidential-node-default-rtdb.firebaseio.com/",
    projectId: "confidential-node",
    storageBucket: "confidential-node.firebasestorage.app",
    messagingSenderId: "816954641261",
    appId: "1:816954641261:web:e441e37d51d02d72a02864"
};

// IMPORTANTE: También necesitas habilitar Realtime Database
// 1. En la consola de Firebase, ve a "Realtime Database"
// 2. Haz clic en "Crear base de datos"
// 3. Selecciona una ubicación (preferiblemente cerca de tus usuarios)
// 4. Comienza en "modo de prueba" para desarrollo
// 5. Las reglas de seguridad se configurarán automáticamente para desarrollo

// Reglas de seguridad recomendadas para desarrollo (se configuran en Firebase Console):
/*
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
*/

// Para producción, usa reglas más estrictas:
/*
{
  "rules": {
    "messages": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "typing": {
      ".read": "auth != null", 
      ".write": "auth != null"
    },
    "users": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
*/
