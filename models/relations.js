const Usuario = require('./Usuario');
const Obras = require('./Obras');
const Pedido = require('./Pedido');
const Detalle_Pedido = require('./Detalle_Pedido');
const Favoritos = require('./Favoritos');

const setupAssociations = () => {
  // Relación: Usuario y Obras
  Obras.belongsTo(Usuario, { foreignKey: 'id_autor' });
  Usuario.hasMany(Obras, { foreignKey: 'id_autor' });

  // Relación: Usuario y Pedido
  Pedido.belongsTo(Usuario, { foreignKey: 'id_usuario' });
  Usuario.hasMany(Pedido, { foreignKey: 'id_usuario' });

  // Relación: Pedido y Detalle_Pedido
  Detalle_Pedido.belongsTo(Pedido, { foreignKey: 'id_pedido' });
  Pedido.hasMany(Detalle_Pedido, { foreignKey: 'id_pedido' });

  // Relación: Obras y Detalle_Pedido
  Detalle_Pedido.belongsTo(Obras, { foreignKey: 'id_obra' });
  Obras.hasMany(Detalle_Pedido, { foreignKey: 'id_obra' });

  // Relación: Usuario y Favoritos
  Favoritos.belongsTo(Usuario, { foreignKey: 'id_usuario' });
  Usuario.hasMany(Favoritos, { foreignKey: 'id_usuario' });

  // Relación: Obras y Favoritos
  Favoritos.belongsTo(Obras, { foreignKey: 'id_obra' });
  Obras.hasMany(Favoritos, { foreignKey: 'id_obra' });
};

module.exports = setupAssociations;
