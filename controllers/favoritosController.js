const Usuario = require("../models/Usuario");
const Obras = require("../models/Obras");
const Favoritos=require("../models/Favoritos");
const { Op } = require("sequelize"); // Para operadores en la consulta


// Crear un favorito
const crearFavorito = async (req, res) => {
    try {
      const id_usuario = req.userData.userId; // ID del usuario autenticado
      const id_obra = req.params.id; // ID de la obra desde los parámetros
  
      // Verificar que la obra existe
      const obra = await Obras.findByPk(id_obra);
      if (!obra) {
        return res.status(404).json({ message: 'La obra no existe.' });
      }
  
      // Verificar si el favorito ya existe
      const favoritoExistente = await Favoritos.findOne({
        where: { id_usuario, id_obra },
      });
  
      if (favoritoExistente) {
        return res.status(400).json({ message: 'La obra ya está en tus favoritos.' });
      }
  
      // Crear el favorito
      const nuevoFavorito = await Favoritos.create({ id_usuario, id_obra });
  
      res.status(201).json({
        message: 'Obra agregada a favoritos.',
        favorito: nuevoFavorito,
      });
    } catch (error) {
      console.error('Error al agregar la obra a favoritos:', error);
      res.status(500).json({ message: 'Hubo un error al agregar la obra a favoritos.' });
    }
  };
  
  //---------------------------------------------------------------------------------------
  const obtenerFavoritos = async (req, res) => {
    try {
      const id_usuario = req.userData.userId; // ID del usuario autenticado
  
      // Buscar los favoritos del usuario, incluyendo los detalles de las obras y el autor
      const favoritos = await Favoritos.findAll({
        where: { id_usuario },
        include: [
          {
            model: Obras,
            attributes: ['id_obra', 'titulo', 'descripcion', 'imagen_url', 'precio', 'estado'],
            include: [
              {
                model: Usuario, // Relación directa sin alias
                attributes: ['id_usuario', 'nombre'], // Datos del autor
              },
            ],
          },
        ],
      });
  
      if (favoritos.length === 0) {
        return res.status(404).json({ message: 'No tienes obras marcadas como favoritas.' });
      }
  
      // Construir el objeto de respuesta con los detalles necesarios
      const obrasFavoritas = favoritos.map((favorito) => {
        const obra = favorito.Obra;
        return {
          id_obra: obra.id_obra,
          titulo: obra.titulo,
          descripcion: obra.descripcion,
          imagen_url: obra.imagen_url,
          precio: obra.precio,
          estado: obra.estado,
          artista: obra.Usuario ? obra.Usuario.nombre : 'Desconocido', // Datos del autor
        };
      });
  
      res.status(200).json({
        message: 'Favoritos obtenidos correctamente.',
        obras: obrasFavoritas,
      });
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      res.status(500).json({ message: 'Hubo un error al obtener los favoritos.' });
    }
  };
  
  
//---------------------------------------------------------------------------------------------


// Verificar si una obra específica está en favoritos
const verificarFavorito = async (req, res) => {
  try {
    const id_usuario = req.userData.userId; // ID del usuario autenticado
    const id_obra = req.params.id; // ID de la obra desde los parámetros

    // Buscar en la tabla Favoritos si existe la relación
    const favorito = await Favoritos.findOne({
      where: { id_usuario, id_obra },
    });

    // Responder con true o false
    res.status(200).json({ isFavorite: !!favorito });
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    res.status(500).json({ message: 'Hubo un error al verificar el favorito.' });
  }
};
//------------------------------------------------------------------------------------------

// Eliminar un favorito
const eliminarFavorito = async (req, res) => {
    try {
      const id_usuario = req.userData.userId; // ID del usuario autenticado
      const id_obra = req.params.id; // ID de la obra desde los parámetros
  
      // Buscar el favorito en la base de datos
      const favorito = await Favoritos.findOne({
        where: { id_usuario, id_obra },
      });
  
      // Verificar si el favorito existe
      if (!favorito) {
        return res.status(404).json({ message: 'La obra no está en tus favoritos.' });
      }
  
      // Eliminar el favorito
      await favorito.destroy();
  
      res.status(200).json({ message: 'La obra fue eliminada de tus favoritos.' });
    } catch (error) {
      console.error('Error al eliminar favorito:', error);
      res.status(500).json({ message: 'Hubo un error al eliminar el favorito.' });
    }
  };


  module.exports = {
    crearFavorito,obtenerFavoritos,verificarFavorito,eliminarFavorito,
  };


