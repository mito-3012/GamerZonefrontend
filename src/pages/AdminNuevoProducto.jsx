import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function AdminNuevoProducto() {
  const navigate = useNavigate();
  const { agregarProductoAdmin, logoutUser } = useShop();
  const [guardando, setGuardando] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    desc: '',
    price: '',
    stock: '',
    criticalStock: '',
    category: '',
    imagen: 'play5.jpg',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const cerrarSesionGamer = (e) => {
    e.preventDefault();
    logoutUser();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name || !formData.price || !formData.stock) {
      alert('Por favor completa los campos obligatorios: Código, Título, Precio y Stock.');
      return;
    }

    const nuevoProducto = {
      codigo: formData.code.trim(),
      nombre: formData.name.trim(),
      descripcion: formData.desc.trim(),
      precio: parseFloat(formData.price),
      stock: parseInt(formData.stock, 10),
      stockCritico: formData.criticalStock ? parseInt(formData.criticalStock, 10) : 5,
      imagen: formData.imagen || 'play5.jpg',
      categoriaNombre: formData.category || 'General'
    };

    setGuardando(true);
    const creado = await agregarProductoAdmin(nuevoProducto);
    setGuardando(false);

    if (creado) {
      navigate('/admin-productos');
    }
  };

  return (
    <div className="admin-body">
      <aside className="sidebar">
        <div className="sidebar-brand">⚡ ADMIN PANEL</div>
        <nav className="sidebar-nav">
          <Link to="/admin-home">📊 DASHBOARD</Link>
          <Link to="/admin-productos" className="active">🎮 INVENTARIO</Link>
          <Link to="/admin-pedidos">📦 PEDIDOS</Link>
          <Link to="/admin-usuarios">👥 USUARIOS</Link>
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
          REGISTRAR NUEVO JUEGO / PRODUCTO
        </h1>
        <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '1rem' }}>
          Ingresa los detalles del nuevo elemento para integrarlo al catálogo global en la base de datos.
        </p>

        <div className="form-card wide-card" style={{ marginTop: '25px' }}>
          <form id="product-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="code">CÓDIGO PRODUCTO (Mín. 3 carac. Ej: PS5-001)</label>
              <input
                type="text"
                id="code"
                className="form-control"
                placeholder="PS5-001"
                value={formData.code}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">TÍTULO DEL JUEGO / PRODUCTO (Máx 100)</label>
              <input
                type="text"
                id="name"
                className="form-control"
                placeholder="Ej: Grand Theft Auto VI"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="desc">SINOPSIS / DESCRIPCIÓN (Opcional - Máx 500)</label>
              <textarea
                id="desc"
                className="form-control"
                rows="4"
                placeholder="Descripción detallada del producto..."
                value={formData.desc}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">PRECIO ($ &gt;= 0)</label>
                <input
                  type="number"
                  id="price"
                  className="form-control"
                  step="1"
                  placeholder="59990"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="stock">STOCK (Entero &gt;= 0)</label>
                <input
                  type="number"
                  id="stock"
                  className="form-control"
                  placeholder="10"
                  value={formData.stock}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="criticalStock">STOCK CRÍTICO (Opcional)</label>
                <input
                  type="number"
                  id="criticalStock"
                  className="form-control"
                  placeholder="5"
                  value={formData.criticalStock}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">CATEGORÍA / PLATAFORMA</label>
                <select
                  id="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="PlayStation 5">PlayStation 5</option>
                  <option value="Xbox Series X">Xbox Series X</option>
                  <option value="Nintendo Switch">Nintendo Switch</option>
                  <option value="PC Gaming">PC Gaming</option>
                  <option value="Accesorios">Accesorios &amp; Periféricos</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="imagen">IMAGEN DEL CATÁLOGO</label>
                <select
                  id="imagen"
                  className="form-control"
                  value={formData.imagen}
                  onChange={handleChange}
                >
                  <option value="play5.jpg">play5.jpg</option>
                  <option value="switch2.jpg">switch2.jpg</option>
                  <option value="grandtheft.jpg">grandtheft.jpg</option>
                  <option value="mario.jpg">mario.jpg</option>
                  <option value="ac3nswchico.jpg">ac3nswchico.jpg</option>
                  <option value="1348.jpg">1348.jpg</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={guardando}>
              {guardando ? 'GUARDANDO EN BASE DE DATOS...' : 'GUARDAR JUEGO'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}