const express = require('express');
const router = express.Router();
const favoritosController = require('../controllers/favoritosController'); // Importar controlador de favoritos

const checkAuth =require('../middlewares/check-auth');


// Ruta para crear un favorito
router.post('/:id', checkAuth, favoritosController.crearFavorito);

//Obtener Favoritos de un Usuario 
router.get('/', checkAuth, favoritosController.obtenerFavoritos);

//Obtener true o false de una obra especifica
router.get('/:id', checkAuth, favoritosController.verificarFavorito);

// Ruta para eliminar un favorito
router.delete('/:id', checkAuth, favoritosController.eliminarFavorito);




module.exports = router;
