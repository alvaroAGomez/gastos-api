# 📊 API de Gastos Personales

API RESTful desarrollada con **NestJS**, **MySQL** y **TypeORM** para gestionar gastos personales, tarjetas (crédito y débito), cuotas, categorías y autenticación de usuarios mediante JWT.

---

## 📁 Estructura Actualizada del Proyecto

```
src/
├── Auth/
│   ├── dto/
│   │   ├── login.dto.ts
│   │   └── register.dto.ts
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── current-user.decorator.ts
│
├── Banco/
│   ├── banco.entity.ts
│   ├── banco.controller.ts
│   ├── banco.module.ts
│   └── banco.service.ts
│
├── CategoriaGasto/
│   ├── dto/
│   │   ├── create-categoria.dto.ts
│   │   ├── update-categoria.dto.ts
│   │   └── categoria-response.dto.ts
│   ├── categoria.entity.ts
│   ├── categoria.controller.ts
│   ├── categoria.module.ts
│   └── categoria.service.ts
│
├── Cuota/
│   ├── cuota.entity.ts
│   ├── cuota.controller.ts
│   ├── cuota.module.ts
│   └── cuota.service.ts
│
├── Gasto/
│   ├── gasto.entity.ts
│   ├── gasto.controller.ts
│   ├── gasto.module.ts
│   └── gasto.service.ts
│
├── TarjetaCredito/
│   ├── tarjeta-credito.entity.ts
│   ├── tarjeta-credito.controller.ts
│   ├── tarjeta-credito.module.ts
│   └── tarjeta-credito.service.ts
│
├── TarjetaDebito/
│   ├── tarjeta-debito.entity.ts
│   ├── tarjeta-debito.controller.ts
│   ├── tarjeta-debito.module.ts
│   └── tarjeta-debito.service.ts
│
├── Usuario/
│   ├── dto/
│   │   ├── create-usuario.dto.ts
│   │   └── usuario-response.dto.ts
│   ├── usuario.entity.ts
│   ├── usuario.controller.ts
│   ├── usuario.module.ts
│   └── usuario.service.ts
│
├── app.module.ts
└── main.ts
```

---

## 🚀 Tecnologías Utilizadas

- **NestJS**
- **TypeORM**
- **MySQL**
- **JWT (Passport)**
- **Swagger (OpenAPI)**
- **AutoMapper**
- **Class Validator & Class Transformer**

---

## ⚙️ Instalación y Ejecución

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/gastos-api.git
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Crear archivos de entorno:
   `.env.development` / `.env.production`

   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=123456
   DB_DATABASE=gastos_db
   JWT_SECRET=tu_clave_secreta
   ```

4. Ejecutar servidor (desarrollo):
   ```bash
   npm run start:dev
   ```

---

## 🔐 Autenticación JWT

- Registro (`POST /auth/register`)
- Login (`POST /auth/login`)
- Decorador personalizado `@CurrentUser()` para obtener usuario autenticado

---

## 🏦 Módulo de Bancos

- Administración básica de bancos (alta, listado, edición y baja).

---

## 📇 Módulo Tarjetas

- Gestión separada de tarjetas de **Crédito** y **Débito**.
- Soporte para límites, fechas de cierre y vencimiento en crédito.
- Saldo disponible en débito.

---

## 🗂️ Módulo Categorías de Gastos

- Categorías globales (disponibles para todos).
- Categorías personalizadas por usuario.
- Borrado lógico con `@DeleteDateColumn`.

---

## 💸 Módulo de Gastos

- Gastos generales con posibilidad de cuotas (solo crédito).
- Asociación con tarjetas y categorías.
- Control estricto de reglas de negocio (por ej.: cuotas solo para crédito).

---

## 📅 Módulo de Cuotas

- Gestión individual de cuotas de gastos en crédito.
- Seguimiento de pagos con estado `pagada` (true/false).

---

## 🧪 Documentación con Swagger

Accede a la documentación interactiva con:

```
http://localhost:3000/api
```

---

## 📌 Próximas Mejoras

- Dashboard de estadísticas.
- Exportar reportes CSV/Excel.
- Implementación de migraciones de base de datos para producción.

---

## 👨‍💻 Autor

Desarrollado por Alvaro Gomez.  
¡Si te sirvió, dejale una ⭐ al repo!
