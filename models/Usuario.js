const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dni: {
    type: DataTypes.STRING(9),
    unique: true,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  nick: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  telefono: {
    type: DataTypes.STRING(15),
  },
  direccion: {
    type: DataTypes.STRING(255),
  },
  rol: {
    type: DataTypes.ENUM('usuario', 'artista', 'administrador'),
    defaultValue: 'usuario',
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  imagen_perfil: {
    type: DataTypes.STRING(255),
  },
});

module.exports = Usuario;
