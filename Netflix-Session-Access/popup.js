document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado correctamente');
  
  const fullCodeInput = document.getElementById('full-code-input');
  const restoreBtn = document.getElementById('restore-session');
  
  // Función para manejar el clic del botón
  async function handleRestoreClick() {
    console.log('Botón de restaurar presionado');
    
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
    
    try {
      // Mostrar mensaje de carga
      restoreBtn.textContent = "Procesando...";
      restoreBtn.disabled = true;
      
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
      restoreBtn.textContent = "Acceso a Netflix";
      restoreBtn.disabled = false;
      
      // Limpiar el campo de entrada
      fullCodeInput.value = "";
    }
  }
  
  // Agregar event listener al botón
  restoreBtn.addEventListener('click', handleRestoreClick);
  
  console.log('Event listener configurado correctamente');
});