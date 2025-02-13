# APP_ARTE - Backend

Backend de la galería de arte en línea **APP_ARTE**.

## Tecnologías
- Node.js, Express, Sequelize, MySQL
- Cloudinary para almacenamiento de imágenes
- Autenticación con JWT

## Instalación
```bash
git clone https://github.com/usuario/APP_ARTE_BACKEND.git
cd APP_ARTE_BACKEND
npm install
cp .env.example .env  # Configurar credenciales
npm start
```
## Variables de Entorno
```bash
DB_NAME=xxx
DB_USER=xxx
DB_PASSWORD=xxx
DB_HOST=xxx
JWT_SECRET=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```
## Endpoints

- Usuarios: Registro, login, perfil
- Obras: CRUD de obras
- Pedidos: Gestión de pedidos
- Favoritos: Añadir/eliminar favoritos

## Autor
Alexis García García
