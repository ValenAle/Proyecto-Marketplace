const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');

/* ─────────────────────────────────────────
   POST /api/auth/register
   Body: { email, password, name }
───────────────────────────────────────── */
const register = async (req, res) => {
  const { email, password, name } = req.body;

  // Validaciones básicas
  if (!email || !password || !name) {
    return res.status(400).json({
      ok: false,
      message: 'Email, contraseña y nombre son requeridos.',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      message: 'La contraseña debe tener al menos 6 caracteres.',
    });
  }

  try {
    // 1. Verificar que el email no exista
    const [rows] = await pool.execute(
      'CALL sp_check_email_exists(?)',
      [email]
    );

    // mysql2 devuelve el result set dentro de rows[0]
    const existing = rows[0];
    if (existing.length > 0) {
      return res.status(409).json({
        ok: false,
        message: 'Ya existe una cuenta con ese email.',
      });
    }

    // 2. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Crear el usuario
    await pool.execute(
      'CALL sp_create_user(?, ?)',
      [email, passwordHash]
    );

    // 4. Obtener el id del usuario recién creado
    const [newUserRows] = await pool.execute(
      'CALL sp_check_email_exists(?)',
      [email]
    );
    const newUser = newUserRows[0][0];

    // 5. Crear el perfil vinculado al usuario
    await pool.execute(
      'CALL sp_create_profile(?, ?, ?)',
      [name, null, newUser.id_user]
    );

    // 6. Generar JWT
    const token = generateToken(newUser.id_user, newUser.email);

    return res.status(201).json({
      ok: true,
      message: 'Cuenta creada correctamente.',
      data: {
        token,
        user: {
          id_user: newUser.id_user,
          email:   newUser.email,
          name,
        },
      },
    });

  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor.',
    });
  }
};

/* ─────────────────────────────────────────
   POST /api/auth/login
   Body: { email, password }
───────────────────────────────────────── */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Email y contraseña son requeridos.',
    });
  }

  try {
    // 1. Buscar usuario por email
    const [rows] = await pool.execute(
      'CALL sp_check_email_exists(?)',
      [email]
    );

    const user = rows[0][0];

    if (!user) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales incorrectas.',
      });
    }

    // 2. Verificar que la cuenta esté activa
    if (!user.is_active) {
      return res.status(403).json({
        ok: false,
        message: 'La cuenta está deshabilitada.',
      });
    }

    // 3. Comparar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        ok: false,
        message: 'Credenciales incorrectas.',
      });
    }

    // 4. Obtener perfil
    const [profileRows] = await pool.execute(
      'CALL sp_get_profile(?)',
      [user.id_user]
    );
    const profile = profileRows[0][0] || null;

    // 5. Generar JWT
    const token = generateToken(user.id_user, user.email);

    return res.status(200).json({
      ok: true,
      message: 'Login exitoso.',
      data: {
        token,
        user: {
          id_user:    user.id_user,
          email:      user.email,
          name:       profile?.name       || null,
          avatar_url: profile?.avatar_url || null,
        },
      },
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor.',
    });
  }
};

/* ─────────────────────────────────────────
   GET /api/auth/me   (requiere token)
───────────────────────────────────────── */
const me = async (req, res) => {
  try {
    const [profileRows] = await pool.execute(
      'CALL sp_get_profile(?)',
      [req.user.id_user]
    );
    const profile = profileRows[0][0] || null;

    return res.status(200).json({
      ok: true,
      data: {
        id_user:    req.user.id_user,
        email:      req.user.email,
        name:       profile?.name       || null,
        avatar_url: profile?.avatar_url || null,
      },
    });
  } catch (error) {
    console.error('Error en me:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor.',
    });
  }
};

/* ─────────────────────────────────────────
   Helper: generar JWT
───────────────────────────────────────── */
const generateToken = (id_user, email) => {
  return jwt.sign(
    { id_user, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { register, login, me };
