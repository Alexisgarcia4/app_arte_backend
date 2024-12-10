const { Sequelize } = require('sequelize');
require('dotenv').config(); // Cargar variables de entorno
//LOCAL
/* 
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
*/
// Usar la URL de conexión desde las variables de entorno PRODUCCION
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql', // Especificar el dialecto
  logging: false, // Desactivar logs de las consultas SQL
});





module.exports = sequelize;
