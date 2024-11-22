const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Obras = require('./Obras');
/*
const Favoritos = sequelize.define('Favoritos', {
  fecha_agregado: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, { timestamps: false });

*/


const Favoritos = sequelize.define('Favoritos', {
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id_usuario',
    },
  },
  id_obra: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Obras,
      key: 'id_obra',
    },
  },
  fecha_agregado: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, { timestamps: false });

module.exports = Favoritos;