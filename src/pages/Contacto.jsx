import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function Contacto() {
  const { currentUser, logoutUser, cartCount } = useShop();

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    comentario: '',
  });
  const [enviando, setEnviando] = useState(false);

  const rolActual = (currentUser?.rol || '').toLowerCase();
  const esStaff = rolActual === 'administrador' || rolActual === 'vendedor';

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        nombre: prev.nombre || currentUser.nombre || '',
        correo: prev.correo || currentUser.email || '',
      }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.correo.trim() || !formData.comentario.trim()) {
      alert('Por favor, completa todos los campos antes de enviar tu mensaje.');
      return;
    }

    if (!formData.correo.includes('@')) {
      alert('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    setEnviando(true);

    try {
      const historialContactos = JSON.parse(localStorage.getItem('gamer_contactos') || '[]');
      historialContactos.push({
        id: Date.now(),
        ...formData,
        fecha: new Date().toISOString(),
      });
      localStorage.setItem('gamer_contactos', JSON.stringify(historialContactos));

      alert('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo a la brevedad.');
      setFormData({
        nombre: currentUser?.nombre || '',
        correo: currentUser?.email || '',
        comentario: '',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div>
      <header className="main-header">
        <div className="logo">
          <span className="logo-icon">🎮</span>
          <h1>GamerZone</h1>
        </div>

        <nav className="main-nav">
          <Link to="/">Home</Link>
          <Link to="/productos">Catálogo</Link>
          {currentUser && <Link to="/lista-deseos">Deseos</Link>}
          {currentUser && <Link to="/mis-pedidos">Mis Pedidos</Link>}
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/blogs">Noticias</Link>
          <Link to="/contacto" className="active">Contacto</Link>
          {esStaff && (
            <Link to="/admin-home" style={{ color: 'var(--primary-cyan)', fontWeight: 'bold' }}>
              Panel Admin
            </Link>
          )}
        </nav>

        <div className="header-right">
          {currentUser ? (
            <>
              <span style={{ marginRight: '8px' }}>
                👤 {currentUser.nombre || currentUser.email}
              </span>
              <button
                type="button"
                onClick={logoutUser}
                className="btn-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-pink)' }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-link">Iniciar sesión</Link> |{' '}
              <Link to="/registro" className="btn-link">Registrarse</Link>
            </>
          )}
          <Link to="/carrito" className="cart-btn">
            🛒 Cart (<span id="cart-count">{cartCount}</span>)
          </Link>
        </div>
      </header>

      <main className="container flex-center">
        <div className="form-card">
          <div className="brand-box">
            <span className="logo-icon">🎮</span>
            <h2>GamerZone</h2>
          </div>
          <div className="card-header">CONTACTO GAMER</div>
          <form id="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="contact-name">NOMBRE COMPLETO</label>
              <input
                type="text"
                id="contact-name"
                name="nombre"
                className="form-control"
                autoComplete="name"
                placeholder="Tu nombre completo"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-email">CORREO</label>
              <input
                type="email"
                id="contact-email"
                name="correo"
                className="form-control"
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                value={formData.correo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-msg">MENSAJE / CONSULTA</label>
              <textarea
                id="contact-msg"
                name="comentario"
                className="form-control"
                rows="4"
                placeholder="Escribe aquí tu duda sobre productos, envíos o pedidos..."
                value={formData.comentario}
                onChange={handleChange}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn btn-outline btn-block"
              disabled={enviando}
            >
              {enviando ? 'ENVIANDO...' : 'ENVIAR CONSULTA'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}