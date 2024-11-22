const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs"); // Para encriptar contraseñas

const jwt = require("jsonwebtoken"); // Para generar el token JWT

const { Op } = require("sequelize"); // Para operadores en la consulta

const cloudinary = require("../config/cloudinary"); // Configuración de Cloudinary

//------------------------------------------------------------------------------------------------

const crearUsuario = async (req, res) => {
  try {
    const {
      dni,
      nombre,
      nick,
      apellidos,
      email,
      password,
      telefono,
      direccion,
      rol,
      descripcion,
    } = req.body;
    console.log(req.body);
    // Validación básica
    if (!dni || !nombre || !nick || !email || !password) {
      return res.status(400).json({
        message: "Por favor, completa todos los campos obligatorios.",
      });
    }

    // Verificar si el usuario ya existe por email o nick
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({
        message: "Ya existe un usuario registrado con este email.",
      });
    }

    // Validación adicional: Si el rol es 'artista', la descripción es obligatoria
    if (rol === 'artista' && (!descripcion || descripcion.trim().length === 0)) {
      return res.status(400).json({
        message: "Los artistas deben proporcionar una descripción.",
      });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Subir la imagen a Cloudinary (si existe)
    let imagenUrl = null;

    if (req.files && req.files.imagen_perfil) {
      const file = req.files.imagen_perfil;

      try {
        // Subir la imagen a Cloudinary
        const resultado = await cloudinary.uploader.upload(file.tempFilePath, {
          folder: "usuarios",
        });
        imagenUrl = resultado.secure_url;
      } catch (cloudinaryError) {
        console.error("Error al subir la imagen a Cloudinary:", cloudinaryError);
        return res.status(500).json({
          message: "Hubo un error al subir la imagen de perfil.",
        });
      }
    }

    // Crear el usuario
    const nuevoUsuario = await Usuario.create({
      dni,
      nombre,
      nick,
      apellidos,
      email,
      password: hashedPassword, // Guardar la contraseña encriptada
      telefono,
      direccion,
      rol, // Si no se proporciona, Sequelize usará el valor por defecto
      descripcion, // Guardar la descripción si existe
      imagen_perfil: imagenUrl, // Guardar la URL de la imagen
    });

    // Respuesta exitosa
    res.status(201).json({
      message: "Usuario creado exitosamente.",
      usuario: {
        id_usuario: nuevoUsuario.id_usuario,
        nombre: nuevoUsuario.nombre,
        nick: nuevoUsuario.nick,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
        descripcion: nuevoUsuario.descripcion,
        imagen_perfil: nuevoUsuario.imagen_perfil,
      },
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ message: "Hubo un error al crear el usuario." });
  }
};
//--------------------------------------------------------------------------------------------------------------
const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validar que se envíen email y password
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Por favor, proporciona un email y una contraseña." });
    }

    // Buscar al usuario por email
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Comparar la contraseña encriptada
    const esPasswordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!esPasswordCorrecto) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    // Generar el token JWT
    const token = jwt.sign(
      { userId: usuario.id_usuario, email: usuario.email, rol: usuario.rol }, // Payload
      process.env.JWT_SECRET, // Clave secreta
      { expiresIn: "1h" } // Tiempo de expiración
    );

    // Responder con el token y los datos del usuario
    res.status(200).json({
      message: "Inicio de sesión exitoso.",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    res.status(500).json({ message: "Hubo un error al iniciar sesión." });
  }
};
//------------------------------------------------------------------------------------------------------

const obtenerArtistaPorId = async (req, res) => {
  const { id } = req.params; // ID del usuario que se quiere obtener

  try {
    // Buscar al usuario con rol artista
    const artista = await Usuario.findOne({
      where: { id_usuario: id, rol: 'artista' },
      attributes: ['id_usuario', 'nombre', 'nick', 'imagen_perfil', 'email','descripcion'], // Campos públicos
    });

    // Verificar si el artista existe
    if (!artista) {
      return res.status(404).json({ message: 'Artista no encontrado.' });
    }

    // Enviar los datos del artista
    res.status(200).json({ artista });
  } catch (error) {
    console.error('Error al obtener los datos del artista:', error);
    res.status(500).json({ message: 'Hubo un error al obtener los datos del artista.' });
  }
};


//------------------------------------------------------------------------------------------------------
const obtenerUsuarioPorId = async (req, res) => {
  const { id } = req.params; // ID del usuario que se quiere obtener
  const userId = req.userData.userId; // ID del usuario autenticado
  const admin = await Usuario.findByPk(userId);
  const userRole = admin.rol;

  try {
    // Verificar que el usuario autenticado es el propietario o administrador
    if (userId !== parseInt(id) && userRole !== 'administrador') {
      return res.status(403).json({ message: 'No tienes permiso para ver los datos de este usuario.' });
    }

    // Buscar al usuario en la base de datos por su ID
    const usuario = await Usuario.findByPk(id, {
      attributes: {
        exclude: ['password'], // Excluir el campo de la contraseña
      },
    });

    // Verificar si el usuario existe
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Enviar los datos del usuario
    res.status(200).json({ usuario });
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error);
    res.status(500).json({ message: 'Hubo un error al obtener los datos del usuario.' });
  }
};

//------------------------------------------------------------------------------------------------------
const obtenerUsuarios = async (req, res) => {
  try {
    // Obtener los filtros desde los parámetros de la solicitud
    const { rol, activo, nombre, nick, dni } = req.query;

    // Crear el filtro dinámico para la consulta
    const filtro = {};

    if (rol) {
      filtro.rol = rol; // Filtrar por rol si está presente
    }

    if (activo === "true") {
      filtro.activo = true; // Filtrar usuarios activos
    } else if (activo === "false") {
      filtro.activo = false; // Filtrar usuarios inactivos
    }

    if (nombre) {
      filtro.nombre = { [Op.like]: `${nombre}%` }; // Buscar que empiece con el valor proporcionado
    }

    if (nick) {
      filtro.nick = { [Op.like]: `${nick}%` }; // Buscar que empiece con el valor proporcionado
    }

    if (dni) {
      filtro.dni = { [Op.like]: `${dni}%` }; // Buscar que empiece con el valor proporcionado
    }

    // Consultar la base de datos con el filtro
    const usuarios = await Usuario.findAll({
      where: filtro, // Aplicar filtros dinámicos
      attributes: { exclude: ["password"] }, // Excluir el campo 'password'
    });

    // Responder con los usuarios encontrados
    res.status(200).json({ usuarios });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ message: "Hubo un error al obtener los usuarios." });
  }
};

//----------------------------------------------------------------------------------------------

const actualizarDatos = async (req, res) => {
  const { id } = req.params; // ID del usuario que se quiere actualizar
  const { nombre, apellidos, dni, nick, email, telefono, direccion } = req.body;

  try {
    // Verificar que el usuario autenticado es el dueño de los datos
    if (req.userData.userId !== parseInt(id)) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar estos datos." });
    }

    // Validar si el email ya está en uso
    const emailExistente = await Usuario.findOne({
      where: {
        email,
        id_usuario: { [Op.ne]: id }, // Excluir al propio usuario
      },
    });

    if (emailExistente) {
      return res
        .status(400)
        .json({ message: "El email ya está en uso por otro usuario." });
    }

    // Validar si el nick ya está en uso
    const nickExistente = await Usuario.findOne({
      where: {
        nick,
        id_usuario: { [Op.ne]: id }, // Excluir al propio usuario
      },
    });

    if (nickExistente) {
      return res
        .status(400)
        .json({ message: "El nick ya está en uso por otro usuario." });
    }

    // Validar si el DNI ya está en uso
    const dniExistente = await Usuario.findOne({
      where: {
        dni,
        id_usuario: { [Op.ne]: id }, // Excluir al propio usuario
      },
    });

    if (dniExistente) {
      return res
        .status(400)
        .json({ message: "El DNI ya está en uso por otro usuario." });
    }

    // Actualizar los datos del usuario
    await Usuario.update(
      { nombre, apellidos, dni, nick, email, telefono, direccion }, // Campos a actualizar
      { where: { id_usuario: id } } // Condición: ID del usuario
    );

    res.status(200).json({ message: "Datos actualizados correctamente." });
  } catch (error) {
    console.error("Error al actualizar datos:", error);
    res.status(500).json({ message: "Hubo un error al actualizar los datos." });
  }
};

//--------------------------------------------------------------------------------------

const actualizarContraseña = async (req, res) => {
  const { id } = req.params; // ID del usuario cuyo password se quiere actualizar
  const { contraseña_actual, nueva_contraseña } = req.body;

  try {
    // Verificar que el usuario autenticado es el dueño de los datos
    if (req.userData.userId !== parseInt(id)) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar esta contraseña." });
    }

    // Verificar que se proporcionaron ambas contraseñas
    if (!contraseña_actual || !nueva_contraseña) {
      return res
        .status(400)
        .json({
          message:
            "Por favor, proporciona la contraseña actual y la nueva contraseña.",
        });
    }

    // Obtener el usuario de la base de datos
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar que la contraseña actual coincida con la almacenada
    const esPasswordCorrecto = await bcrypt.compare(
      contraseña_actual,
      usuario.password
    );
    if (!esPasswordCorrecto) {
      return res
        .status(401)
        .json({ message: "La contraseña actual es incorrecta." });
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(nueva_contraseña, 10);

    // Actualizar la contraseña en la base de datos
    await Usuario.update(
      { password: hashedPassword }, // Campo a actualizar
      { where: { id_usuario: id } } // Condición: ID del usuario
    );

    res.status(200).json({ message: "Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    res
      .status(500)
      .json({ message: "Hubo un error al actualizar la contraseña." });
  }
};

//------------------------------------------------------------------------------------------
const actualizarImagen = async (req, res) => {
  const { id } = req.params; // ID del usuario

  try {
    // Verificar que el usuario autenticado es el dueño de los datos
    if (req.userData.userId !== parseInt(id)) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para modificar esta imagen." });
    }

    // Verificar que se subió una nueva imagen
    if (!req.files || !req.files.imagen_perfil) {
      return res.status(400).json({ message: "No se recibió ninguna imagen." });
    }

    // Obtener el usuario actual para recuperar la URL de la imagen
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Eliminar la imagen anterior de Cloudinary si existe
    if (usuario.imagen_perfil) {
      try {
       // Extraer el public_id desde la URL de Cloudinary
    const urlBase = "https://res.cloudinary.com/dunxdsecw/image/upload/";
    const publicIdWithExtension = usuario.imagen_perfil.replace(urlBase, ""); // Quita la parte fija

    // Dividir por "/" y obtener el último segmento
    const parts = publicIdWithExtension.split("/");
    const lastPart = parts.slice(1).join("/"); // Combina desde "usuarios" en adelante
    const publicId = lastPart.split(".")[0]; // Elimina la extensión

    console.log(publicId); // Salida: "usuarios/g6ugbdwrtoz5eyk11gnv"
    // Eliminar la imagen en Cloudinary
    await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error("Error al eliminar la imagen de Cloudinary:", cloudinaryError);
      }
    }

    // Subir la nueva imagen a Cloudinary
    const file = req.files.imagen_perfil; // Obtener la imagen del request
    const resultado = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "usuarios",
    });

    // Actualizar la base de datos con la nueva URL de la imagen
    await Usuario.update(
      { imagen_perfil: resultado.secure_url }, // Nuevo URL de la imagen
      { where: { id_usuario: id } } // Condición: ID del usuario
    );

    res.status(200).json({
      message: "Imagen actualizada correctamente.",
      imagen_perfil: resultado.secure_url,
    });
  } catch (error) {
    console.error("Error al actualizar la imagen de perfil:", error);
    res
      .status(500)
      .json({ message: "Hubo un error al actualizar la imagen de perfil." });
  }
};

//------------------------------------------------------------------------------------------------
const eliminarImagen = async (req, res) => {
  const { id } = req.params; // ID del usuario

  try {
    // Verificar que el usuario autenticado es el dueño de los datos
    if (req.userData.userId !== parseInt(id)) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta imagen." });
    }

    // Obtener el usuario actual para recuperar la URL de la imagen
    const usuario = await Usuario.findByPk(id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar si el usuario tiene una imagen
    if (!usuario.imagen_perfil) {
      return res
        .status(400)
        .json({ message: "El usuario no tiene una imagen de perfil." });
    }

    // Extraer el public_id desde la URL de Cloudinary
    const urlBase = "https://res.cloudinary.com/dunxdsecw/image/upload/";
    const publicIdWithExtension = usuario.imagen_perfil.replace(urlBase, ""); // Quita la parte fija

    // Dividir por "/" y obtener el último segmento
    const parts = publicIdWithExtension.split("/");
    const lastPart = parts.slice(1).join("/"); // Combina desde "usuarios" en adelante
    const publicId = lastPart.split(".")[0]; // Elimina la extensión

    console.log(publicId); // Salida: "usuarios/g6ugbdwrtoz5eyk11gnv"
    // Eliminar la imagen en Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Actualizar la base de datos para eliminar la referencia de la imagen
    await Usuario.update(
      { imagen_perfil: null }, // Eliminar la referencia de la imagen
      { where: { id_usuario: id } }
    );

    res
      .status(200)
      .json({ message: "Imagen de perfil eliminada correctamente." });
  } catch (error) {
    console.error("Error al eliminar la imagen de perfil:", error);
    res
      .status(500)
      .json({ message: "Hubo un error al eliminar la imagen de perfil." });
  }
};

//-----------------------------------------------------------------------------------------------------
const actualizarActivoF = async (req, res) => {
  const { id } = req.params; // ID del usuario
  const userId = req.userData.userId; // ID del usuario autenticado

  const admin = await Usuario.findByPk(userId);
  const userRole = admin.rol;
  
  try {
    // Verificar que el usuario autenticado es el propietario o administrador
    if (userId !== parseInt(id) && userRole !== "administrador") {
      return res
        .status(403)
        .json({ message: "No tienes permiso para desactivar esta cuenta." });
    }

    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar si ya está inactivo
    if (!usuario.activo) {
      return res
        .status(400)
        .json({ message: "La cuenta ya está desactivada." });
    }

    // Actualizar el estado a inactivo
    await Usuario.update(
      { activo: false }, // Establecer activo en falso
      { where: { id_usuario: id } } // Condición: ID del usuario
    );

    res.status(200).json({ message: "La cuenta se desactivó correctamente." });
  } catch (error) {
    console.error("Error al desactivar la cuenta:", error);
    res.status(500).json({ message: "Hubo un error al desactivar la cuenta." });
  }
};
//----------------------------------------------------------------------------------------------
const actualizarActivoT = async (req, res) => {
  const { id } = req.params; // ID del usuario a activar
  const userId = req.userData.userId; // ID del usuario autenticado

  try {
    // Obtener el rol del usuario autenticado desde la base de datos
    const admin = await Usuario.findByPk(userId);
    const userRole = admin.rol;

    // Verificar que el usuario autenticado es un administrador
    if (userRole !== "administrador") {
      return res
        .status(403)
        .json({ message: "Solo los administradores pueden activar cuentas." });
    }

    // Buscar al usuario en la base de datos
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Verificar si ya está activo
    if (usuario.activo) {
      return res.status(400).json({ message: "La cuenta ya está activa." });
    }

    // Actualizar el estado a activo
    await Usuario.update(
      { activo: true }, // Establecer activo en verdadero
      { where: { id_usuario: id } } // Condición: ID del usuario
    );

    res.status(200).json({ message: "La cuenta se activó correctamente." });
  } catch (error) {
    console.error("Error al activar la cuenta:", error);
    res.status(500).json({ message: "Hubo un error al activar la cuenta." });
  }
};

module.exports = {
  crearUsuario,
  loginUsuario,
  obtenerUsuarios,
  actualizarDatos,
  actualizarContraseña,
  actualizarImagen,
  eliminarImagen,
  actualizarActivoF,
  actualizarActivoT,
  obtenerUsuarioPorId,
  obtenerArtistaPorId,
};
