const express = require('express');
const router = express.Router();
const obraController = require('../controllers/obrasController'); // Importar controlador de obras

const checkAuth =require('../middlewares/check-auth');


// Ruta para crear una obra
router.post('/', checkAuth, obraController.crearObra);


// Ruta para obtener todas las obras con filtros
router.get('/', obraController.obtenerObras);

// Obtener obra especifico sin restricciones
router.get('/:id', obraController.obtenerObrasEspecifica);

// Actualizar datos generales de la obra
router.put('/datos/:id', checkAuth, obraController.actualizarDatos);



// Ruta para actualizar imagen de obra
router.put('/imagen/:id', checkAuth, obraController.actualizarImagen);
// Ruta para eliminar imagen de perfil
router.delete('/imagen/:id', checkAuth, obraController.eliminarImagen);

// Ruta para actualizar el estado activo a false propietario y administrador
router.put('/activo/desactivar/:id', checkAuth,  obraController.actualizarActivoF);

// Ruta para actualizar el estado activo a true(solo administradores)
router.put('/activo/activar/:id', checkAuth,  obraController.actualizarActivoT);


module.exports = router;
