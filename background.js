// Variable global para almacenar el tiempo de expiración
let sessionExpiryTime = null;

// Función para guardar el tiempo de expiración en chrome.storage
function saveSessionExpiry(time) {
  sessionExpiryTime = time;
  chrome.storage.local.set({ sessionExpiryTime: time });
}

// Función para cargar el tiempo de expiración desde chrome.storage
function loadSessionExpiry() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['sessionExpiryTime'], (result) => {
      sessionExpiryTime = result.sessionExpiryTime || null;
      resolve(sessionExpiryTime);
    });
  });
}

// Cargar el tiempo de expiración al iniciar
loadSessionExpiry();

// Restaurar cookies
async function restoreCookies(encryptedData) {
  try {
    console.log("Intentando decodificar datos de sesión...");
    const sessionData = JSON.parse(atob(encryptedData));
    console.log("Datos de sesión decodificados correctamente");

    // Verificar si la sesión ha expirado
    if (Date.now() > sessionData.expiresAt) {
      throw new Error('La sesión ha expirado');
    }

    // Guardar tiempo de expiración en memoria y en chrome.storage
    saveSessionExpiry(sessionData.expiresAt);

    console.log("La sesión no ha expirado");
    const cookies = sessionData.cookies.split('; ');
    console.log(`Restaurando ${cookies.length} cookies...`);

    let restoredCookies = 0;
    for (const cookie of cookies) {
      const [name, value] = cookie.split('=');
      try {
        await chrome.cookies.set({
          url: 'https://www.netflix.com',
          name: name,
          value: value,
          domain: '.netflix.com',
          secure: true,
          httpOnly: true
        });
        restoredCookies++;
        console.log(`Cookie restaurada: ${name}`);
      } catch (e) {
        console.error('Error restaurando cookie:', name, e);
      }
    }

    console.log(`Se restauraron ${restoredCookies} de ${cookies.length} cookies`);
    return restoredCookies > 0;
  } catch (e) {
    console.error('Error decodificando datos de sesión:', e);
    throw new Error('Código de sesión inválido');
  }
}

// Restaurar una sesión permanente (manual)
async function restorePermanentSession(sessionId, accessKey, encryptedData) {
  try {
    console.log("Iniciando restauración de sesión...");

    // Restaurar cookies
    const cookiesRestored = await restoreCookies(encryptedData);

    if (!cookiesRestored) {
      throw new Error('No se pudieron restaurar las cookies');
    }

    console.log("Cookies restauradas correctamente");

    // Obtener la ventana actual
    const currentWindow = await chrome.windows.getCurrent();
    console.log("ID de ventana actual:", currentWindow.id);

    // Obtener todas las pestañas en la ventana actual
    const allTabs = await chrome.tabs.query({ windowId: currentWindow.id });
    console.log(`Encontradas ${allTabs.length} pestañas en la ventana actual`);

    // Filtrar solo las pestañas de Netflix
    const netflixTabs = allTabs.filter(tab => tab.url && tab.url.includes('netflix.com'));
    console.log(`Encontradas ${netflixTabs.length} pestañas de Netflix en la ventana actual`);

    if (netflixTabs.length > 0) {
      // Recargar todas las pestañas de Netflix en la ventana actual
      for (const tab of netflixTabs) {
        console.log(`Recargando pestaña ${tab.id}: ${tab.url}`);
        await chrome.tabs.reload(tab.id);
      }
    } else {
      // Si no hay pestañas de Netflix en la ventana actual, abrir una nueva
      console.log("No hay pestañas de Netflix en la ventana actual, abriendo una nueva...");
      await chrome.tabs.create({
        url: "https://www.netflix.com",
        windowId: currentWindow.id,
        active: true
      });
    }

    return true;
  } catch (error) {
    console.error('Error en restauración:', error);
    throw new Error('Error al restaurar la sesión: ' + error.message);
  }
}

// Verificar periódicamente si la sesión ha expirado
setInterval(() => {
  if (sessionExpiryTime && Date.now() > sessionExpiryTime) {
    console.log('La sesión ha expirado');
    saveSessionExpiry(null);

    // Notificar al popup para resetear el campo
    try {
      chrome.runtime.sendMessage({action: 'sessionExpired'});
    } catch (e) {
      console.log("No se pudo notificar al popup");
    }
  }
}, 60000); // Verificar cada minuto

// Manejar mensajes desde popup y content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'restorePermanentSession') {
    restorePermanentSession(request.sessionId, request.accessKey, request.encryptedData)
      .then(() => {
        console.log("Sesión restaurada exitosamente");
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error("Error al restaurar sesión:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.action === 'getSessionExpiry') {
    sendResponse({ expiryTime: sessionExpiryTime });
    return true;
  }
});