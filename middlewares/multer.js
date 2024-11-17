const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configurar almacenamiento con Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'usuarios', // Carpeta donde se guardarán las imágenes
    allowed_formats: ['jpg', 'jpeg', 'png'], // Formatos permitidos
  },
});

const upload = multer({ storage });

module.exports = upload;
