# Arquitectura de autenticación y permisos del QMS — contrato de diseño

> **Para quién es este documento:** cualquier persona o sesión de Claude que
> construya o evolucione el **sistema de laboratorio** (o cualquier otro sistema
> del QMS). Léelo antes de tocar auth. La meta es que cada sistema se construya
> **desde hoy** listo para enchufarse a un login central, sin reescribir su
> lógica de permisos cuando ese día llegue.

---

## 0. Vocabulario (leer primero — es donde se confunde todo)

Tres niveles, de mayor a menor:

| Nivel | Qué es | ¿Tiene middleware + RBAC propios? | Ejemplos |
|---|---|---|---|
| **QMS** | El sistema grande que agrupa todo | — | el conjunto completo |
| **Sistema** | Una aplicación con su propia BD, su **middleware** y su **RBAC**. Habrá ~16–20. | **Sí, cada uno el suyo** | **lab** (este), y otros que vayan saliendo |
| **Módulo** | Una pantalla/función **dentro** de un sistema, bajo las reglas de ese sistema | No, usa el RBAC del sistema | dentro de lab: registro de espesores, test de cromado, planes, imprimir por OF, **inyección, ensamble, esmaltado, pegado, pintura…** |

**Punto clave:** los procesos como **inyección, ensamble, esmaltado, pegado,
pintura** son **MÓDULOS del sistema lab**, no sistemas aparte. Van bajo el **mismo
middleware y el mismo RBAC de lab**. No tienen su propio middleware ni aparecen
por separado en el token.

La unidad que tiene middleware + RBAC + entra al panel de permisos central es el
**SISTEMA**. Este repo (`lab`) **es un sistema**, y va creciendo agregando módulos.

---

## 1. El objetivo final

El QMS tendrá ~16–20 **sistemas** y unos pocos **administradores generales** que,
desde un panel central, dan de alta a una persona **una sola vez**:

> "Tú eres **esto** en el QMS."

O sea: el panel administra la relación **Usuario × Rol**, y ya. A qué sistemas
abre ese rol, y qué puede hacer **dentro** de cada uno, lo **deriva** el **RBAC
interno de cada sistema** con su tabla de equivalencia (§6), no el panel.

Esa es la diferencia con la versión anterior de este documento, que administraba
**Usuario × Sistema × Rol**: era más fino, pero obligaba a asignar a cada persona
en cada uno de los ~16 sistemas. El trabajo operativo se comía la ventaja.

| Concepto | Qué responde | Dónde vive en el QMS |
|---|---|---|
| **Autenticación (authN)** | *¿Quién eres?* | **Central** (el servicio `qms-login`) |
| **Autorización (authZ)** | *¿Qué puedes hacer en este sistema?* | **Local**, en cada sistema |

**Regla de oro:** la autenticación se centraliza; la autorización se queda en
cada sistema.

---

## 2. Principio que hace esto barato

En cada sistema, **toda la protección debe leer la identidad de un solo lugar**.
En lab ese lugar es `req.session.user`, y los middlewares `requireAuth` /
`requireRol` / `requireArea` (en `server/src/auth.js`) solo consultan ese objeto.

Si mañana ese objeto se llena **desde los claims de un JWT verificado** en vez de
una sesión local, **nada más cambia**. Se cambia la puerta, no la casa.

➡️ **Mandato:** nunca leas identidad/rol de otro lado que no sea `req.session.user`.
Nunca confíes en un rol que venga del cliente.

---

## 3. Los dos modos: `AUTH_MODE` (por sistema)

- **`AUTH_MODE=standalone`**: login local usuario+contraseña, sesión con cookie,
  contraseñas en la tabla `usuarios` del propio sistema.
- **`AUTH_MODE=sso`**: las personas, sus contraseñas y su rol viven en el **login
  central del QMS**. El sistema **conserva su pantalla de login**, en su propia
  URL, pero no valida nada él: le pregunta al central de servidor a servidor y
  guarda el token que le devuelve. Un middleware verifica ese token en cada
  petición y arma `req.session.user`.

En los dos modos la persona ve **la misma pantalla, en la misma dirección**. Es
una decisión explícita: nadie es redirigido a otro sitio para entrar, y la barra
de direcciones no cambia nunca. Lo único que cambia es contra quién valida el
servidor.

Migración **incremental**: se flipea sistema por sistema. `standalone` sigue
funcionando y es la red de seguridad si el central se cae.

---

## 4. El contrato del token

- **Firma: HS256 con un secreto compartido** (`QMS_JWT_SECRET`), el mismo en el
  login central y en cada sistema.
- **Un solo token para todo el QMS**, no uno por audiencia.
- **Transporte: una cookie del host** (`qms_token`, HttpOnly, SameSite=Lax). Las
  cookies ignoran el puerto, así que la que pone un sistema en :3000 viaja al de
  :3033 y al portal de :5190. **Eso es el inicio de sesión único**: no hay
  redirecciones, ni iframes, ni ventanas emergentes. La cabecera
  `Authorization: Bearer` se acepta como respaldo.

```jsonc
{
  "iss": "qms",
  "sub": "b1e15fa7-…",              // uuid ESTABLE de la persona; nunca se reutiliza
  "preferred_username": "kmendez",
  "name": "Karla Mendez",
  "email": "…@aludec.com",
  "role": "metrologia_admin",       // SU ÚNICO rol en todo el QMS
  "cambiar": false,                 // le toca cambiar la contraseña
  "iat": 1234567890,
  "exp": 1234596690                 // 8 h = un turno
}
```

Cada sistema valida `iss`, `exp` y la firma, y **traduce `role` con su propia
tabla** (§6). Sin traducción para ese rol → **403**.

### 4.1 Por qué HS256 y no RS256/JWKS (se venía de Keycloak)

La versión anterior de este documento decía lo contrario: RS256, llave pública
por JWKS, un token por audiencia, "nada de secreto compartido entre servicios".
Se cambió a conciencia, y el motivo es operativo: aquello obligaba a mantener un
**Keycloak** (realm que exportar y versionar, un client por sistema, roles por
client, su consola para dar de alta a cada persona). Para un QMS de ~16 sistemas
hechos por una sola persona, en una intranet, ese mantenimiento costaba más que
lo que protegía.

**Lo que se acepta a cambio:**

1. **Cualquier sistema con el secreto podría acuñar un token válido para otro.**
   Con RS256 solo el emisor firmaba. Se acepta porque todos los sistemas del QMS
   son del mismo autor y de la misma red. **Deja de ser aceptable** el día que
   uno de ellos corra código de terceros o se exponga fuera de la intranet.
2. **El token no está acotado a un destino.** Con un rol global no hay nada que
   acotar: el daño sigue contenido porque cada sistema niega por su tabla.
3. **Salida documentada:** si algún día hace falta, el central firma **RS256 con
   un PEM fijo** y cada sistema lleva solo la llave pública. Es el mismo diseño
   —cambia una línea en el que firma y otra en el que verifica— y sigue sin
   Keycloak.
4. **Todos los sistemas tienen que abrirse por el MISMO nombre de host.** La
   cookie es del host: entrar a uno por IP y a otro por nombre de red rompe el
   inicio de sesión único (cada uno pediría login por separado).

---

## 5. Identidad local y resolución (SIN write en el hot path)

**Problema:** en lab (y en cualquier sistema con trazabilidad de calidad) muchas
tablas tienen **FK a `usuarios(id)`**: `realizado_por`, `aprobado_por`,
`anulado_por`, `subida_por`. Eso es el audit trail IATF y no se puede tirar. El
`sub` del token **no es** un `usuarios.id` local.

**Solución — espejo con `external_id`, resuelto con caché y escritura solo si cambia:**

1. La **autorización** sale de los claims del **token verificado** — no necesita
   BD. La tabla `usuarios` local solo sirve para resolver el **`usuarios.id`** que
   usan los FK al **escribir** (atribuir quién hizo qué).
2. `usuarios` lleva una columna **`external_id`** (= el `sub` del login central), única. Es
   un **espejo**, no la verdad.
3. En el request, el middleware resuelve `sub → usuarios.id` desde una **caché en
   proceso** (`sub → { id, nombre, rol }`, TTL corto, p. ej. unos minutos). En modo
   `sso` el `rol` del espejo es **denormalizado/informativo** (reportes, UI): la
   authZ **siempre** sale del token (punto 1), nunca de esta tabla. Lo único que el
   espejo aporta de verdad downstream es el **`usuarios.id`** para los FK.
4. **Miss de caché:** un `SELECT … WHERE external_id = sub`.
   - No existe → **INSERT** (única vez, primer encuentro) y se cachea.
   - Existe pero el token trae nombre, rol o área **distintos** → **UPDATE** y se cachea.
   - Existe e igual → **no se escribe**.
5. **Nunca un write por request** para usuarios sin cambios. El caso común
   (usuario ya visto, sin cambios) es **cero BD o un SELECT cacheado**.

> ⚠️ **No hagas UPSERT por request.** El JIT corre una vez (primer encuentro o
> miss de caché); las escrituras ocurren solo en alta o cuando el central cambió el
> nombre, el rol o el área. Un write por hit es un cuello de botella inútil y desgaste para nada.

Un usuario que el central deshabilite **nunca se borra** del espejo: se marca
inactivo. Sus filas históricas siguen siendo **válidas y atribuibles** — justo lo
que pide la auditoría.

```
JWT.sub ─► caché ─(miss)─► SELECT external_id ─(alta/cambio)─► INSERT/UPDATE ─► usuarios.id ─► FK
```

---


## 6. Un rol global → el RBAC de cada sistema (tabla de equivalencia)

Cada persona tiene **UN rol para todo el QMS**. Cada sistema tiene, en un solo
archivo (`server/src/rolesSso.js`), la tabla que traduce ese rol a lo suyo. Ese
archivo es el ÚNICO lugar donde se traduce.

| `role` del token | lab (`rol` · área) | calibraciones (`rol` · área) |
|---|---|---|
| `admin` | `admin` | `admin` |
| `quimico_admin` | `admin_area` · Químico | — (403) |
| `quimico_user` | `usuario_area` · Químico | — (403) |
| `metrologia_admin` | `admin_area` · Metrología | `admin_area` · Metrología |
| `metrologia_user` | `usuario_area` · Metrología | `usuario_area` · Metrología |
| `ingenieria_user` | — (403) | `usuario_area` · Ingeniería |
| `calidad_user` | — (403) | `usuario_area` · Calidad |
| `produccion_user` | — (403) | `usuario_area` · Producción |
| `auditor` | `auditor` | `auditor` |
| `auditor_admin` | `auditor_admin` | `auditor` |
| `solicitante` | `solicitante` | — (403) |

**Esto es lo que hace que abrir un sistema abra el otro**: se da de alta a alguien
una vez, con un rol, y cada sistema deduce qué significa ese rol en su casa.
El catálogo de roles vive en `qms-login/server/src/roles.js`, junto con los
sistemas que abre cada uno (eso último solo pinta el portal; la seguridad la pone
cada sistema con su tabla).

**Trade aceptado:** no se puede ser admin en un sistema y auditor en otro. Es
justo lo que quita el trabajo operativo. El día que haga falta una excepción, se
resuelve con un rol nuevo en el catálogo —no con toggles por usuario dentro de
un sistema, que reintroducirían el hueco del JIT (§6.1).

### 6.1 El acceso a módulos se DERIVA del rol

Un usuario con `metrologia_admin` ve y usa exactamente lo que ese rol implica
**desde su primer ingreso (JIT)**, sin que nadie dentro del sistema tenga que
asignarle módulos. Así **no hay estado local de permisos que pueda faltar**.

- **¿"Este sí inyección, no ensamble"?** Se modela como **roles distintos en el
  catálogo central**, o con el grano de área que el sistema ya tiene — **no** como
  toggles locales por usuario.
- **Default sin rol para el sistema** = **deny (403)**.
- **Bootstrap resuelto:** el primer admin se otorga desde el panel central.

### 6.2 Qué administra el central y qué sigue administrando cada sistema

Con `AUTH_MODE=sso` la pantalla local de usuarios no desaparece: **se parte**. La
frontera no es "todo o nada", es **de quién es cada dato**:

| Del CENTRAL | De CADA SISTEMA |
|---|---|
| el alta y la baja | el correo al que **ese** sistema le escribe |
| `usuario`, `nombre` | el `cuack` de lab (a quién le suenan los botones) |
| el rol (y el área que se deriva de él) | el área de planta del solicitante en lab |
| la contraseña | cualquier otra preferencia que no sea identidad |

El criterio para saber de qué lado cae un dato es simple: **¿lo pisaría el espejo
en el siguiente ingreso?** Si el espejo lo escribe desde el token (nombre, rol,
área), editarlo en local es tirarlo a la basura y hay que impedirlo. Si no lo
toca nadie más que ese sistema, es suyo y se administra ahí.

`activo` cae del lado del central aunque el espejo no lo escriba, y conviene
saber por qué: en modo central **quien abre la puerta es el token**, así que dar
de baja a alguien en local no le impediría entrar. Sería un botón que miente.

Los servidores hacen cumplir el reparto con un 403 por campo —no basta con
esconder los controles—, y una petición que mezcle campos de los dos lados se
rechaza entera: nunca se guarda media edición.

**La contraseña es el caso especial, y merece leerse con cuidado.** El dato es
del central —una sola contraseña para todo el QMS—, pero **el botón de
reiniciarla vive en los dos sitios**: en el panel del QMS y en la pantalla de
usuarios de cada sistema, que es donde el administrador ya está mirando a esa
persona. El sistema no la cambia él: se la pide al central **reenviando la cookie
de quien pulsó**, así que el central decide con su propio criterio y quien no sea
administrador del QMS recibe un 403. Ningún sistema se hace pasar por nadie.

La contraseña temporal **la genera el central**, no la escribe el administrador
—si no, acaba siendo la misma para todos—, se enseña una sola vez para dictarla y
obliga a cambiarla al entrar (`cambiar` en el token, §4). Da igual dónde la
cambie: es una sola contraseña y vale para todo el QMS.

---

### 6.3 Excepciones por sistema

El rol global cubre el caso normal, pero no todo: a veces alguien tiene que ser
**otra cosa en un sistema concreto**, o no entrar a uno que su rol sí abriría.
Para eso el panel guarda **excepciones**, no asignaciones:

| Lo que se guarda | Qué significa |
|---|---|
| nada (lo normal) | manda su rol del QMS |
| `lab → auditor` | en lab entra como auditor, diga lo que diga su rol |
| `lab → null` | a lab no entra |

Es una tabla de excepciones **a propósito**: si fueran asignaciones habría que
declarar cada persona en cada uno de los ~16 sistemas, que es exactamente el
trabajo operativo por el que se dejó Keycloak (§1). Quien no tiene excepciones
—que es casi todo el mundo— se da de alta en una sola pantalla.

Las excepciones viajan **en el token**, en el claim `roles`, y solo las que
existan: un token sin excepciones no crece nada. Cada sistema resuelve así:

```js
const rolToken = SYSTEM_ID in (claims.roles || {})
  ? claims.roles[SYSTEM_ID]   // hay excepción; null = no entra
  : claims.role;              // no la hay: su rol del QMS
```

Se pregunta si la **clave existe**, no si tiene valor: un `null` ahí es una
decisión ("a este sistema no entra"), no una ausencia.

**Cuándo surte efecto:** cuando esa persona vuelva a entrar. Su token vive hasta
8 h y nadie consulta al central por petición (§7.1). Quitar un acceso en caliente
es cerrarle la sesión, no solo cambiar la fila.

**El panel solo ofrece, por sistema, los roles que ese sistema entiende** — los
que lo abren según `roles.js`. Asignar en lab un rol que lab no sabe traducir
daría un 403 con pinta de avería.

---

## 7. Las piezas (y las que ya no hay)

- **Login central (`qms-login`).** Un servicio Express + PostgreSQL de ~400
  líneas: valida contraseñas, firma el token, y trae el **panel de usuarios** que
  sustituye a la consola de Keycloak. Sirve además el **portal** (el lanzador
  FP01–FP16) por su mismo puerto, para que sea una sola cosa que arrancar.
- **El portal es OPCIONAL.** Es una puerta más, no la puerta. Se puede entrar por
  la URL de cualquier sistema y llegar igual de lejos.
- **Ya no hay:** Keycloak, realm que exportar, JWKS, `keycloak-js` en los
  clientes, `jwks-rsa` en los servidores, ni gateway delante de los sistemas.

### 7.1 Revocación (decisión explícita — la van a preguntar en auditoría)

Con JWT **stateless** no hay revocación inmediata: desactivar a alguien en el
panel surte efecto **cuando expire su token, como mucho 8 h** (un turno). Se
documenta como decisión, no se deja implícito. Si algún día calidad exigiera
corte inmediato: bajar `exp` a minutos y añadir refresco, o consultar el estado
de la persona en el central desde el espejo (una llamada por miss de caché).

---

## 8. Checklist para CADA sistema (que nazca compatible)

- [ ] Tabla `usuarios` local con columna **`external_id` única** (nullable para los
      usuarios locales de standalone).
- [ ] **Todos** los FK de "quién hizo qué" apuntan a `usuarios(id)`.
- [ ] La autorización lee **solo** de `req.session.user` (jamás del cliente).
- [ ] Un **`SYSTEM_ID` fijo** y un **único archivo** con la tabla de equivalencia
      rol_global → rol local (`server/src/rolesSso.js`).
- [ ] El arranque respeta `AUTH_MODE`. En `sso`: `cookie-parser`, middleware que
      verifica el token (HS256, `iss`, `exp`), resuelve `sub → usuarios.id` con
      **caché** y **escribe solo en alta/cambio** (§5).
- [ ] `/api/auth/login` y `/api/auth/logout` pasan **sin token**; el login
      reenvía las credenciales al central y pone la cookie.
- [ ] Sin rol para el sistema en el token → **403**, con el mensaje puesto.
- [ ] El acceso por módulo se **deriva del rol** (§6.1).
- [ ] En `sso`, la administración local de usuarios queda en **solo consulta**
      (§6.2), y el servidor lo hace cumplir.
- [ ] `QMS_JWT_SECRET` en el `.env`, **idéntico** al del central.

---

## 9. Estado de lab y de calibraciones

Los dos sistemas ya corren el contrato entero:

- `server/src/verificarJwt.js` — verifica HS256, lee la cookie del host (Bearer
  como respaldo) y arma `req.session.user`. Exporta además `sesionDesdeToken`,
  `ponerCookie` y `borrarCookie`: es el único archivo que conoce el token.
- `server/src/rolesSso.js` — `SYSTEM_ID` + la tabla de §6.
- `server/src/espejoUsuarios.js` — `sub → usuarios.id` con caché (TTL 5 min),
  adopción por `usuario` para las cuentas anteriores al central, INSERT solo al
  primer encuentro y UPDATE solo si cambió nombre, rol o área.
- `server/src/routes/authSso.js` — login (proxy al central + cookie), logout,
  `/me` y cambio de contraseña, todo sin salir de la URL del sistema.
- Cliente: la pantalla de login de siempre; ni tokens en memoria ni cabeceras.

Particular de **calibraciones**: el área dejó de administrarse en local y se
deriva del rol (§6), porque es la que decide qué etapa de una liberación firma
cada quien. Y la firma del **"Aprobó"** de una verificación vuelve a pedir usuario
y contraseña también en modo central —se comprueban contra el login del QMS—:
esa segunda persona delante del equipo es la razón de ser de esa firma.

---

## 10. En una frase

**Un login central propio + un middleware y un RBAC por sistema + un espejo de
usuario por `sub`.** Una persona, un rol, una contraseña; el token viaja en una
cookie del host, así que entrar a un sistema es entrar a todos, sin redirecciones
y sin que ninguna URL cambie. Cada sistema traduce ese rol a lo suyo con una
tabla fija y deja su propia traza.
