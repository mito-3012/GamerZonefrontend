import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, cartCount } = useShop();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      alert('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    const resultado = await loginUser(email, password);
    setCargando(false);

    if (resultado.success) {
      const rol = resultado.user.rol?.toLowerCase();
      alert(`¡Bienvenido ${resultado.user.nombre} (${resultado.user.rol})!`);

      if (rol === 'administrador' || rol === 'vendedor') {
        navigate('/admin-home');
      } else {
        navigate('/');
      }
    } else {
      alert(resultado.message || 'Correo o contraseña incorrectos. Inténtalo de nuevo.');
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
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/blogs">Noticias</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>

        <div className="header-right">
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
          <div className="card-header">INICIO DE SESIÓN</div>

          <form id="login-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="login-email">CORREO</label>
              <input
                type="email"
                id="login-email"
                name="email"
                className="form-control"
                placeholder="gonzalo@duoc.cl"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
              <span className="error-message" id="err-login-email"></span>
            </div>

            <div className="form-group">
              <label htmlFor="login-pass">CONTRASEÑA</label>
              <input
                type="password"
                id="login-pass"
                name="password"
                className="form-control"
                placeholder="Tu contraseña (Ej: RUN)"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
              />
              <span className="error-message" id="err-login-pass"></span>
            </div>

            <button type="submit" className="btn btn-outline btn-block" disabled={cargando}>
              {cargando ? 'INGRESANDO...' : 'INGRESAR'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}