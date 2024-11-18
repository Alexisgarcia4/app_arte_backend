require('dotenv').config(); // Cargar variables de entorno
const express = require('express');
const sequelize = require('./config/database'); // Conexión a la base de datos
const setupAssociations = require('./models/relations'); // Configuración de relaciones

// Importar modelos (sin relaciones, solo definición)
require('./models/Usuario');
require('./models/Obras');
require('./models/Pedido');
require('./models/Detalle_Pedido');
require('./models/Favoritos');

const app = express();
const port = process.env.PORT || 3000;

// Middleware para manejar JSON y formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de ejemplo
app.get('/', (req, res) => {
  res.send('¡Bienvenido a mi API!');
});

const usuarioRoutes = require('./routes/usuarios'); // Importar rutas de usuario

app.use('/api/usuarios', usuarioRoutes); // Registrar rutas bajo el prefijo /api/usuarios

const obrasRoutes = require('./routes/obras'); // Importar rutas de usuario

app.use('/api/obras', obrasRoutes); // Registrar rutas bajo el prefijo /api/usuarios


// Configurar relaciones entre modelos
setupAssociations();



(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión con la base de datos establecida con éxito.');

    await sequelize.sync(); // Evitar alteraciones automáticas en producción
    console.log('✅ Modelos y relaciones sincronizados con la base de datos.');
  } catch (error) {
    console.error('❌ Error al sincronizar modelos:', error.message);
    process.exit(1); // Salir si no se puede conectar a la base de datos
  }
})();

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
