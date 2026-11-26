import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const { usuarios, eliminarUsuarioAdmin, logoutUser, currentUser } = useShop();

  const cerrarSesionGamer = (e) => {
    e.preventDefault();
    logoutUser();
    navigate('/login');
  };

  const handleResetPassword = (nombre, run) => {
    const confirmar = window.confirm(`¿Estás seguro de que deseas resetear la contraseña de ${nombre}?`);
    if (confirmar) {
      alert(`✅ La contraseña de ${nombre} ha sido reseteada.\nSu nueva clave temporal es su RUN: ${run}`);
    }
  };

  const renderBadgeRol = (rol) => {
    const r = (rol || '').toLowerCase();
    if (r === 'administrador') {
      return <span className="badge badge-admin">Administrador</span>;
    }
    if (r === 'vendedor') {
      return (
        <span
          className="badge badge-warning"
          style={{ backgroundColor: '#ffc107', color: '#000', padding: '4px 8px', borderRadius: '4px' }}
        >
          Vendedor
        </span>
      );
    }
    return <span className="badge badge-client">Cliente</span>;
  };

  return (
    <div className="admin-body">
      <aside className="sidebar">
        <div className="sidebar-brand">⚡ ADMIN PANEL</div>
        <nav className="sidebar-nav">
          <Link to="/admin-home">📊 DASHBOARD</Link>
          <Link to="/admin-productos">🎮 INVENTARIO</Link>
          <Link to="/admin-pedidos">📦 PEDIDOS</Link>
          <Link to="/admin-usuarios" className="active">👥 USUARIOS</Link>
          <Link to="/">🛍️ IR A TIENDA</Link>
          <a
            href="#"
            onClick={cerrarSesionGamer}
            style={{ color: 'var(--primary-pink)', marginTop: '20px' }}
          >
            🚪 CERRAR SESIÓN
          </a>
        </nav>
      </aside>

      <main className="admin-content">
        <div
          className="admin-top-bar"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >
          <div>
            <h1 style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--primary-cyan)' }}>
              Mantenedor de Usuarios
            </h1>
            <p style={{ marginTop: '5px', color: 'var(--text-muted)', fontSize: '1rem' }}>
              Gestión e inspección de cuentas de usuario y roles del sistema en base de datos.
            </p>
          </div>
          <Link to="/admin-nuevo-usuario" className="btn btn-primary">
            + NUEVO USUARIO
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>RUN</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Contraseña</th>
                <th>Perfil</th>
                <th>Región / Comuna</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="admin-users-table">
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                usuarios.map((u, idx) => {
                  const nombreCompleto = `${u.nombre || ''} ${u.apellido || ''}`.trim();
                  const esMismoUsuario = currentUser?.email === u.email;
                  return (
                    <tr key={u.id || u.run || idx}>
                      <td>{u.run}</td>
                      <td>{nombreCompleto}</td>
                      <td>{u.email}</td>
                      <td style={{ letterSpacing: '2px' }}>********</td>
                      <td>{renderBadgeRol(u.rol)}</td>
                      <td>
                        {u.region || 'N/A'} / {u.comuna || 'N/A'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleResetPassword(nombreCompleto, u.run)}
                            style={{ backgroundColor: '#17a2b8' }}
                          >
                            🔑 Resetear Clave
                          </button>
                          {!esMismoUsuario && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => eliminarUsuarioAdmin(u.run)}
                              title="Eliminar usuario"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}