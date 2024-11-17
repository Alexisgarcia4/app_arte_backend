const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario'); // Para la relación

const Obras = sequelize.define('Obras', {
  id_obra: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  imagen_url: {
    type: DataTypes.STRING(255),
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'no disponible'),
    defaultValue: 'disponible',
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});



module.exports = Obras;
