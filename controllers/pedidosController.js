const sequelize = require('../config/database'); // Importar la instancia de Sequelize
const Pedido = require("../models/Pedido");
const DetallePedido = require("../models/Detalle_Pedido");
const Obras = require("../models/Obras");
const Usuario = require("../models/Usuario");

// Crear un pedido
const crearPedido = async (req, res) => {
  const t = await sequelize.transaction(); // Crear una transacción
  try {
    const { detalles } = req.body; // Array con los detalles del pedido
    const id_usuario = req.userData.userId; // Usuario autenticado (ID del token)

    // Validar que se proporcionaron detalles del pedido
    if (!detalles || detalles.length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron detalles del pedido.' });
    }

    // Validar que cada obra existe y tiene suficiente stock
    for (const detalle of detalles) {
      const obra = await Obras.findByPk(detalle.id_obra);
      if (!obra || obra.cantidad < detalle.cantidad) {
        return res.status(400).json({
          message: `La obra con ID ${detalle.id_obra} no está disponible o no tiene suficiente stock.`,
        });
      }
    }

    // Crear el pedido inicial
    const nuevoPedido = await Pedido.create(
      {
        id_usuario, // Asociar el pedido al usuario autenticado
        estado: 'pendiente', // Estado inicial del pedido
        fecha: new Date(), // Fecha de creación del pedido
        total: 0, // Total inicial, que se actualizará después
      },
      { transaction: t } // Asociar la creación del pedido a la transacción
    );

    // Inicializar el total del pedido
    let total = 0;

    // Crear los detalles del pedido
    for (const detalle of detalles) {
      const obra = await Obras.findByPk(detalle.id_obra);

      // Calcular el subtotal del detalle
      const subtotal = obra.precio * detalle.cantidad;

      // Crear el detalle del pedido
      await DetallePedido.create(
        {
          id_pedido: nuevoPedido.id_pedido, // Asociar al pedido creado
          id_obra: obra.id_obra, // ID de la obra
          cantidad: detalle.cantidad, // Cantidad solicitada
          precio_unitario: obra.precio, // Precio por unidad
          subtotal: subtotal, // Subtotal calculado
        },
        { transaction: t } // Asociar a la transacción
      );

      // Actualizar el stock de la obra
      obra.cantidad -= detalle.cantidad; // Reducir el stock disponible
      await obra.save({ transaction: t }); // Guardar los cambios dentro de la transacción

      // Sumar el subtotal al total del pedido
      total += subtotal;
    }

    // Actualizar el total del pedido con el monto calculado
    nuevoPedido.total = total;
    await nuevoPedido.save({ transaction: t }); // Guardar el pedido actualizado en la base de datos

    // Confirmar la transacción si todo fue exitoso
    await t.commit();

    // Incluir datos adicionales del pedido al responder
    const pedidoCompleto = await Pedido.findByPk(nuevoPedido.id_pedido, {
      include: [
        {
          model: Usuario,
          attributes: ['id_usuario', 'nombre', 'email'], // Datos del usuario
        },
        {
          model: DetallePedido,
          include: [
            {
              model: Obras,
              attributes: ['id_obra', 'titulo', 'descripcion', 'precio', 'imagen_url'], // Datos de las obras
            },
          ],
        },
      ],
    });

    // Responder con el pedido creado y sus relaciones
    res.status(201).json({
      message: 'Pedido creado exitosamente.',
      pedido: pedidoCompleto,
    });
  } catch (error) {
    // Revertir los cambios si ocurre un error
    await t.rollback();
    console.error('Error al crear el pedido:', error);
    res.status(500).json({ message: 'Hubo un error al crear el pedido.' });
  }
};
//------------------------------------------------------------------------------------------

// Obtener todos los pedidos de un usuario con filtro por estado
const obtenerPedidosUsuario = async (req, res) => {
    try {
      const id_usuario = req.userData.userId; // Obtener el ID del usuario autenticado desde el token
      const { estado } = req.query; // Filtro opcional por estado
  
      // Crear el filtro dinámico
      const filtro = { id_usuario }; // Incluir el usuario autenticado
      if (estado) {
        filtro.estado = estado; // Agregar el estado al filtro si está presente
      }
  
      // Consultar los pedidos del usuario, incluyendo los detalles y las obras relacionadas
      const pedidos = await Pedido.findAll({
        where: filtro,
        include: [
          {
            model: DetallePedido,
            include: [
              {
                model: Obras,
                attributes: ['id_obra', 'titulo', 'descripcion', 'precio', 'imagen_url'], // Incluir detalles de las obras
              },
            ],
            attributes: ['cantidad', 'precio_unitario', 'subtotal'], // Incluir detalles del pedido
          },
        ],
        attributes: ['id_pedido', 'fecha_pedido', 'estado', 'total'], // Excluir campos innecesarios del pedido
        order: [['fecha_pedido', 'DESC']], // Ordenar los pedidos por fecha descendente
      });
  
      // Verificar si el usuario tiene pedidos
      if (pedidos.length === 0) {
        return res.status(404).json({ message: 'No tienes pedidos registrados.' });
      }
  
      // Responder con los pedidos encontrados
      res.status(200).json({
        message: 'Pedidos obtenidos correctamente.',
        pedidos,
      });
    } catch (error) {
      console.error('Error al obtener los pedidos del usuario:', error);
      res.status(500).json({ message: 'Hubo un error al obtener los pedidos.' });
    }
  };

  //------------------------------------------------------------------------------------------------

  const obtenerPedidos = async (req, res) => {
    try {
      const userId = req.userData.userId; // ID del usuario autenticado
      const usuario = await Usuario.findByPk(userId);
  
      // Verificar que el usuario sea administrador
      if (usuario.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden acceder a esta información.' });
      }
  
      // Obtener filtros desde los parámetros de consulta
      const { id_usuario, estado, page = 1, limit = 10 } = req.query;
  
      // Crear el filtro dinámico
      const filtro = {};
      if (id_usuario) filtro.id_usuario = id_usuario; // Filtrar por usuario
      if (estado) filtro.estado = estado; // Filtrar por estado
  
      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitParsed = parseInt(limit);
  
      // Consultar los pedidos con los filtros y la paginación
      const pedidos = await Pedido.findAll({
        where: filtro,
        include: [
          {
            model: Usuario,
            attributes: ['id_usuario', 'nombre', 'email'], // Incluir detalles del usuario
          },
          {
            model: DetallePedido,
            include: [
              {
                model: Obras,
                attributes: ['id_obra', 'titulo', 'descripcion', 'precio', 'imagen_url'], // Incluir detalles de las obras
              },
            ],
          },
        ],
        offset,
        limit: limitParsed,
        order: [['fecha_pedido', 'DESC']], // Ordenar por fecha (más reciente primero)
      });
  
      // Obtener el número total de pedidos para la paginación
      const total = await Pedido.count({ where: filtro });
  
      // Responder con los pedidos y la información de paginación
      res.status(200).json({
        message: 'Pedidos obtenidos exitosamente.',
        pedidos,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limitParsed),
      });
    } catch (error) {
      console.error('Error al obtener pedidos:', error);
      res.status(500).json({ message: 'Hubo un error al obtener los pedidos.' });
    }
  };

  //--------------------------------------------------------------------------------------------
  const cambiarEstado = async (req, res) => {
    try {
      const { id } = req.params; // ID del pedido recibido como parámetro en la URL
      const userId = req.userData.userId; // ID del usuario autenticado
  
      // Verificar que el usuario sea administrador
      const admin = await Usuario.findByPk(userId);
      if (!admin || admin.rol !== 'administrador') {
        return res.status(403).json({ message: 'Solo los administradores pueden cambiar el estado del pedido.' });
      }
  
      // Verificar que el pedido exista
      const pedido = await Pedido.findByPk(id);
      if (!pedido) {
        return res.status(404).json({ message: 'Pedido no encontrado.' });
      }
  
      // Verificar que el estado actual sea "pendiente"
      if (pedido.estado !== 'pendiente') {
        return res.status(400).json({ message: 'Solo se pueden completar pedidos en estado pendiente.' });
      }
  
      // Actualizar el estado del pedido a "completado"
      pedido.estado = 'completado';
      await pedido.save();
  
      res.status(200).json({
        message: 'Estado del pedido actualizado exitosamente.',
        pedido,
      });
    } catch (error) {
      console.error('Error al cambiar el estado del pedido:', error);
      res.status(500).json({ message: 'Hubo un error al cambiar el estado del pedido.' });
    }
  };
  
 //-----------------------------------------------------------------------------------------------
 const eliminarPedido = async (req, res) => {
    const { id } = req.params; // ID del pedido
    const userId = req.userData.userId; // ID del usuario autenticado
    const t = await sequelize.transaction(); // Crear transacción
  
    try {
      // Buscar el pedido con los detalles
      const pedido = await Pedido.findByPk(id, {
        include: [
          {
            model: DetallePedido,
            include: [Obras], // Incluye las obras para actualizar su cantidad
          },
        ],
      });
  
      // Verificar si el pedido existe
      if (!pedido) {
        return res.status(404).json({ message: 'Pedido no encontrado.' });
      }
  
      const admin = await Usuario.findByPk(userId);
      const userRole = admin.rol;
  
      // Verificar permisos: administrador o propietario del pedido
      if (pedido.id_usuario !== userId && userRole !== 'administrador') {
        return res.status(403).json({ message: 'No tienes permiso para eliminar este pedido.' });
      }
  
      // Verificar estado del pedido
      if (pedido.estado !== 'pendiente') {
        return res.status(400).json({ message: 'Solo se pueden eliminar pedidos pendientes.' });
      }
  
      // Revertir la cantidad de las obras
      for (const detalle of pedido.Detalle_Pedidos) {
        const obra = detalle.Obra;
        if (obra) {
          obra.cantidad += detalle.cantidad; // Sumar la cantidad de vuelta al stock
          await obra.save({ transaction: t });
        }
      }
  
      // Eliminar los detalles del pedido
      await DetallePedido.destroy({ where: { id_pedido: id }, transaction: t });
  
      // Eliminar el pedido
      await Pedido.destroy({ where: { id_pedido: id }, transaction: t });
  
      // Confirmar la transacción
      await t.commit();
  
      res.status(200).json({ message: 'Pedido eliminado correctamente.' });
    } catch (error) {
      // Revertir la transacción en caso de error
      await t.rollback();
      console.error('Error al eliminar el pedido:', error);
      res.status(500).json({ message: 'Hubo un error al eliminar el pedido.' });
    }
  };
  
  
module.exports = {
  crearPedido,obtenerPedidosUsuario,obtenerPedidos,cambiarEstado,eliminarPedido
};
