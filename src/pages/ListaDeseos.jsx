import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

const API_URL = "http://localhost:8080/api";

export default function ListaDeseos() {
  const { currentUser, productos, agregarAlCarritoGamer, rutaImagenProducto } = useShop();
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const storageKey = currentUser
    ? `gamer_wishlist_${currentUser.idUsuario ?? currentUser.id}`
    : "gamer_wishlist_guest";

  useEffect(() => {
    const cargarDeseos = async () => {
      setCargando(true);
      const localGuardados = JSON.parse(localStorage.getItem(storageKey) || "[]");

      if (!currentUser) {
        setFavoritos(localGuardados);
        setCargando(false);
        return;
      }

      try {
        const resp = await fetch(`${API_URL}/lista-deseos`);
        if (resp.ok) {
          const data = await resp.json();
          const userId = Number(currentUser.idUsuario ?? currentUser.id);
          const delUsuario = data.filter(
            (item) => Number(item.usuario?.id ?? item.usuario?.idUsuario) === userId
          );

          if (delUsuario.length > 0) {
            const mapeados = delUsuario.map((d) => ({
              idListaDeseos: d.idListaDeseos ?? d.id,
              ...(d.producto || {}),
              id: d.producto?.idProducto ?? d.producto?.id
            }));
            setFavoritos(mapeados);
            localStorage.setItem(storageKey, JSON.stringify(mapeados));
            setCargando(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Usando lista de deseos local:", err);
      }

      setFavoritos(localGuardados);
      setCargando(false);
    };

    cargarDeseos();
  }, [currentUser, storageKey]);

  const agregarFavorito = async (prod) => {
    const prodId = Number(prod.idProducto ?? prod.id);
    if (favoritos.some((f) => Number(f.idProducto ?? f.id) === prodId)) return;

    let nuevoItem = { ...prod, id: prodId };

    if (currentUser) {
      try {
        const userId = Number(currentUser.idUsuario ?? currentUser.id);
        const resp = await fetch(`${API_URL}/lista-deseos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: { id: userId },
            producto: { idProducto: prodId, id: prodId }
          })
        });
        if (resp.ok) {
          const creado = await resp.json();
          nuevoItem.idListaDeseos = creado.idListaDeseos ?? creado.id;
        }
      } catch (err) {
        console.error("Error guardando deseo en BD:", err);
      }
    }

    const actualizada = [...favoritos, nuevoItem];
    setFavoritos(actualizada);
    localStorage.setItem(storageKey, JSON.stringify(actualizada));
  };

  const eliminarFavorito = async (item) => {
    const prodId = Number(item.idProducto ?? item.id);

    if (currentUser && item.idListaDeseos) {
      try {
        await fetch(`${API_URL}/lista-deseos/${item.idListaDeseos}`, {
          method: "DELETE"
        });
      } catch (err) {
        console.error("Error eliminando deseo en BD:", err);
      }
    }

    const actualizada = favoritos.filter((f) => Number(f.idProducto ?? f.id) !== prodId);
    setFavoritos(actualizada);
    localStorage.setItem(storageKey, JSON.stringify(actualizada));
  };

  const sugerencias = productos.filter(
    (p) => !favoritos.some((f) => Number(f.idProducto ?? f.id) === Number(p.idProducto ?? p.id))
  );

  return (
    <div className="container py-5 text-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Mi Lista de Deseos</h2>
          <p className="text-secondary mb-0">
            Guarda tus próximos juegos y consolas favoritas para comprarlos cuando quieras.
          </p>
        </div>
        <Link to="/carrito" className="btn btn-outline-success">
          Ir al Carrito
        </Link>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando favoritos...</div>
      ) : favoritos.length === 0 ? (
        <div className="card bg-dark border-secondary p-4 text-center mb-5">
          <h5 className="mb-2">Tu lista de deseos está vacía</h5>
          <p className="text-secondary mb-0">
            Agrega productos desde la sección recomendada de abajo o desde el catálogo.
          </p>
        </div>
      ) : (
        <div className="row g-4 mb-5">
          {favoritos.map((item) => {
            const prodId = Number(item.idProducto ?? item.id);
            return (
              <div className="col-md-4" key={prodId}>
                <div className="card bg-dark text-white border-secondary h-100">
                  <img
                    src={rutaImagenProducto(item.imagen)}
                    alt={item.nombre}
                    className="card-img-top"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <div className="card-body d-flex flex-column">
                    <span className="badge bg-primary align-self-start mb-2">
                      {item.categoria || "Gamer"}
                    </span>
                    <h5 className="card-title">{item.nombre}</h5>
                    <p className="text-success fw-bold fs-5 mt-auto">
                      ${Number(item.precio || 0).toLocaleString("es-CL")}
                    </p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-success flex-grow-1 fw-bold"
                        onClick={() => agregarAlCarritoGamer(prodId)}
                        disabled={Number(item.stock) <= 0}
                      >
                        {Number(item.stock) > 0 ? "Mover al Carrito" : "Agotado"}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        onClick={() => eliminarFavorito(item)}
                        title="Quitar de deseos"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agregar rápido desde catálogo */}
      {sugerencias.length > 0 && (
        <div>
          <h4 className="fw-bold mb-3">Agregar productos a tu lista</h4>
          <div className="row g-3">
            {sugerencias.slice(0, 4).map((prod) => (
              <div className="col-md-3 col-sm-6" key={prod.id}>
                <div className="card bg-dark text-white border-secondary h-100">
                  <img
                    src={rutaImagenProducto(prod.imagen)}
                    alt={prod.nombre}
                    className="card-img-top"
                    style={{ height: "140px", objectFit: "cover" }}
                  />
                  <div className="card-body d-flex flex-column">
                    <h6 className="card-title">{prod.nombre}</h6>
                    <p className="text-success fw-bold mb-2">
                      ${Number(prod.precio).toLocaleString("es-CL")}
                    </p>
                    <button
                      className="btn btn-outline-info btn-sm mt-auto"
                      onClick={() => agregarFavorito(prod)}
                    >
                      + Añadir a Deseos
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}