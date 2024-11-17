const { Sequelize } = require('sequelize');
require('dotenv').config(); // Cargar variables de entorno
// Conexión a la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME, // Nombre de la base de datos
  process.env.DB_USER, // Usuario de la base de datos
  process.env.DB_PASSWORD, // Contraseña del usuario
  {
    host: process.env.DB_HOST, // Dirección del servidor
    dialect: 'mysql', // Tipo de base de datos
    logging: false, // Para no mostrar las consultas en consola
  }
);





module.exports = sequelize;
