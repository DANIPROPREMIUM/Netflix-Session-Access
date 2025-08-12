document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado correctamente');

  // Función para resetear el campo de entrada
  function resetInputField() {
    const container = document.querySelector('.section');
    if (!container) return;
    
    // Eliminar el campo existente si hay uno
    const existingInput = document.getElementById('full-code-input');
    if (existingInput) {
      existingInput.remove();
    }
    
    // Crear nuevo campo
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.id = 'full-code-input';
    newInput.placeholder = 'Introducir ID de acceso';
    newInput.className = '';
    newInput.autocomplete = 'off';
    
    // Insertar antes del botón
    const button = document.getElementById('restore-session');
    if (button) {
      container.insertBefore(newInput, button);
    } else {
      container.appendChild(newInput);
    }
    
    // Dar foco al nuevo campo
    setTimeout(() => {
      newInput.focus();
    }, 100);
    
    return newInput;
  }
  
  // Crear campo inicial
  let fullCodeInput = resetInputField();
  
  // Función para manejar el clic del botón
  async function handleRestoreClick() {
    console.log('Botón de restaurar presionado');
    
    if (!fullCodeInput) {
      fullCodeInput = resetInputField();
    }
    
    const fullCode = fullCodeInput.value.trim();

    if (!fullCode) {
      alert('Por favor, pega el código completo');
      return;
    }

    if (!fullCode.startsWith('netflix_session:')) {
      alert('Formato invalido. Usa: netflix_session:ID:CLAVE:DATOS');
      return;
    }

    const parts = fullCode.split(':');
    if (parts.length < 4) {
      alert('Formato invalido. Usa: netflix_session:ID:CLAVE:DATOS');
      return;
    }

    const sessionId = parts[1];
    const accessKey = parts[2];
    const encryptedData = parts.slice(3).join(':');

    console.log("ID de sesión:", sessionId);
    console.log("Clave de acceso:", accessKey);
    console.log("Datos cifrados:", encryptedData.substring(0, 50) + "...");

    const restoreBtn = document.getElementById('restore-session');
    
    try {
      // Mostrar mensaje de carga
      if (restoreBtn) {
        restoreBtn.textContent = "Procesando...";
        restoreBtn.disabled = true;
      }

      const response = await chrome.runtime.sendMessage({
        action: 'restorePermanentSession',
        sessionId: sessionId,
        accessKey: accessKey,
        encryptedData: encryptedData
      });

      if (response && response.success) {
        alert('Sesion restaurada! Recargando Netflix...');
      } else {
        alert('Error: ' + (response ? response.error : 'Sin respuesta'));
      }
    } catch (error) {
      console.error('Error en restauración:', error);
      alert('Error al restaurar: ' + error.message);
    } finally {
      // Restaurar el botón a su estado normal
      if (restoreBtn) {
        restoreBtn.textContent = "Acceso a Netflix";
        restoreBtn.disabled = false;
      }
      
      // Crear un nuevo campo de entrada después de un breve retraso
      setTimeout(() => {
        fullCodeInput = resetInputField();
      }, 1000);
    }
  }
  
  // Agregar event listener al botón
  const restoreBtn = document.getElementById('restore-session');
  if (restoreBtn) {
    // Eliminar event listeners existentes
    restoreBtn.replaceWith(restoreBtn.cloneNode(true));
    
    // Agregar nuevo event listener
    const newRestoreBtn = document.getElementById('restore-session');
    newRestoreBtn.addEventListener('click', handleRestoreClick);
  }

  console.log('Todos los event listeners configurados correctamente');
});