import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "") + "/api";

export default function MisPedidos() {
  const { currentUser, token } = useShop();
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarHistorial = async () => {
      if (!currentUser) {
        setCargando(false);
        return;
      }

      const jwtToken = token || localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
      };

      try {
        setCargando(true);
        const [respPedidos, respPagos] = await Promise.all([
          fetch(`${API_URL}/pedidos`, { headers }),
          fetch(`${API_URL}/pagos`, { headers })
        ]);

        if (respPedidos.status === 401 || respPedidos.status === 403) {
          setError("Tu sesión expiró. Por favor, inicia sesión nuevamente.");
          setCargando(false);
          return;
        }

        const dataPedidos = respPedidos.ok ? await respPedidos.json() : [];
        const dataPagos = respPagos.ok ? await respPagos.json() : [];

        const userId = Number(currentUser.idUsuario ?? currentUser.id);
        const userEmail = (currentUser.email || "").toLowerCase();

        const misPedidos = dataPedidos.filter((p) => {
          const pUserId = Number(p.usuario?.id ?? p.usuario?.idUsuario ?? 0);
          const pEmail = (p.emailUsuario || p.usuario?.email || "").toLowerCase();
          return (userId && pUserId === userId) || (userEmail && pEmail === userEmail);
        });

        misPedidos.sort((a, b) => Number(b.idPedido) - Number(a.idPedido));

        setPedidos(misPedidos);
        setPagos(dataPagos);
      } catch (err) {
        console.error("Error cargando historial de pedidos:", err);
        setError("No se pudo conectar con el servidor para cargar tus pedidos.");
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [currentUser, token]);

  const obtenerPagoDePedido = (idPedido) => {
    return pagos.find((pg) => Number(pg.idPedido ?? pg.pedido?.idPedido) === Number(idPedido));
  };

  const badgeEstado = (estado) => {
    const est = (estado || "PENDIENTE").toUpperCase();
    if (est === "PAGADO" || est === "ENTREGADO") return "bg-success";
    if (est === "ENVIADO") return "bg-info text-dark";
    if (est === "CANCELADO" || est === "ANULADO") return "bg-danger";
    return "bg-warning text-dark";
  };

  if (!currentUser) {
    return (
      <div className="container py-5 text-center text-white">
        <div className="card bg-dark border-secondary p-5 mx-auto" style={{ maxWidth: "520px" }}>
          <h3 className="mb-3">Inicia sesión para ver tus pedidos</h3>
          <p className="text-secondary mb-4">
            Necesitas ingresar con tu cuenta GamerZone para revisar el estado de tus compras y comprobantes.
          </p>
          <Link to="/login" className="btn btn-primary fw-bold">
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 text-white">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Mis Pedidos</h2>
          <p className="text-secondary mb-0">
            Historial asociado a <span className="text-info">{currentUser.email}</span>
          </p>
        </div>
        <Link to="/productos" className="btn btn-outline-light">
          Seguir Comprando
        </Link>
      </div>

      {cargando && <div className="alert alert-info">Cargando tus pedidos desde GamerZone...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="card bg-dark border-secondary p-5 text-center">
          <h5 className="mb-2">Aún no tienes pedidos registrados</h5>
          <p className="text-secondary mb-4">Explora nuestro catálogo y realiza tu primera compra gamer.</p>
          <div>
            <Link to="/productos" className="btn btn-success fw-bold">
              Ver Catálogo
            </Link>
          </div>
        </div>
      )}

      {!cargando && pedidos.length > 0 && (
        <div className="row g-4">
          {pedidos.map((pedido) => {
            const pago = obtenerPagoDePedido(pedido.idPedido);
            return (
              <div className="col-12" key={pedido.idPedido}>
                <div className="card bg-dark text-white border-secondary shadow-sm">
                  <div className="card-header d-flex flex-wrap justify-content-between align-items-center border-secondary">
                    <div>
                      <span className="fw-bold fs-5 me-3">Pedido #{pedido.idPedido}</span>
                      <span className="text-secondary small">
                        {pedido.fechaPedido
                          ? new Date(pedido.fechaPedido).toLocaleString("es-CL")
                          : "Fecha registrada"}
                      </span>
                    </div>
                    <span className={`badge ${badgeEstado(pedido.estado)} fs-6`}>
                      {pedido.estado || "PENDIENTE"}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-5">
                        <p className="text-secondary small mb-1">Dirección de Despacho</p>
                        <p className="mb-0 fw-semibold">
                          {pedido.direccionDespacho || "Retiro / Sin dirección especificada"}
                        </p>
                      </div>

                      <div className="col-md-4">
                        <p className="text-secondary small mb-1">Comprobante de Pago</p>
                        {pago ? (
                          <div>
                            <span className="badge bg-secondary me-2">{pago.metodoPago}</span>
                            <span className="text-info fw-bold">
                              {pago.referenciaTransaccion || `PAGO-${pago.idPago}`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-warning small">Pago pendiente de confirmación</span>
                        )}
                      </div>

                      <div className="col-md-3 text-md-end">
                        <p className="text-secondary small mb-1">Total Pagado</p>
                        <h4 className="text-success fw-bold mb-0">
                          ${Number(pedido.total || 0).toLocaleString("es-CL")}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}