/*
Recomendación
Crear Pedido y Detalles (POST):

Una única ruta para crear el pedido junto con los detalles.
Ejemplo: POST /api/pedidos
Body:
json
Copiar código
{
  "detalles": [
    { "id_obra": 1, "cantidad": 2, "precio_unitario": 150 },
    { "id_obra": 2, "cantidad": 1, "precio_unitario": 200 }
  ]
}
Obtener Pedidos (GET):

Una única ruta para obtener un pedido con sus detalles. icluir datos include de las obras 
Ejemplo: GET /api/pedidos/:id


Actualizar Pedido (PUT):

Rutas separadas según lo que necesites modificar:
PUT /api/pedidos/:id para cambiar el estado del pedido de pendiente a completado solo administrador



Eliminar:

DELETE /api/pedidos/:id: Elimina el pedido y sus detalles. solo si esta en estado pendiente si no no se puede elimiar

*/

const express = require('express');
const router = express.Router();
const pedidoController = require('../controllers/pedidosController'); // Importar controlador de usuario

const checkAuth =require('../middlewares/check-auth');


// Endpoint para crear un nuevo usuario con imagen de perfil
router.post('/crear', checkAuth,  pedidoController.crearPedido);

// Get obtener todos los pedidos de un usuario mediante su token con include de obras y poder filtrar por estado 

router.get('/', checkAuth,  pedidoController.obtenerPedidosUsuario);


// Get obtener todos los pedidos con include . Solo para administrador, filtrado por usuario y estado

router.get('/admin', checkAuth,  pedidoController.obtenerPedidos );

// put cambiar esta de pendiente a completado solo administrador
router.put('/admin/:id', checkAuth,  pedidoController.cambiarEstado );

//delete eliminar pedido solo si es administrador o el propio usuario, ademas usar trasacciones puesto k hay k volver a sumar la cantidad a las obras
router.delete('/:id', checkAuth,  pedidoController.eliminarPedido );






module.exports = router;