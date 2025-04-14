# 📊 Gastos API

Backend desarrollado en **NestJS + TypeORM** con base de datos **MySQL**, que sirve como motor de una aplicación de control de gastos personales. Permite gestionar usuarios, categorías de gasto, bancos, tarjetas de crédito/débito, cuotas y más.

---

## 🚀 Tecnologías utilizadas

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [MySQL](https://www.mysql.com/)
- [Swagger](https://swagger.io/) para documentación de API
- [JWT](https://jwt.io/) para autenticación
- Validación con `class-validator` y `class-transformer`

---

## 📁 Estructura del proyecto

```
src/
│
├── Auth/                      # Registro, login, JWT, guardias
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   ├── jwt-auth.guard.ts
│   ├── current-user.decorator.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
│
├── Banco/                     # CRUD de bancos
│   ├── banco.controller.ts
│   ├── banco.service.ts
│   ├── banco.entity.ts
│   └── dto/
│       ├── create-banco.dto.ts
│       └── banco-response.dto.ts
│
├── Categoria/                 # Categorías globales y de usuario
│   ├── categoria.controller.ts
│   ├── categoria.service.ts
│   ├── categoria.entity.ts
│   └── dto/
│       ├── create-categoria.dto.ts
│       ├── update-categoria.dto.ts
│       └── categoria-response.dto.ts
│
├── Cuota/                     # Cuotas de tarjeta de crédito
│   ├── cuota.controller.ts
│   ├── cuota.service.ts
│   ├── cuota.entity.ts
│   └── dto/
│       ├── create-cuota.dto.ts
│       ├── update-cuota.dto.ts
│       └── cuota-response.dto.ts
│
├── Gasto/                     # Registro de gastos
│   ├── gasto.controller.ts
│   ├── gasto.service.ts
│   ├── gasto.entity.ts
│   └── dto/
│       ├── create-gasto.dto.ts
│       └── gasto-response.dto.ts
│
├── TarjetaCredito/           # Tarjetas de crédito
│   ├── tarjeta-credito.controller.ts
│   ├── tarjeta-credito.service.ts
│   ├── tarjeta-credito.entity.ts
│   └── dto/
│       ├── create-tarjeta-credito.dto.ts
│       └── tarjeta-credito-response.dto.ts
│
├── TarjetaDebito/            # Tarjetas de débito
│   ├── tarjeta-debito.controller.ts
│   ├── tarjeta-debito.service.ts
│   ├── tarjeta-debito.entity.ts
│   └── dto/
│       ├── create-tarjeta-debito.dto.ts
│       └── tarjeta-debito-response.dto.ts
│
├── Usuario/                  # Gestión de usuarios
│   ├── usuario.controller.ts
│   ├── usuario.service.ts
│   ├── usuario.entity.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── usuario-response.dto.ts
│
├── app.module.ts             # Módulo principal
├── app.controller.ts
├── app.service.ts
└── main.ts                   # Punto de entrada
```

---

## ⚙️ Instalación y configuración

1. **Clonar el repositorio**

```bash
git clone https://github.com/alvaroAGomez/gastos-api.git
cd gastos-api
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Crear archivo `.env`**

Usá el siguiente `.env`:

```env
# Entorno
NODE_ENV=development

# Configuración de la base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=gastos_app

# Auth
JWT_SECRET=tu_clave_secreta_segura
JWT_EXPIRATION=1h

# Puerto de la app
PORT=3000
```

4. **Levantar el servidor**

```bash
npm run start:dev
```

---

## 🧪 Validaciones

- Validación global mediante `ValidationPipe`
- Rechazo de propiedades no permitidas (`whitelist`)
- Transformación automática de tipos (`transform: true`)
- Decoradores `@IsNotEmpty`, `@IsString`, `@IsOptional`, etc.
- Eliminación lógica con campo `deletedAt` (`@DeleteDateColumn()`)

---

## 🛡️ Autenticación

- Login y registro de usuarios
- Generación de tokens JWT
- Guardias protegidas con `JwtAuthGuard`
- Decorador personalizado `@CurrentUser()` para acceder al usuario logueado

---

## 📖 Documentación Swagger

Al ejecutar el servidor, accedé a:

```
http://localhost:3000/api/
```

Incluye botón para autenticarse con JWT y probar endpoints protegidos.

---

## 🧱 Convenciones y reglas de negocio

- Tablas y entidades con nombres en español
- Cuotas **solo** si el gasto está asociado a tarjeta de crédito (por defecto 1 cuota si no se especifica)
- No se permite asociar un gasto a tarjeta de crédito y débito al mismo tiempo
- Categorías pueden ser globales (`usuario = null`) o personalizadas por usuario

---

## 🗃️ Base de datos

Asegurate de tener MySQL instalado y creado el schema `gastos_app`. El sistema crea las tablas automáticamente en desarrollo (`synchronize: true`).

---

## 🔒 Seguridad

- Hasheo de contraseñas con `bcrypt`
- Tokens seguros con expiración configurable
- Endpoints protegidos por JWT

---

## 📌 Repositorio del Frontend

Complementá esta API con el frontend Angular disponible en:

🔗 [GastosApp - Frontend](https://github.com/alvaroAGomez/GastosApp)

---

## 👨‍💻 Autor

**Alvaro A. Gomez**  
📧 alvaro11122@gmail.com  
🔗 [GitHub](https://github.com/alvaroAGomez)
