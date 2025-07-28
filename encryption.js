/**
 * Sistema de Encriptación para Chat Confidencial
 * Implementa encriptación AES-256 con clave derivada de contraseña
 */

class ChatEncryption {
    constructor() {
        this.isEncrypted = true; // Por defecto, todo está encriptado
        this.masterKey = null;
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
    }

    /**
     * Genera una clave maestra compartida basada en todas las contraseñas de usuarios
     */
    async generateMasterKey(salt = null) {
        const encoder = new TextEncoder();
        
        // Clave maestra derivada de todas las contraseñas de usuarios
        // Esto permite que cualquier usuario pueda desencriptar mensajes de otros
        const allPasswords = ['123', '1234', '2325', '098']; // Contraseñas de Kenny, Getsell, Sebastian, Administrador
        const masterPassword = allPasswords.sort().join('|'); // Combinar y ordenar para consistencia
        
        // Si no hay salt, generar uno nuevo
        if (!salt) {
            salt = crypto.getRandomValues(new Uint8Array(16));
        }
        
        // Importar la clave maestra como clave
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(masterPassword),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        // Derivar la clave usando PBKDF2
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: this.algorithm, length: this.keyLength },
            false,
            ['encrypt', 'decrypt']
        );
        
        return { key, salt };
    }

    /**
     * Genera una clave de encriptación basada en la contraseña del usuario (método legacy)
     */
    async generateKey(password, salt = null) {
        // Usar la clave maestra en lugar de la contraseña individual
        return await this.generateMasterKey(salt);
    }

    /**
     * Encripta un texto usando AES-GCM con clave maestra
     */
    async encryptText(text, password = null) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text);
            
            // Generar clave maestra y salt
            const { key, salt } = await this.generateMasterKey();
            
            // Generar IV aleatorio
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encriptar
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                data
            );
            
            // Combinar salt + iv + datos encriptados
            const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            result.set(salt, 0);
            result.set(iv, salt.length);
            result.set(new Uint8Array(encrypted), salt.length + iv.length);
            
            // Convertir a base64 para almacenamiento
            return this.arrayBufferToBase64(result);
        } catch (error) {
            console.error('Error al encriptar:', error);
            return text; // Devolver texto original si falla
        }
    }

    /**
     * Desencripta un texto usando AES-GCM con clave maestra
     */
    async decryptText(encryptedText, password = null) {
        try {
            // Convertir de base64 a array buffer
            const data = this.base64ToArrayBuffer(encryptedText);
            
            // Extraer salt, iv y datos encriptados
            const salt = data.slice(0, 16);
            const iv = data.slice(16, 28);
            const encrypted = data.slice(28);
            
            // Regenerar la clave maestra usando el mismo salt
            const { key } = await this.generateMasterKey(salt);
            
            // Desencriptar
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encrypted
            );
            
            // Convertir a texto
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Error al desencriptar:', error);
            return encryptedText; // Devolver texto encriptado si falla
        }
    }

    /**
     * Encripta un nombre de usuario de forma determinística usando clave maestra
     * (mismo nombre siempre produce la misma encriptación)
     */
    async encryptUsername(username, password = null) {
        try {
            // Usar el nombre como salt adicional para que sea determinístico
            const encoder = new TextEncoder();
            const userSalt = await crypto.subtle.digest('SHA-256', encoder.encode(username + 'username_salt'));
            const salt = new Uint8Array(userSalt).slice(0, 16);
            
            const { key } = await this.generateMasterKey(salt);
            
            // IV fijo basado en el nombre para que sea determinístico
            const ivSource = await crypto.subtle.digest('SHA-256', encoder.encode(username + 'iv_source'));
            const iv = new Uint8Array(ivSource).slice(0, 12);
            
            const data = encoder.encode(username);
            
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                data
            );
            
            // Solo devolver los datos encriptados (sin salt ni iv ya que son determinísticos)
            return this.arrayBufferToBase64(encrypted);
        } catch (error) {
            console.error('Error al encriptar nombre:', error);
            return username;
        }
    }

    /**
     * Desencripta un nombre de usuario usando clave maestra
     */
    async decryptUsername(encryptedUsername, originalUsername, password = null) {
        try {
            const encoder = new TextEncoder();
            
            // Regenerar el mismo salt e IV que se usó para encriptar
            const userSalt = await crypto.subtle.digest('SHA-256', encoder.encode(originalUsername + 'username_salt'));
            const salt = new Uint8Array(userSalt).slice(0, 16);
            
            const { key } = await this.generateMasterKey(salt);
            
            const ivSource = await crypto.subtle.digest('SHA-256', encoder.encode(originalUsername + 'iv_source'));
            const iv = new Uint8Array(ivSource).slice(0, 12);
            
            const encrypted = this.base64ToArrayBuffer(encryptedUsername);
            
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encrypted
            );
            
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Error al desencriptar nombre:', error);
            return encryptedUsername;
        }
    }

    /**
     * Intenta desencriptar un nombre de usuario probando con todos los nombres conocidos
     */
    async decryptUsernameAuto(encryptedUsername, password = null) {
        const knownUsernames = ['Kenny', 'Getsell', 'Sebastian', 'Administrador'];
        
        for (const username of knownUsernames) {
            try {
                const decrypted = await this.decryptUsername(encryptedUsername, username, password);
                if (decrypted === username) {
                    return username;
                }
            } catch (error) {
                // Continuar con el siguiente nombre
                continue;
            }
        }
        
        // Si no se pudo desencriptar, devolver el nombre encriptado
        return encryptedUsername;
    }

    /**
     * Genera un nombre encriptado visible (para mostrar en la UI)
     */
    generateEncryptedDisplayName(username) {
        // Crear un hash del nombre para generar un nombre encriptado consistente
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            const char = username.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir a 32bit integer
        }
        
        // Generar un nombre encriptado basado en el hash
        const encryptedNames = [
            '🔐User_Alpha', '🔒User_Beta', '🔑User_Gamma', '🛡️User_Delta',
            '🔐Agent_X', '🔒Agent_Y', '🔑Agent_Z', '🛡️Agent_W',
            '🔐Cipher_01', '🔒Cipher_02', '🔑Cipher_03', '🛡️Cipher_04',
            '🔐Node_A', '🔒Node_B', '🔑Node_C', '🛡️Node_D'
        ];
        
        const index = Math.abs(hash) % encryptedNames.length;
        return encryptedNames[index];
    }

    /**
     * Genera texto encriptado visible (para mostrar mensajes encriptados)
     */
    generateEncryptedDisplayText(text) {
        // Crear diferentes patrones de encriptación visual
        const patterns = [
            '█████████████████',
            '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓',
            '░░░░░░░░░░░░░░░░░',
            '▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒',
            '■■■■■■■■■■■■■■■■■',
            '□□□□□□□□□□□□□□□□□',
            '▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲',
            '◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆◆'
        ];
        
        // Seleccionar patrón basado en la longitud del texto
        const patternIndex = text.length % patterns.length;
        let pattern = patterns[patternIndex];
        
        // Ajustar la longitud del patrón al texto original
        const targetLength = Math.max(8, Math.min(text.length, 25));
        if (pattern.length > targetLength) {
            pattern = pattern.substring(0, targetLength);
        } else if (pattern.length < targetLength) {
            pattern = pattern.repeat(Math.ceil(targetLength / pattern.length)).substring(0, targetLength);
        }
        
        return `🔒 ${pattern}`;
    }

    /**
     * Utilidades para conversión de datos
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Verifica si un texto está encriptado
     */
    isTextEncrypted(text) {
        // Un texto encriptado en base64 típicamente tiene ciertos patrones
        try {
            // Verificar si es base64 válido y tiene longitud apropiada
            const decoded = atob(text);
            return decoded.length > 28 && text.length > 40; // salt(16) + iv(12) + datos mínimos
        } catch {
            return false;
        }
    }

    /**
     * Obtiene el estado de encriptación
     */
    getEncryptionState() {
        return this.isEncrypted;
    }

    /**
     * Cambia el estado de encriptación
     */
    setEncryptionState(encrypted) {
        this.isEncrypted = encrypted;
    }
}

// Crear instancia global
window.chatEncryption = new ChatEncryption();
