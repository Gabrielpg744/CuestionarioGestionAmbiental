// Middleware de autenticación y permisos. Solo leen req.session.user
// (login.md §2): el día del SSO ese objeto se llenará desde el token y esto no
// cambia. El admin pasa cualquier verificación de rol.
//
// Roles de este sistema:
//   admin    — administra usuarios y ve resultados.
//   consulta — solo ve resultados.

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'No autenticado' });
  next();
}

function requireRol(...roles) {
  return (req, res, next) => {
    const u = req.session.user;
    if (!u) return res.status(401).json({ error: 'No autenticado' });
    if (u.rol === 'admin' || roles.includes(u.rol)) return next();
    return res.status(403).json({ error: 'Sin permiso para esta acción' });
  };
}

module.exports = { requireAuth, requireRol };
