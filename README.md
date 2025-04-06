# 📊 Gastos API

API RESTful desarrollada con **NestJS** para la gestión de gastos personales, tarjetas de crédito, categorías y autenticación de usuarios con JWT. Soporta categorías globales y por usuario, y está preparada para realizar operaciones CRUD con control de permisos y borrado lógico de entidades.

---

## 📁 Estructura del Proyecto

```
src/
├── Auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── current-user.decorator.ts
│   ├── jwt-auth.guard.ts
│   └── jwt.strategy.ts
│
├── Cards/
│   ├── cards.controller.ts
│   ├── cards.entity.ts
│   ├── cards.module.ts
│   └── cards.service.ts
│
├── Categories/
│   ├── dto/
│   │   └── category.entity.ts
│   │   └── category.profile.ts
│   ├── categorys.controller.ts
│   ├── categorys.module.ts
│   └── categorys.service.ts
│
├── Expenses/
│   ├── expenses.controller.ts
│   ├── expenses.entity.ts
│   ├── expenses.module.ts
│   └── expenses.service.ts
│
├── Users/
│   ├── dto/
│   │   └── create-user.dto.ts
│   ├── user.entity.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
│
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

---

## 🚀 Tecnologías

- **NestJS**
- **TypeORM**
- **JWT (Passport)**
- **MySQL**
- **Swagger (OpenAPI)**
- **Class Validator & Class Transformer**
- **AutoMapper**

---

## ⚙️ Configuración Inicial

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/gastos-api.git
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Crear los archivos de entorno:

   - `.env.development`
   - `.env.production`

   Ejemplo:

   ```env
   DB_HOST= localhost
   DB_PORT= port
   DB_USERNAME=root
   DB_PASSWORD=**********
   DB_DATABASE=DB
   JWT_SECRET=**********
   ```

4. Ejecutar migraciones (si corresponde) o sincronizar entidades:
   ```bash
   npm run start:dev
   ```

---

## 🔐 Autenticación

- Registro de usuarios
- Login con JWT
- Decorador `@CurrentUser()` para obtener el usuario autenticado

---

## 📂 Módulo de Categorías

- CRUD completo para categorías de usuario
- Soporte para categorías **globales** (sin usuario)
- Borrado lógico con `@DeleteDateColumn`
- Validación con DTOs y mapeo con AutoMapper

---

## 📇 Módulo de Tarjetas

- Alta de tarjetas con límite, tipo, fechas de cierre y vencimiento
- Organización por usuario
- Control total desde el backend

---

## 💰 Módulo de Gastos

- Registro de gastos
- Asociación con categorías
- Próximamente: filtros, reportes y estadísticas

---

## 📌 ToDo Futuro

- 🔒 Refuerzo de permisos con Guards personalizados
- 📈 Endpoint de estadísticas
- 🖥️ Panel de administración (opcional)
- 📆 Exportar CSV/Excel

---

## 🧑‍💻 Autor

Proyecto desarrollado por Alvaro Gomez  
Si te sirvió, ¡dejale una estrellita al repo ⭐!
