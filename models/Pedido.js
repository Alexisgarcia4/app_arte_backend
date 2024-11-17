const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./Usuario');

const Pedido = sequelize.define('Pedido', {
  id_pedido: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha_pedido: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'completado'),
    defaultValue: 'pendiente',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
});



module.exports = Pedido;
