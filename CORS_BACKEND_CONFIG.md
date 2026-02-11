# 🔧 Configuración CORS en Backend

## Problema

El frontend en `http://localhost:5173` no puede conectar con el backend en `http://localhost:8080` por restricción CORS.

## Solución para Backend

El backend DEBE incluir CORS headers para autorizar solicitudes desde el frontend.

### Node.js / Express

```javascript
const cors = require('cors');

// Opción 1: Permitir todos los origenes (solo desarrollo)
app.use(cors());

// Opción 2: Permitir origen específico (RECOMENDADO)
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true // Para cookies HTTP-only
}));

// Opción 3: Configuración completa
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080'
    ];
    
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS error'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### NestJS

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(8080);
}
bootstrap();
```

### Express Middleware Manual

```javascript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

## Pasos

1. **Actualiza el código del backend** con una de las opciones anteriores
2. **Reinicia el backend**: `npm start` o `node server.js`
3. **Verifica que está corriendo**: `http://localhost:8080/api/v1/auth/register` (debe responder)
4. **Reinicia el frontend**: `npm run dev`
5. **Prueba el registro nuevamente**

## Verificación

Para verificar que CORS está configurado correctamente, abre DevTools (F12) → Console y ejecuta:

```javascript
fetch('http://localhost:8080/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => r.json())
.then(d => console.log('OK:', d))
.catch(e => console.error('ERROR:', e))
```

Si ves un error de CORS, el backend no está configurado correctamente.

## Troubleshooting

**Error: No 'Access-Control-Allow-Origin' header**
→ CORS no está habilitado en backend

**Error: 502 Bad Gateway**
→ Backend no está corriendo en puerto 8080

**Error: Connection refused**
→ Verifica que backend esté en `http://localhost:8080`

## Para Producción

En producción, usa la URL real del dominio:

```javascript
app.use(cors({
  origin: ['https://app.example.com', 'https://api.example.com'],
  credentials: true
}));
```
