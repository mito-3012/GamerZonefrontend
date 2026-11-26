import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useShop } from "../context/ShopContext";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "") + "/api";
const ESTADOS_PEDIDO = ["PENDIENTE", "PAGADO", "ENVIADO", "ENTREGADO", "CANCELADO"];

export default function AdminPedidos() {
  const { currentUser, token } = useShop();
  const [pedidos, setPedidos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  const getAuthHeaders = () => {
    const jwtToken = token || localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {})
    };
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const headers = getAuthHeaders();
      const [respPedidos, respPagos] = await Promise.all([
        fetch(`${API_URL}/pedidos`, { headers }),
        fetch(`${API_URL}/pagos`, { headers })
      ]);

      const dataPedidos = respPedidos.ok ? await respPedidos.json() : [];
      const dataPagos = respPagos.ok ? await respPagos.json() : [];

      dataPedidos.sort((a, b) => Number(b.idPedido) - Number(a.idPedido));
      setPedidos(dataPedidos);
      setPagos(dataPagos);
    } catch (error) {
      console.error("Error al cargar pedidos admin:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [token]);

  const cambiarEstadoPedido = async (pedido, nuevoEstado) => {
    try {
      const resp = await fetch(`${API_URL}/pedidos/${pedido.idPedido}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...pedido,
          estado: nuevoEstado
        })
      });

      if (!resp.ok) {
        alert("No se pudo actualizar el estado del pedido.");
        return;
      }

      setPedidos((prev) =>
        prev.map((p) => (p.idPedido === pedido.idPedido ? { ...p, estado: nuevoEstado } : p))
      );
    } catch (error) {
      console.error("Error actualizando pedido:", error);
      alert("Error de conexión al actualizar estado.");
    }
  };

  const obtenerPago = (idPedido) =>
    pagos.find((pg) => Number(pg.idPedido ?? pg.pedido?.idPedido) === Number(idPedido));

  const pedidosFiltrados = pedidos.filter((p) => {
    const coincideEstado =
      filtroEstado === "TODOS" || (p.estado || "").toUpperCase() === filtroEstado;
    const correo = (p.emailUsuario || p.usuario?.email || "").toLowerCase();
    const coincideBusqueda =
      !busqueda.trim() ||
      String(p.idPedido).includes(busqueda.trim()) ||
      correo.includes(busqueda.trim().toLowerCase());
    return coincideEstado && coincideBusqueda;
  });

  const totalVentas = pedidos
    .filter((p) => p.estado !== "CANCELADO")
    .reduce((acc, p) => acc + Number(p.total || 0), 0);

  const rolActual = (currentUser?.rol || "").toLowerCase();
  const esStaff = rolActual === "administrador" || rolActual === "vendedor";

  if (currentUser && !esStaff) {
    return (
      <div className="container py-5 text-center text-white">
        <div className="alert alert-danger">Acceso restringido: solo para administradores o vendedores.</div>
      </div>
    );
  }

  return (
    <div className="container py-5 text-white">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">Administración de Pedidos</h2>
          <p className="text-secondary mb-0">
            Total Pedidos: <strong>{pedidos.length}</strong> | Ingresos Brutos:{" "}
            <strong className="text-success">${totalVentas.toLocaleString("es-CL")}</strong>
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin-home" className="btn btn-outline-light">
            Volver al Panel
          </Link>
          <button className="btn btn-outline-info" onClick={cargarDatos}>
            Actualizar Lista
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control bg-dark text-white border-secondary"
            placeholder="Buscar por N° de pedido o correo del cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <select
            className="form-select bg-dark text-white border-secondary"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            {ESTADOS_PEDIDO.map((est) => (
              <option key={est} value={est}>
                {est}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando pedidos...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle border-secondary">
            <thead>
              <tr>
                <th># Pedido</th>
                <th>Cliente / Email</th>
                <th>Dirección Despacho</th>
                <th>Pago / Ref.</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-secondary py-4">
                    No se encontraron pedidos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((pedido) => {
                  const pago = obtenerPago(pedido.idPedido);
                  const emailCliente =
                    pedido.emailUsuario || pedido.usuario?.email || "Sin correo";
                  return (
                    <tr key={pedido.idPedido}>
                      <td className="fw-bold">#{pedido.idPedido}</td>
                      <td>
                        <div>{emailCliente}</div>
                        <small className="text-secondary">
                          ID Usuario: {pedido.usuario?.id ?? "N/A"}
                        </small>
                      </td>
                      <td>{pedido.direccionDespacho || "No especificada"}</td>
                      <td>
                        {pago ? (
                          <div>
                            <span className="badge bg-success me-1">{pago.metodoPago}</span>
                            <div className="small text-info">{pago.referenciaTransaccion}</div>
                          </div>
                        ) : (
                          <span className="badge bg-secondary">Sin pago</span>
                        )}
                      </td>
                      <td className="fw-bold text-success">
                        ${Number(pedido.total || 0).toLocaleString("es-CL")}
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm bg-dark text-white border-secondary"
                          value={pedido.estado || "PENDIENTE"}
                          onChange={(e) => cambiarEstadoPedido(pedido, e.target.value)}
                        >
                          {ESTADOS_PEDIDO.map((est) => (
                            <option key={est} value={est}>
                              {est}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}