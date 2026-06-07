const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET  /api/auth/me  (protegida)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
