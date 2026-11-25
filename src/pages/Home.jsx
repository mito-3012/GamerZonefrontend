import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

export default function Home() {
  const { currentUser, logoutUser, cartCount } = useShop();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert(`Suscrito al boletín con: ${newsletterEmail}`);
    setNewsletterEmail('');
  };

  return (
    <div>
      <header className="main-header">
        <div className="logo">
          <span className="logo-icon">🎮</span>
          <h1>GamerZone</h1>
        </div>

        <nav className="main-nav">
          <Link to="/" className="active">Home</Link>
          <Link to="/productos">Catálogo</Link>
          <Link to="/lista-deseos">Deseos</Link>
          <Link to="/mis-pedidos">Mis Pedidos</Link>
          <Link to="/nosotros">Nosotros</Link>
          <Link to="/blogs">Noticias</Link>
          <Link to="/contacto">Contacto</Link>
          {currentUser?.rol === 'Admin' && (
            <Link to="/admin-home" style={{ color: 'var(--primary-cyan)' }}>Admin</Link>
          )}
        </nav>

        <div className="header-right">
          {currentUser ? (
            <>
              <span style={{ marginRight: '8px' }}>👤 {currentUser.nombre || currentUser.email}</span>
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

      <main className="container">
        <section className="hero-banner">
          <div className="hero-text">
            <h2>TIENDA GAMER</h2>
            <p>
              Encuentra los lanzamientos más esperados, consolas de última generación y accesorios para llevar tu experiencia al siguiente nivel.
            </p>
            <Link to="/productos" className="btn btn-primary">Ver Catálogo</Link>
          </div>
          <div className="hero-image">
            <img src="/blog1.jpg" alt="Banner Gamer" />
          </div>
        </section>

        <section className="featured-product">
          <h3>Producto destacado</h3>
          <div className="product-card">
            <div className="img-box">
              <img src="/ac3nswchico.jpg" alt="Assassins Creed III" />
            </div>
            <h3 className="product-title">Nintendo Switch Assassins Creed III Remastered</h3>
            <div className="product-footer">
              <span className="attributes">Videojuego</span>
              <span className="price">$94.990</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="main-footer">
        <div className="footer-cols">
          <div>
            <h3>GamerZone</h3>
            <p>La mejor tienda de videojuegos y accesorios de Chile.</p>
          </div>
          <div>
            <h3>Plataformas</h3>
            <p>PlayStation 5 | Xbox Series X | Nintendo Switch | PC Gaming</p>
          </div>
          <div>
            <h3>Boletín Gamer</h3>
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                placeholder="Correo gamer..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Suscribir
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 GamerZone todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}