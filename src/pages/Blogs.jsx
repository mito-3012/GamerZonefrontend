import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

export default function Blogs() {
  const { carrito = [] } = useShop();
  const [noticias, setNoticias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const totalItems = carrito.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );

  useEffect(() => {
    const cargarNoticias = async () => {
      try {
        const response = await fetch(`${API_URL}/api/noticias`);
        if (!response.ok) {
          throw new Error('No se pudieron cargar las noticias desde el servidor.');
        }
        const data = await response.json();
        setNoticias(data);
      } catch (err) {
        console.error('Error al obtener noticias:', err);
        setError(err.message || 'Error de conexión con la base de datos.');
      } finally {
        setCargando(false);
      }
    };

    cargarNoticias();
  }, []);

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
          <Link to="/blogs" className="active">Noticias</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>

        <div className="header-right">
          <Link to="/carrito" className="cart-btn">
            🛒 Cart (<span id="cart-count">{totalItems}</span>)
          </Link>
        </div>
      </header>

      <main className="container">
        <div className="breadcrumb">Home &gt; Noticias</div>

        <h1 style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--primary-cyan)' }}>
          Noticias Gamer
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: '10px 0 30px' }}>
          Mantente al día con las novedades, juegos y consejos del mundo gamer.
        </p>

        {cargando && (
          <p style={{ color: 'var(--text-muted)' }}>Cargando noticias desde la base de datos...</p>
        )}

        {error && (
          <p style={{ color: '#dc3545', fontWeight: 500 }}>{error}</p>
        )}

        {!cargando && !error && noticias.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>
            No hay noticias registradas en la base de datos aún.
          </p>
        )}

        <div className="blog-grid">
          {noticias.map((noticia) => (
            <article className="blog-card" key={noticia.id}>
              <img
                src={noticia.imagenUrl || '/blog-1.jpg'}
                alt={noticia.titulo}
                className="blog-img"
              />
              <div className="blog-card-content">
                <h2>{noticia.titulo}</h2>

                {/* Párrafos cargados desde la base de datos */}
                <p>{noticia.parrafoPrincipal}</p>

                {noticia.parrafoSecundario && (
                  <p style={{ marginTop: '8px' }}>
                    {noticia.parrafoSecundario}
                  </p>
                )}

                {/* Link externo cargado desde la base de datos */}
                {noticia.linkExterno && (
                  <a
                    href={noticia.linkExterno}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    {noticia.textoLink || 'Leer noticia'}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}