const express = require('express');
const router = express.Router();
const obraController = require('../controllers/obrasController'); // Importar controlador de obras
const upload = require('../middlewares/multer'); // Importar middleware para subir imágenes
const checkAuth =require('../middlewares/check-auth');


// Ruta para crear una obra
router.post('/', checkAuth, upload.single('imagen'), obraController.crearObra);


// Ruta para obtener todas las obras con filtros
router.get('/', obraController.obtenerObras);


module.exports = router;
