const Usuario = require("../models/Usuario");
const Obras = require("../models/Obras");
const bcrypt = require("bcryptjs"); // Para encriptar contraseñas

const jwt = require("jsonwebtoken"); // Para generar el token JWT

const { Op } = require("sequelize"); // Para operadores en la consulta

const cloudinary = require("../config/cloudinary"); // Configuración de Cloudinary

//------------------------------------------------------------------------------------------------

const crearObra = async (req, res) => {
    const { titulo, descripcion, precio, cantidad, estado } = req.body;
  
    try {
      // Verificar que el usuario autenticado tiene permiso para crear una obra
      
        const userId = req.userData.userId; // ID del usuario autenticado

        const art = await Usuario.findByPk(userId);
        const artRol = art.rol;
      if (artRol !== 'artista') {
        return res.status(403).json({ message: 'Solo los artistas pueden crear obras.' });
      }
  
      // Verificar que se proporcionó una imagen
      if (!req.file) {
        return res.status(400).json({ message: 'Es necesario subir una imagen para la obra.' });
      }
  
     // Obtener la URL de la imagen desde multer-storage-cloudinary
    const imagenUrl = req.file ? req.file.path : null;
  
      // Crear la obra en la base de datos
      const nuevaObra = await Obras.create({
        titulo,
        descripcion,
        imagen_url: imagenUrl, // URL segura de la imagen
        precio,
        cantidad,
        id_autor: req.userData.userId, // Asociar al autor autenticado
        estado: estado || 'disponible', // Valor por defecto si no se proporciona
      });
  
      // Responder con la obra creada
      res.status(201).json({
        message: 'Obra creada exitosamente.',
        obra: nuevaObra,
      });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'El título de la obra ya está en uso por este autor.' });
          }
      console.error('Error al crear la obra:', error);
      res.status(500).json({ message: 'Hubo un error al crear la obra.' });
    }
  };
  //-----------------------------------------------------------------------------------------------
  const obtenerObras = async (req, res) => {
    try {
      // Obtener los filtros desde los parámetros de consulta
      const { titulo, precio_min, precio_max, id_autor, page = 1, limit = 10 } = req.query;
  
      // Crear el filtro dinámico
      const filtro = {};
  
      // Filtro por título (que empiece con el texto proporcionado)
      if (titulo) {
        filtro.titulo = { [Op.like]: `${titulo}%` };
      }
  
      // Filtro por rango de precios
      if (precio_min || precio_max) {
        filtro.precio = {};
        if (precio_min) filtro.precio[Op.gte] = parseFloat(precio_min); // Mayor o igual
        if (precio_max) filtro.precio[Op.lte] = parseFloat(precio_max); // Menor o igual
      }
  
      // Filtro por ID del autor
      if (id_autor) {
        filtro.id_autor = id_autor;
      }
  
      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitParsed = parseInt(limit);
  
      // Consultar las obras en la base de datos con los filtros y la paginación
      const obras = await Obras.findAll({
        where: filtro,
        attributes: { exclude: ['createdAt', 'updatedAt'] }, // Excluir campos innecesarios
        offset,
        limit: limitParsed,
      });
  
      // Obtener el número total de obras para calcular la paginación
      const total = await Obras.count({ where: filtro });
  
      // Responder con las obras y la información de paginación
      res.status(200).json({
        obras,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limitParsed),
      });
    } catch (error) {
      console.error('Error al obtener obras:', error);
      res.status(500).json({ message: 'Hubo un error al obtener las obras.' });
    }
  };
  
  


  module.exports = {
    crearObra,obtenerObras,
  };


