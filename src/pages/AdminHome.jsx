import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

export default function AdminHome() {
  const navigate = useNavigate();
  const { productos, cartCount, logoutUser, currentUser, token } = useShop();
  const [totalPedidos, setTotalPedidos] = useState(0);

  const esAdmin = (currentUser?.rol || '').toLowerCase() === 'administrador';

  useEffect(() => {
    const cargarPedidosDashboard = async () => {
      const jwtToken = token || localStorage.getItem('token');
      try {
        const respPedidos = await fetch(`${API_URL}/pedidos`, {
          headers: {
            'Content-Type': 'application/json',
            ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
          }
        });
        if (respPedidos.ok) {
          const dataPedidos = await respPedidos.json();
          setTotalPedidos(Array.isArray(dataPedidos) ? dataPedidos.length : 0);
        }
      } catch (err) {
        console.warn('No se pudo obtener el conteo de pedidos desde el backend:', err);
      }
    };

    cargarPedidosDashboard();
  }, [token]);

  const cerrarSesionGamer = (e) => {
    e.preventDefault();
    if (logoutUser) logoutUser();
    navigate('/login');
  };

  const totalProducts = productos.length;
  const lowStock = productos.filter((p) => Number(p.stock) < 10).length;

  return (
    <div className="admin-body">
      <aside className="sidebar">
        <div className="sidebar-brand">⚡ ADMIN PANEL</div>
        <nav className="sidebar-nav">
          <Link to="/admin-home" className="active">📊 DASHBOARD</Link>
          <Link to="/admin-productos">🎮 INVENTARIO</Link>
          <Link to="/admin-pedidos">📦 PEDIDOS</Link>
          {esAdmin && <Link to="/admin-usuarios">👥 USUARIOS</Link>}
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
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--primary-cyan)' }}>
          PANEL ADMINISTRATIVO GAMERZONE
        </h1>
        <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Bienvenido, <strong>{currentUser?.nombre}</strong> ({currentUser?.rol}). Resumen en tiempo real de la tienda.
        </p>

        {/* SECCIÓN 1: TARJETAS DEL DASHBOARD */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '20px',
            marginTop: '30px',
          }}
        >
          <div className="form-card" style={{ margin: 0, textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>TOTAL PRODUCTOS</h3>
            <p
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '2.5rem',
                color: 'var(--primary-cyan)',
                marginTop: '10px',
              }}
            >
              {totalProducts}
            </p>
          </div>

          <div className="form-card" style={{ margin: 0, textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              STOCK BAJO (&lt; 10 u.)
            </h3>
            <p
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '2.5rem',
                color: 'var(--primary-pink)',
                marginTop: '10px',
              }}
            >
              {lowStock}
            </p>
          </div>

          <div className="form-card" style={{ margin: 0, textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ITEMS EN CARRITOS</h3>
            <p
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '2.5rem',
                color: '#fff',
                marginTop: '10px',
              }}
            >
              {cartCount}
            </p>
          </div>

          <Link
            to="/admin-pedidos"
            className="form-card"
            style={{ margin: 0, textAlign: 'center', textDecoration: 'none' }}
          >
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>PEDIDOS REGISTRADOS</h3>
            <p
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '2.5rem',
                color: '#00ff88',
                marginTop: '10px',
              }}
            >
              {totalPedidos}
            </p>
          </Link>
        </div>

        {/* SECCIÓN 2: TABLA DE INVENTARIO */}
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--primary-cyan)', marginBottom: '20px' }}>
            📦 INVENTARIO ACTUAL
          </h2>
          
          {productos.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No hay productos registrados en el inventario.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--primary-cyan)' }}>
                    <th style={{ padding: '15px' }}>ID</th>
                    <th style={{ padding: '15px' }}>Nombre</th>
                    <th style={{ padding: '15px' }}>Precio</th>
                    <th style={{ padding: '15px' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((prod, index) => (
                    <tr key={prod.idProducto ?? prod.id ?? index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <td style={{ padding: '15px' }}>{prod.codigo || prod.idProducto || prod.id || index + 1}</td>
                      <td style={{ padding: '15px' }}>{prod.nombre || prod.titulo}</td>
                      <td style={{ padding: '15px' }}>${Number(prod.precio || 0).toLocaleString('es-CL')}</td>
                      <td style={{ 
                        padding: '15px', 
                        color: prod.stock < 10 ? 'var(--primary-pink)' : '#fff',
                        fontWeight: prod.stock < 10 ? 'bold' : 'normal'
                      }}>
                        {prod.stock} {prod.stock < 10 && '⚠️'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}