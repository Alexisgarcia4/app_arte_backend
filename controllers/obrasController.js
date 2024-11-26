const Usuario = require("../models/Usuario");
const Obras = require("../models/Obras");




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

      if (!art.activo){
        return res.status(403).json({ message: "Artista desactivado." });
      }
  
      // Verificar que se proporcionó una imagen
    if (!req.files || !req.files.imagen) {
        return res.status(400).json({ message: 'Es necesario subir una imagen para la obra.' });
      }
  // Verificar si el artista ya tiene una obra con el mismo título
  const obraExistente = await Obras.findOne({
    where: {
      titulo,
      id_autor: userId, // Buscar solo entre las obras del autor
    },
  });

  if (obraExistente) {
    return res
      .status(400)
      .json({ message: 'Ya tienes una obra con este título. Usa un título diferente.' });
  }

      // Subir la imagen a Cloudinary
      const file = req.files.imagen;
      let imagenUrl;
  
      try {
        const resultado = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: `obras`, // Subir a una carpeta específica para el usuario
        });
        imagenUrl = resultado.secure_url;
      } catch (cloudinaryError) {
        console.error('Error al subir la imagen a Cloudinary:', cloudinaryError);
        return res.status(500).json({ message: 'Error al subir la imagen a Cloudinary.' });
      }
  
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
      const { titulo, precio_min, precio_max, id_autor, activo, page = 1, limit = 10 } = req.query;
  
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

      // Filtro por ID del autor
      if (activo) {
        filtro.activo = activo;
      }
  
      // Paginación
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const limitParsed = parseInt(limit);
  
      // Consultar las obras en la base de datos con los filtros y la paginación
      const obras = await Obras.findAll({
        include: [{
          model: Usuario,
          attributes: ['id_usuario', 'nombre', 'nick'],
        }],
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
  //----------------------------------------------------------------------------------------------
  
  const obtenerObrasEspecifica = async (req, res) => {
    
     
      const { id } = req.params; 
  
      try {
        
        const obra = await Obras.findOne({
          include: [{
            model: Usuario,
            attributes: ['id_usuario', 'nombre', 'nick'],
          }],
          where: { id_obra: id },
          
        });
    
        // Verificar si el artista existe
        if (!obra) {
          return res.status(404).json({ message: 'Obra no encontrado.' });
        }
    
        // Enviar los datos del artista
        res.status(200).json({ obra });
      } catch (error) {
        console.error('Error al obtener los datos de la obra:', error);
        res.status(500).json({ message: 'Hubo un error al obtener los datos de la obra.' });
      }
    }
    //----------------------------------------------------------------------------------------------

    const actualizarDatos = async (req, res) => {
      const { id } = req.params; // ID de la obra que se quiere actualizar
      const { titulo, descripcion, precio, cantidad, estado } = req.body;
    
      try {
        // Verificar que la obra exista
        const obra = await Obras.findByPk(id);
        if (!obra) {
          return res.status(404).json({ message: "Obra no encontrada." });
        }

        if (!obra.activo) {
          return res.status(404).json({ message: "Obra desactivada." });
        }
    
        // Verificar que el usuario autenticado es el dueño de la obra
        if (req.userData.userId !== obra.id_autor) {
          return res
            .status(403)
            .json({ message: "No tienes permiso para modificar esta obra." });
        }
    
        // Validar que el título de la obra no esté duplicado para este autor
        if (titulo && titulo !== obra.titulo) {
          const obraDuplicada = await Obras.findOne({
            where: {
              titulo,
              id_autor: req.userData.userId,
              id_obra: { [Op.ne]: id }, // Excluir la obra actual de la búsqueda
            },
          });
    
          if (obraDuplicada) {
            return res.status(400).json({
              message: "Ya tienes otra obra con este título. Usa un título diferente.",
            });
          }
        }
    
        // Validar que los valores sean válidos (puedes extender esta parte según los requisitos)
        if (precio && precio <= 0) {
          return res.status(400).json({ message: "El precio debe ser mayor que 0." });
        }
        if (cantidad && cantidad < 0) {
          return res.status(400).json({ message: "La cantidad no puede ser negativa." });
        }
        if (estado && !["disponible", "no disponible"].includes(estado)) {
          return res.status(400).json({ message: "El estado debe ser 'disponible' o 'no disponible'." });
        }
    
        // Actualizar los datos de la obra
        await Obras.update(
          { titulo, descripcion, precio, cantidad, estado }, // Campos a actualizar
          { where: { id_obra: id } } // Condición: ID de la obra
        );
    
        res.status(200).json({ message: "Datos actualizados correctamente." });
      } catch (error) {
        console.error("Error al actualizar datos:", error);
        res.status(500).json({ message: "Hubo un error al actualizar los datos." });
      }
    };

//------------------------------------------------------------------------------------------
const actualizarImagen = async (req, res) => {
  const { id } = req.params; // ID de la obra

  try {
    // Verificar que la obra exista
    const obra = await Obras.findByPk(id);
    if (!obra) {
      return res.status(404).json({ message: "Obra no encontrada." });
      
    }

    if (!obra.activo) {
      return res.status(404).json({ message: "Obra desactivada." });
    }

    // Verificar que el usuario autenticado es el dueño de la obra
    if (req.userData.userId !== obra.id_autor) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar esta obra." });
    }

    // Verificar que se subió una nueva imagen
    if (!req.files || !req.files.imagen_url) {
      return res.status(400).json({ message: "No se recibió ninguna imagen." });
    }

    // Eliminar la imagen anterior de Cloudinary si existe
    if (obra.imagen_url) {
      try {
        // Extraer el public_id desde la URL de Cloudinary
     const urlBase = "https://res.cloudinary.com/dunxdsecw/image/upload/";
     const publicIdWithExtension = obra.imagen_url.replace(urlBase, ""); // Quita la parte fija
 
     // Dividir por "/" y obtener el último segmento
     const parts = publicIdWithExtension.split("/");
     const lastPart = parts.slice(1).join("/"); // Combina desde "obras" en adelante
     const publicId = lastPart.split(".")[0]; // Elimina la extensión
 
     console.log(publicId); // Salida: "obras/g6ugbdwrtoz5eyk11gnv"
     // Eliminar la imagen en Cloudinary
     await cloudinary.uploader.destroy(publicId);
       } catch (cloudinaryError) {
         console.error("Error al eliminar la imagen de Cloudinary:", cloudinaryError);
       }
     }

    // Subir la nueva imagen a Cloudinary
    const file = req.files.imagen_url; // Obtener la nueva imagen del request
    const resultado = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "obras",
    });

    // Actualizar la base de datos con la nueva URL de la imagen
    await Obras.update(
      { imagen_url: resultado.secure_url }, // Nuevo URL de la imagen
      { where: { id_obra: id } } // Condición: ID de la obra
    );

    res.status(200).json({
      message: "Imagen actualizada correctamente.",
      imagen_url: resultado.secure_url,
    });
  } catch (error) {
    console.error("Error al actualizar la imagen de la obra:", error);
    res
      .status(500)
      .json({ message: "Hubo un error al actualizar la imagen de la obra." });
  }
};
  
//------------------------------------------------------------------------------------------------
const eliminarImagen = async (req, res) => {
  const { id } = req.params; // ID de la obra

  try {
    // Verificar que la obra exista
    const obra = await Obras.findByPk(id);
    if (!obra) {
      return res.status(404).json({ message: "Obra no encontrada." });
      
    }

    if (!obra.activo) {
      return res.status(404).json({ message: "Obra desactivada." });
    }

    // Verificar que el usuario autenticado es el dueño de la obra
    if (req.userData.userId !== obra.id_autor) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar esta obra." });
    }

    

    // Verificar si el usuario tiene una imagen
    if (!obra.imagen_url) {
      return res
        .status(400)
        .json({ message: "La obra no tiene una imagen." });
    }

    // Extraer el public_id desde la URL de Cloudinary
    const urlBase = "https://res.cloudinary.com/dunxdsecw/image/upload/";
    const publicIdWithExtension = obra.imagen_url.replace(urlBase, ""); // Quita la parte fija

    // Dividir por "/" y obtener el último segmento
    const parts = publicIdWithExtension.split("/");
    const lastPart = parts.slice(1).join("/"); // Combina desde "usuarios" en adelante
    const publicId = lastPart.split(".")[0]; // Elimina la extensión

    console.log(publicId); // Salida: "obra/g6ugbdwrtoz5eyk11gnv"
    // Eliminar la imagen en Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Actualizar la base de datos para eliminar la referencia de la imagen
    await Obras.update(
      { imagen_url: null }, // Eliminar la referencia de la imagen
      { where: { id_obra: id } }
    );

    res
      .status(200)
      .json({ message: "Imagen de la obra eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar la imagen de la obra:", error);
    res
      .status(500)
      .json({ message: "Hubo un error al eliminar la imagen de la obra." });
  }
};
//-----------------------------------------------------------------------------------------------------
const actualizarActivoF = async (req, res) => {
  const { id } = req.params; // ID de la obra
  const userId = req.userData.userId; // ID del usuario autenticado

  const admin = await Usuario.findByPk(userId);
  const userRole = admin.rol;
  
  try {
    // Verificar que la obra exista
    const obra = await Obras.findByPk(id);
    if (!obra) {
      return res.status(404).json({ message: "Obra no encontrada." });
      
    }

    // Verificar que el usuario autenticado es el dueño de la obra
    if (req.userData.userId !== obra.id_autor && userRole !== "administrador") {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar esta obra." });
    }
    
   

    // Verificar si ya está inactivo
    if (!obra.activo) {
      return res
        .status(400)
        .json({ message: "La obra ya está desactivada." });
    }

    // Actualizar el estado a inactivo
    await Obras.update(
      { activo: false }, // Establecer activo en falso
      { where: { id_obra: id } } // Condición: ID de la obra
    );

    res.status(200).json({ message: "La obra se desactivó correctamente." });
  } catch (error) {
    console.error("Error al desactivar la obra:", error);
    res.status(500).json({ message: "Hubo un error al desactivar la obra." });
  }
}; 


//----------------------------------------------------------------------------------------------
const actualizarActivoT = async (req, res) => {
  const { id } = req.params; // ID de la obra a activar
  const userId = req.userData.userId; // ID del usuario autenticado

  try {
    // Obtener el rol del usuario autenticado desde la base de datos
    const admin = await Usuario.findByPk(userId);
    const userRole = admin.rol;

    // Verificar que el usuario autenticado es un administrador
    if (userRole !== "administrador") {
      return res
        .status(403)
        .json({ message: "Solo los administradores pueden activar Obras." });
    }

    // Buscar al usuario en la base de datos
    const obra = await Obras.findByPk(id);
    if (!obra) {
      return res.status(404).json({ message: "Obra no encontrada." });
    }

    // Verificar si ya está activo
    if (obra.activo) {
      return res.status(400).json({ message: "La obra ya está activa." });
    }

    // Actualizar el estado a activo
    await Obras.update(
      { activo: true }, // Establecer activo en verdadero
      { where: { id_obra: id } } // Condición: ID de la obra
    );

    res.status(200).json({ message: "La obra se activó correctamente." });
  } catch (error) {
    console.error("Error al activar la obra:", error);
    res.status(500).json({ message: "Hubo un error al activar la obra." });
  }
};

  module.exports = {
    crearObra,obtenerObras,obtenerObrasEspecifica,actualizarDatos,actualizarImagen,eliminarImagen,actualizarActivoF,actualizarActivoT,
  };


