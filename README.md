# 📱 ESPOCH PASS — Guía de Desarrollo, Depuración Móvil y PWA

Esta guía contiene todos los pasos, comandos y procedimientos necesarios para ejecutar, depurar e inspeccionar la aplicación **ESPOCH PASS** en tu teléfono físico (Android) durante el desarrollo local, utilizando **ADB**, **Port Forwarding / Reverse Tunneling** y **Chrome Remote DevTools**.

---

## 🚀 1. Iniciar los Servidores Locales

### A. Frontend Angular (Puerto 8080)
```powershell
cd d:\SISTEMAS\2026\espochPass\IUEspochPass_19
npm run start
# Ejecuta: ng serve --host 0.0.0.0 --port 8080 con SSL activado
```

### B. Backend Node.js / Express (Puerto 5000)
```powershell
cd d:\SISTEMAS\2026\espochPass\WSEspochPass
npm run dev
# Ejecuta: node --watch index.js en el puerto 5000
```

---

## 🔌 2. Activar Modo Desarrollador y Depuración USB en el Teléfono

1. Ve a **Ajustes / Configuración** en tu teléfono Android.
2. Ingresa a **Acerca del teléfono** (o *Información de software*).
3. Presiona **7 veces seguidas** sobre **Número de compilación** (en Xiaomi: sobre **Versión de MIUI / Versión de HyperOS**) hasta que aparezca el mensaje: *"¡Ya eres desarrollador!"*.
4. Regresa a **Ajustes** ➔ **Ajustes adicionales / Sistema** ➔ **Opciones de desarrollador**.
5. Activa las siguientes opciones:
   - ✅ **Depuración por USB** (USB Debugging).
   - ✅ *(En Xiaomi/MIUI/HyperOS)* **Instalar vía USB**.
   - ✅ *(En Xiaomi/MIUI/HyperOS)* **Depuración USB (Ajustes de seguridad)**.
   - ✅ **Permitir superposiciones de pantalla en Ajustes**.

---

## 📲 3. Conectar el Dispositivo con ADB

Conecta el teléfono a la PC mediante un cable USB (selecciona modo **Transferencia de archivos** o **MTP**).

### Verificar conexión del dispositivo:
```powershell
adb devices
```
* **Salida esperada:**
  ```text
  List of devices attached
  523e2e31    device
  ```
* ⚠️ **Si aparece `unauthorized`:** Mira la pantalla de tu teléfono y acepta el diálogo emergente: *"¿Permitir depuración por USB desde esta computadora?"* (marca la casilla **"Permitir siempre"** y pulsa **Aceptar**).
* ⚠️ **Si aparece `offline` o no aparece:** Reinicia el servidor ADB con:
  ```powershell
  adb kill-server
  adb start-server
  adb devices
  ```

---

## 🔀 4. Enrutamiento de Puertos (`adb reverse`)

Para que el navegador de tu teléfono pueda resolver `localhost:8080` (Frontend) y `localhost:5000` (Backend) directamente apuntando a tu computadora vía USB:

```powershell
# Enrutar puerto del Frontend (Angular)
adb reverse tcp:8080 tcp:8080

# Enrutar puerto del Backend (API Express)
adb reverse tcp:5000 tcp:5000
```

### Comandos útiles de ADB Reverse:
```powershell
# Listar túneles activos:
adb reverse --list

# Eliminar todos los túneles activos:
adb reverse --remove-all
```

---

## 🔍 5. Inspección en Vivo con Google Chrome DevTools (`chrome://inspect`)

Puedes ver la consola de errores, inspeccionar el HTML/CSS y monitorear llamadas de red en tiempo real desde tu PC mientras usas el teléfono:

1. Abre **Google Chrome** en tu PC.
2. En la barra de direcciones escribe:
   ```text
   chrome://inspect/#devices
   ```
3. Asegúrate de que la casilla **"Discover USB devices"** esté marcada.
4. *(Opcional pero recomendado)* Haz clic en **"Port forwarding..."**:
   - Agrega `8080` ➔ `localhost:8080`
   - Agrega `5000` ➔ `localhost:5000`
   - Marca **"Enable port forwarding"** y pulsa **Done**.
5. Abre **Google Chrome en tu teléfono** y entra a `https://localhost:8080`.
6. En tu PC (en la pestaña de `chrome://inspect`), verás tu teléfono listado junto con la URL abierta. Haz clic en **"Inspect"**.
7. Se abrirá una ventana de DevTools donde podrás:
   - Ver la pantalla interactiva del teléfono en tiempo real.
   - Ver errores de consola (`Console`).
   - Ver peticiones HTTP (`Network`).
   - Inspeccionar y forzar almacenamiento (`Application` ➔ `Service Workers` / `Storage`).

---

## 📦 6. Instalación y Prueba de la PWA (Progressive Web App)

1. En el teléfono abre: `https://localhost:8080`.
2. Si aparece la advertencia de certificado SSL autofirmado:
   - Toca en **"Configuración avanzada"** ➔ **"Continuar a localhost (no seguro)"**.
3. En el menú de Google Chrome (3 puntos verticales arriba a la derecha):
   - Toca en **"Instalar aplicación"** o **"Agregar a la pantalla principal"**.
4. Se creará el acceso directo con el icono oficial cuadrado en tu inicio.
5. Al abrir la app instalada:
   - Se ejecutará en **modo pantalla completa** (`display: fullscreen`), ocultando la barra de navegación del explorador.
   - Contará con caché offline para carga instantánea del carnet y soporte para la cámara en el escáner QR.

---

## 💡 7. Solución de Problemas Frecuentes

### 🔄 La aplicación no actualiza los cambios de código en el teléfono:
El Service Worker (`sw.js`) puede estar sirviendo archivos cacheados:
1. Con `chrome://inspect` abierto en tu PC, ve a la pestaña **Application** ➔ **Storage**.
2. Haz clic en **"Clear site data"**.
3. O en el teléfono: en Chrome ve a Configuración ➔ Privacidad ➔ Borrar datos de navegación (Caché).

### 🔐 Error de validación CAS (`ERR_CONNECTION_REFUSED` o `500`):
- Asegúrate de haber ejecutado `adb reverse tcp:5000 tcp:5000`.
- El servidor `seguridad.espoch.edu.ec` solo responde si estás conectado a la red universitaria de la ESPOCH o vía VPN.
- **En modo desarrollo:** Puedes usar el combo **"Suplantar Usuario"** en la barra superior o en enrolamiento para ingresar directamente con cualquier rol sin necesidad de conexión al CAS institucional.

---

## ⚡ 8. Script Rápido de 1-Clic para Conectar Todo (PowerShell)

Copia y pega este comando en PowerShell para verificar y activar todo automáticamente:

```powershell
Write-Host "Verificando ADB y puertos..." -ForegroundColor Cyan
adb devices
adb reverse tcp:8080 tcp:8080
adb reverse tcp:5000 tcp:5000
adb reverse --list
Write-Host "✅ ¡Listo! Abre https://localhost:8080 en el navegador de tu celular." -ForegroundColor Green
```
