// Agregar pie de página y contador de sesión
(function() {
  // Crear pie de página
  const footer = document.createElement('a');
  footer.id = 'danipro-footer';
  footer.href = 'https://telegram.me/cuentaspremiumid';
  footer.target = '_blank';
  footer.style.position = 'fixed';
  footer.style.bottom = '10px';
  footer.style.left = '10px';
  footer.style.backgroundColor = 'rgba(0,0,0,0.7)';
  footer.style.color = 'white';
  footer.style.padding = '5px 10px';
  footer.style.borderRadius = '4px';
  footer.style.fontSize = '12px';
  footer.style.zIndex = '9999';
  footer.style.textDecoration = 'none';
  footer.style.cursor = 'pointer';
  footer.textContent = 'BY DANIPRO PREMIUM';
  document.body.appendChild(footer);
  
  // Crear contador
  const countdown = document.createElement('div');
  countdown.id = 'session-countdown';
  countdown.style.position = 'fixed';
  countdown.style.bottom = '40px';
  countdown.style.left = '10px';
  countdown.style.backgroundColor = 'rgba(229, 9, 20, 0.8)';
  countdown.style.color = 'white';
  countdown.style.padding = '5px 10px';
  countdown.style.borderRadius = '4px';
  countdown.style.fontSize = '12px';
  countdown.style.zIndex = '9999';
  countdown.style.fontWeight = 'bold';
  document.body.appendChild(countdown);
  
  // Obtener tiempo de expiración de la sesión directamente desde chrome.storage
  function getSessionExpiry() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['sessionExpiryTime'], (result) => {
          resolve(result.sessionExpiryTime || null);
        });
      } else {
        resolve(null);
      }
    });
  }
  
  // Actualizar contador con manejo de errores
  async function updateCountdown() {
    try {
      const expiryTime = await getSessionExpiry();
      
      if (!expiryTime) {
        countdown.textContent = 'Sesión no disponible';
        return;
      }
      
      const now = Date.now();
      const timeLeft = expiryTime - now;
      
      if (timeLeft <= 0) {
        countdown.textContent = 'Sesión expirada';
        // Si la sesión ha expirado, cerrar sesión automáticamente
        endSession();
        return;
      }
      
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      countdown.textContent = `Sesión expira en: ${hours}h ${minutes}m ${seconds}s`;
    } catch (error) {
      countdown.textContent = 'Error en contador';
    }
  }
  
  // Función para cerrar sesión automáticamente
  function endSession() {
    try {
      // Eliminar todas las cookies de Netflix
      const cookies = document.cookie.split(';');
      
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        
        // Eliminar cookie estableciendo una fecha de expiración en el pasado
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.netflix.com;';
      }
      
      // Recargar la página para mostrar la pantalla de inicio de sesión
      window.location.reload();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
  
  // Actualizar contador cada segundo
  setInterval(updateCountdown, 1000);
  updateCountdown();
  
  // Prevenir cierre de sesión
  preventLogout();
})();

function preventLogout() {
  // Bloquear botones de cierre de sesión
  const signOutSelectors = [
    '[data-uia="header-sign-out-link"]',
    '[data-uia="nav-signout"]',
    'a[href*="SignOut"]',
    '.signout-link'
  ];
  
  function blockSignOutButtons() {
    try {
      signOutSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(button => {
          if (!button.dataset.blocked) {
            button.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              showBlockedMessage();
              return false;
            });
            button.dataset.blocked = 'true';
          }
        });
      });
    } catch (error) {
      console.error("Error al bloquear botones:", error.message);
    }
  }
  
  function showBlockedMessage() {
    try {
      const existingMessages = document.querySelectorAll('.blocked-message');
      existingMessages.forEach(msg => msg.remove());
      
      const message = document.createElement('div');
      message.className = 'blocked-message';
      message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #E50914;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      message.textContent = 'No está permitido cerrar esta sesión';
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
          if (message.parentNode) {
            message.parentNode.removeChild(message);
          }
        }, 500);
      }, 3000);
    } catch (error) {
      console.error("Error al mostrar mensaje:", error.message);
    }
  }
  
  // Bloquear botones existentes
  blockSignOutButtons();
  
  // Observador para nuevos botones
  try {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          blockSignOutButtons();
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  } catch (error) {
    console.error("Error al crear observador:", error.message);
  }
  
  // Simular actividad humana para mantener la sesión activa
  try {
    setInterval(() => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const event = new MouseEvent('mousemove', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });
      document.dispatchEvent(event);
    }, 300000 + Math.random() * 300000); // Entre 5 y 10 minutos
  } catch (error) {
    console.error("Error al simular actividad:", error.message);
  }
}