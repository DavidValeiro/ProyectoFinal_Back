# MOUSIN — API (Backend)

API REST para la tienda de periféricos **MOUSIN**. Gestiona usuarios con autenticación
JWT, un catálogo de productos y pedidos que calculan su total y ajustan el stock
automáticamente.

El código de la aplicación vive en la carpeta [`back/`](./back).

## Tecnologías

| Categoría        | Tecnología                          |
| ---------------- | ----------------------------------- |
| Runtime          | Node.js (CommonJS)                  |
| Framework HTTP   | Express 5                           |
| Base de datos    | MongoDB (Atlas o local) + Mongoose  |
| Autenticación    | JSON Web Token (`jsonwebtoken`)     |
| Hash de claves   | `bcryptjs`                          |
| Configuración    | `dotenv`                            |
| CORS             | `cors`                              |
| Despliegue       | Vercel (Serverless Functions)       |

## Estructura del proyecto

```
back/
├── api/
│   └── index.js              # Punto de entrada para Vercel (reexporta la app)
├── config/
│   └── db.js                 # Conexión a MongoDB con Mongoose
├── controllers/
│   ├── users-controllers.js
│   ├── products-controllers.js
│   └── orders-controllers.js
├── middlewares/
│   ├── not-found.js          # 404 para rutas inexistentes
│   └── error-handler.js      # 500 para errores inesperados
├── models/
│   ├── user.js
│   ├── product.js
│   └── order.js
├── routes/
│   ├── users.js
│   ├── products.js
│   └── orders.js
├── api.http                  # Log de pruebas de la API (REST Client)
├── index.js                  # Arranque del servidor Express
├── vercel.json               # Rewrites para el despliegue en Vercel
└── .env.example              # Variables de entorno de ejemplo
```

## Arquitectura

Cada petición pasa por Express, enruta al controlador correspondiente y este
trabaja con los modelos de Mongoose sobre MongoDB.

```mermaid
flowchart TD
    Client["Cliente / SPA React"] -->|"HTTP JSON (CORS)"| App["App Express 5"]

    App --> MW["middlewares globales<br/>cors + express.json"]
    MW --> Router{"Enrutador"}

    Router -->|"/users"| UR["routes/users.js"]
    Router -->|"/products"| PR["routes/products.js"]
    Router -->|"/orders"| OR["routes/orders.js"]

    UR --> UC["users-controllers"]
    PR --> PC["products-controllers"]
    OR --> OC["orders-controllers"]

    UC --> Models["Modelos Mongoose"]
    PC --> Models
    OC --> Models
    Models -->|"consultas"| DB[("MongoDB")]

    App -.->|"sin coincidencia"| NF["not-found (404)"]
    App -.->|"error no capturado"| EH["error-handler (500)"]
```

## Modelo de datos

Un **usuario** realiza varios **pedidos**; cada pedido contiene líneas que
referencian **productos**.

```mermaid
erDiagram
    USER ||--o{ ORDER : "realiza"
    ORDER ||--o{ ORDER_ITEM : "contiene"
    PRODUCT ||--o{ ORDER_ITEM : "referenciado en"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password "hash bcrypt"
        boolean is_admin
        date createdAt
        date updatedAt
    }

    PRODUCT {
        ObjectId _id PK
        string title
        string subtitle
        number price
        number compareAtPrice
        string badge
        string category
        string description
        number rating
        number reviews
        number stock
        array specs "icon, label, value"
        string image
        array images
        date createdAt
        date updatedAt
    }

    ORDER {
        ObjectId _id PK
        ObjectId user FK
        number totalPrice
        string orderStatus "Pending | Shipped | Delivered | Cancelled"
        date createdAt
        date updatedAt
    }

    ORDER_ITEM {
        ObjectId product FK
        number quantity
    }
```

## Endpoints

Base local: `http://localhost:3000`

### Usuarios

| Método | Ruta             | Descripción                                   | Estado |
| ------ | ---------------- | --------------------------------------------- | ------ |
| POST   | `/users`         | Crea un usuario (hash de la contraseña)       | 201    |
| POST   | `/users/login`   | Inicia sesión y devuelve un JWT (válido 1 h)  | 200    |
| GET    | `/users`         | Lista usuarios (sin contraseña)               | 200    |
| GET    | `/users/:id`     | Obtiene un usuario por id                     | 200    |
| PUT    | `/users/:id`     | Actualiza un usuario (re-hash si hay clave)   | 200    |
| DELETE | `/users/:id`     | Elimina un usuario                            | 200    |

### Productos

| Método | Ruta              | Descripción                     | Estado |
| ------ | ----------------- | ------------------------------- | ------ |
| POST   | `/products`       | Crea un producto                | 201    |
| GET    | `/products`       | Lista el catálogo completo      | 200    |
| GET    | `/products/:id`   | Obtiene un producto por id      | 200    |
| PUT    | `/products/:id`   | Actualiza un producto           | 200    |
| DELETE | `/products/:id`   | Elimina un producto             | 200    |

### Pedidos

| Método | Ruta            | Descripción                                                        | Estado |
| ------ | --------------- | ------------------------------------------------------------------ | ------ |
| POST   | `/orders`       | Crea un pedido: calcula `totalPrice` y descuenta stock             | 201    |
| GET    | `/orders`       | Lista pedidos (usuario y productos "populados")                    | 200    |
| GET    | `/orders/:id`   | Obtiene un pedido por id                                           | 200    |
| PUT    | `/orders/:id`   | Actualiza el pedido: devuelve el stock anterior y descuenta el nuevo | 201 |
| DELETE | `/orders/:id`   | Elimina el pedido y devuelve el stock                              | 200    |

> El fichero [`back/api.http`](./back/api.http) contiene un log real de 19
> peticiones de prueba con sus respuestas (incluidos casos de error).

## Lógica de negocio

- **Autenticación**: la contraseña se guarda con `bcrypt` (10 rondas). El login
  compara el hash y firma un JWT con `{ id, email, is_admin }` y caducidad de 1 hora.
- **Stock en pedidos**:
  - Al **crear** un pedido se descuenta la cantidad pedida de cada producto.
  - Al **actualizar** un pedido se devuelve el stock del pedido anterior y se
    descuenta el del nuevo (evita pérdidas dobles).
  - Al **eliminar** un pedido se devuelve todo el stock comprometido.
- **Errores**: rutas no existentes → `404 { "message": "Route not found" }`;
  errores no capturados → `500` con el mensaje del error.

## Variables de entorno

Copia [`back/.env.example`](./back/.env.example) a `back/.env` y ajusta los valores:

```env
PORT=3000
MONGODB_URI=mongodb://usuario:contraseña@host:27017/mousin?retryWrites=true&w=majority
JWT_SECRET=cambia_esta_clave_por_una_segura
```

| Variable      | Descripción                                        |
| ------------- | -------------------------------------------------- |
| `PORT`        | Puerto local del servidor (por defecto `3000`).    |
| `MONGODB_URI` | Cadena de conexión de MongoDB (Atlas o local).     |
| `JWT_SECRET`  | Clave secreta para firmar los tokens JWT.          |

## Puesta en marcha

```bash
# Dentro de back/
npm install
cp .env.example .env      # y edita los valores
node index.js             # servidor en http://localhost:3000
```

Comprueba el estado con `GET /`, que responde `Welcome to the MOUSIN API`.

## Despliegue

Incluye [`vercel.json`](./back/vercel.json) con un rewrite que envía todas las
rutas a `/api`, y [`api/index.js`](./back/api/index.js) exporta la app Express
como Serverless Function. Basta con definir las variables de entorno en Vercel.
