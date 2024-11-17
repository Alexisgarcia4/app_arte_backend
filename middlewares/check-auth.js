const jwt = require('jsonwebtoken');

const autorizacion = (req, res, next) => {
  try {
    // Verifica si el header "Authorization" está presente
    if (!req.headers.authorization) {
      return res.status(401).json({ message: 'No se proporcionó el token de autenticación.' });
    }

    // Obtén el token del header "Authorization" (formato: "Bearer token")
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Fallo de autenticación. Token no proporcionado.' });
    }

    // Verifica el token y almacena los datos del usuario en req.userData
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET ); // Usa una variable de entorno para la clave secreta
    req.userData = {
      userId: decodedToken.userId,
    };

    // Si todo es correcto, pasa al siguiente middleware o ruta
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Fallo de autenticación. Token inválido o expirado.' });
  }
};

module.exports = autorizacion;
