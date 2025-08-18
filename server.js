const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Configurar la base de datos SQLite
const db = new sqlite3.Database('./sessions.db');

// Crear tabla si no existe
db.run(`
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE NOT NULL,
    cookies TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER DEFAULT 0,
    device_fingerprint TEXT,
    browser_id TEXT
)
`);

// Configurar CORS para permitir peticiones desde cualquier origen
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Función para generar un token aleatorio
function generateToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Ruta para crear una nueva sesión
app.post('/api/sessions', (req, res) => {
  const { cookies, duration, deviceFingerprint, browserId } = req.body;
  if (!cookies || !duration) {
    return res.status(400).json({ error: 'Faltan cookies o duración' });
  }
  const token = generateToken();
  const expiresAt = Date.now() + (duration * 60 * 60 * 1000); // duration en horas
  db.run(
    'INSERT INTO sessions (token, cookies, expires_at, device_fingerprint, browser_id) VALUES (?, ?, ?, ?, ?)',
    [token, cookies, expiresAt, deviceFingerprint, browserId],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al crear la sesión' });
      }
      res.json({ token, expiresAt });
    }
  );
});

// Ruta para obtener las cookies de una sesión
app.get('/api/sessions/:token', (req, res) => {
  const token = req.params.token;
  // Verificar que el token exista, no haya expirado y no haya sido usado
  db.get(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > ? AND used = 0',
    [token, Date.now()],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error en el servidor' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Token inválido, expirado o ya utilizado' });
      }

      // Marcar el token como usado
      db.run('UPDATE sessions SET used = 1 WHERE id = ?', [row.id], (err) => {
        if (err) {
          console.error(err);
        }
      });

      // Devolver también el tiempo de expiración
      res.json({ 
        cookies: row.cookies,
        expiresAt: row.expires_at 
      });
    }
  );
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});