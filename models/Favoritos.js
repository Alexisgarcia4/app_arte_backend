const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Obras = require('./Obras');

const Favoritos = sequelize.define('Favoritos', {
  fecha_agregado: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, { timestamps: false });



module.exports = Favoritos;
