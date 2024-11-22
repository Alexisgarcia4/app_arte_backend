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

Una única ruta para obtener un pedido con sus detalles.
Ejemplo: GET /api/pedidos/:id
Actualizar Pedido (PUT):

Rutas separadas según lo que necesites modificar:
PUT /api/pedidos/:id para cambiar el estado del pedido.
PUT /api/detalles/:id para modificar los detalles de un pedido.
Eliminar:

DELETE /api/pedidos/:id: Elimina el pedido y sus detalles.
DELETE /api/detalles/:id: Elimina un detalle específico del pedido. 
*/