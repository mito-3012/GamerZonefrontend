import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080").replace(/\/$/, "") + "/api";

const METODOS = [
  { id: "TARJETA_CREDITO", label: "Tarjeta de crédito", requiereTarjeta: true },
  { id: "TARJETA_DEBITO", label: "Tarjeta de débito", requiereTarjeta: true },
  { id: "TRANSFERENCIA", label: "Transferencia bancaria", requiereTarjeta: false },
  { id: "EFECTIVO", label: "Efectivo", requiereTarjeta: false },
];

export default function Pago() {
  const { carrito, totalCarrito, vaciarCarrito, currentUser, token } = useShop();
  const navigate = useNavigate();

  const [metodo, setMetodo] = useState("TARJETA_DEBITO");
  const [numero, setNumero] = useState("");
  const [titular, setTitular] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [direccion, setDireccion] = useState("");
  const [referencia, setReferencia] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  const metodoSeleccionado = METODOS.find((m) => m.id === metodo);
  const monto = Number(totalCarrito || 0);

  useEffect(() => {
    if (currentUser && !titular) {
      setTitular((currentUser.nombre || "").toUpperCase());
    }
  }, [currentUser]);

  const getAuthHeaders = () => {
    const jwtToken = token || localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
    };
  };

  const formatearTarjeta = (valor) => {
    const digitos = valor.replace(/\D/g, "").slice(0, 16);
    return digitos.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatearVencimiento = (valor) => {
    const digitos = valor.replace(/\D/g, "").slice(0, 4);
    if (digitos.length <= 2) return digitos;
    return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  };

  const formatoCLP = (n) => new Intl.NumberFormat("es-CL").format(Number(n || 0));

  const validar = () => {
    const jwtToken = token || localStorage.getItem("token");
    if (!currentUser || !jwtToken) {
      return "Debes iniciar sesión antes de realizar una compra.";
    }
    if (!carrito || carrito.length === 0) {
      return "Tu carrito está vacío. Agrega productos antes de pagar.";
    }
    if (monto <= 0) {
      return "El monto a pagar debe ser mayor a $0.";
    }
    if (!direccion.trim()) {
      return "Ingresa una dirección de entrega para tu pedido.";
    }

    if (metodoSeleccionado?.requiereTarjeta) {
      const digitos = numero.replace(/\s/g, "");
      if (digitos.length !== 16) {
        return "El número de tarjeta debe tener 16 dígitos.";
      }
      if (!titular.trim()) {
        return "Ingresa el nombre del titular de la tarjeta.";
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento)) {
        return "Ingresa una fecha de vencimiento válida (MM/AA, ej: 10/29).";
      }
      if (cvv.length < 3) {
        return "El CVV debe tener 3 o 4 dígitos.";
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResultado(null);

    const errorValidacion = validar();
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setCargando(true);
    try {
      const idUsuario = Number(currentUser.idUsuario ?? currentUser.id);
      const headers = getAuthHeaders();

      // 1. Crear el pedido en el backend con token JWT
      const pedidoResp = await fetch(`${API_URL}/pedidos/crear-desde-carrito`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          idUsuario,
          direccionEntrega: direccion.trim(),
          items: carrito.map((item) => ({
            idProducto: Number(item.idProducto ?? item.id),
            cantidad: Number(item.cantidad),
          })),
        }),
      });

      if (!pedidoResp.ok) {
        const errData = await pedidoResp.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || `Error HTTP ${pedidoResp.status} al crear el pedido.`);
      }

      const pedidoCreado = await pedidoResp.json();
      const idPedidoReal = pedidoCreado.idPedido ?? pedidoCreado.id;

      // 2. Registrar y simular el pago asociado al pedido
      const digitos = numero.replace(/\s/g, "");
      const bodyPago = {
        idPedido: Number(idPedidoReal),
        metodo,
        monto,
        referencia: metodoSeleccionado?.requiereTarjeta
          ? `TARJETA ****${digitos.slice(-4)}`
          : referencia.trim() || "PAGO ONLINE",
      };

      const pagoResp = await fetch(`${API_URL}/pagos/simular`, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPago),
      });

      if (!pagoResp.ok) {
        const errPago = await pagoResp.json().catch(() => ({}));
        throw new Error(errPago.error || errPago.message || `Error HTTP ${pagoResp.status} al procesar el pago.`);
      }

      const dataPago = await pagoResp.json();
      setResultado({
        ...dataPago,
        idPedido: idPedidoReal,
      });

      if (dataPago.estado === "APROBADO" || pagoResp.status === 201) {
        vaciarCarrito();
      }
    } catch (err) {
      console.error("Error en checkout:", err);
      setError(err.message || "No se pudo realizar la compra.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff", padding: "32px 16px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Pago</h1>
          <Link to="/productos" style={{ color: "#19e6ff", textDecoration: "none", fontSize: 14 }}>
            ← Volver a la tienda
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
          <form onSubmit={handleSubmit}>
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Método de pago</h2>
              <p style={{ fontSize: 12, color: "#9aa0ac", marginBottom: 14 }}>
                Tu número de pedido se generará automáticamente al continuar.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {METODOS.map((m) => {
                  const activo = metodo === m.id;
                  return (
                    <label
                      key={m.id}
                      onClick={() => {
                        setMetodo(m.id);
                        setError(null);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 10,
                        border: activo ? "1.5px solid #19e6ff" : "1px solid #222634",
                        background: activo ? "#0b1a22" : "#0b0d14",
                        cursor: "pointer",
                      }}
                    >
                      <input type="radio" name="metodo" checked={activo} onChange={() => setMetodo(m.id)} style={{ accentColor: "#19e6ff" }} />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            {metodoSeleccionado?.requiereTarjeta ? (
              <div style={{ border: "1px solid #19e6ff", borderRadius: 14, padding: 20, marginBottom: 24, background: "#070b12" }}>
                <div style={{ fontSize: 13, color: "#19e6ff", fontWeight: 700, marginBottom: 16 }}>
                  Simulador de tarjeta
                </div>

                <div
                  style={{
                    background: "linear-gradient(135deg, #0b1623 0%, #102a38 100%)",
                    border: "1px solid #1e3f52",
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 18,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9aa0ac", marginBottom: 18 }}>
                    <span>{metodo === "TARJETA_CREDITO" ? "CRÉDITO" : "DÉBITO"}</span>
                    <span style={{ color: "#19e6ff", fontWeight: 700 }}>GAMERZONE PAY</span>
                  </div>
                  <div style={{ fontSize: 18, letterSpacing: 3, fontFamily: "monospace", marginBottom: 18 }}>
                    {numero || "•••• •••• •••• ••••"}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#c9d1d9" }}>
                    <span>{(titular || "NOMBRE DEL TITULAR").toUpperCase()}</span>
                    <span>{vencimiento || "MM/AA"}</span>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Número de tarjeta</label>
                  <input
                    type="text"
                    placeholder="4532 1234 5678 9010"
                    value={numero}
                    onChange={(e) => setNumero(formatearTarjeta(e.target.value))}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Nombre del titular</label>
                  <input
                    type="text"
                    placeholder="CAMILA GONZÁLEZ"
                    value={titular}
                    onChange={(e) => setTitular(e.target.value.toUpperCase())}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Vencimiento (MM/AA)</label>
                    <input
                      type="text"
                      placeholder="10/29"
                      value={vencimiento}
                      onChange={(e) => setVencimiento(formatearVencimiento(e.target.value))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ border: "1px solid #222634", borderRadius: 12, padding: 16, marginBottom: 24, background: "#0b0d14" }}>
                <label style={labelStyle}>Referencia / N° de comprobante (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: TRF-998811"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  style={inputStyle}
                />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Dirección de entrega</label>
              <input
                type="text"
                placeholder="Ej: Av. Vicuña Mackenna 4917, San Joaquín"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>Monto a pagar (CLP)</label>
              <input
                type="text"
                readOnly
                value={`$${formatoCLP(monto)} CLP`}
                style={{ ...inputStyle, color: "#19e6ff", fontWeight: 700, cursor: "not-allowed" }}
              />
              <small style={{ color: "#19e6ff", fontSize: 11 }}>
                El monto se calcula automáticamente con el total actual del carrito.
              </small>
            </div>

            {error && (
              <div style={{ color: "#ff5c7a", fontSize: 13, marginBottom: 12, fontWeight: 600 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                border: "none",
                background: "#ffffff",
                color: "#05060a",
                fontWeight: 700,
                fontSize: 14,
                cursor: cargando ? "wait" : "pointer",
                opacity: cargando ? 0.7 : 1,
              }}
            >
              {cargando ? "Procesando compra y pago..." : `Pagar $${formatoCLP(monto)} CLP`}
            </button>
          </form>

          <div>
            <div style={{ background: "#0b0d14", border: "1px solid #222634", borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0 }}>Resumen de la compra</h3>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#9aa0ac", marginBottom: 10 }}>
                <span>Productos ({carrito.reduce((a, i) => a + i.cantidad, 0)})</span>
                <span>${formatoCLP(monto)}</span>
              </div>

              <hr style={{ borderColor: "#222634", margin: "12px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14 }}>
                <span>Total</span>
                <span>${formatoCLP(monto)} CLP</span>
              </div>

              <div style={{ marginTop: 14 }}>
                <Link to="/carrito" style={{ color: "#9aa0ac", fontSize: 12, textDecoration: "none" }}>
                  Volver al carrito
                </Link>
              </div>
            </div>

            {resultado && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 12,
                  border: resultado.estado === "APROBADO" ? "1px solid #22c55e" : "1px solid #ef4444",
                  background: resultado.estado === "APROBADO" ? "#071f12" : "#220a0d",
                }}
              >
                <div style={{ fontWeight: 700, color: resultado.estado === "APROBADO" ? "#22c55e" : "#ef4444", marginBottom: 6 }}>
                  Pago {resultado.estado || "APROBADO"}
                </div>
                <div style={{ fontSize: 12, color: "#c9d1d9", lineHeight: 1.6 }}>
                  <div>Pedido N°: <strong>#{resultado.idPedido}</strong></div>
                  <div>ID Pago: <strong>#{resultado.idPago}</strong></div>
                  <div>Método: <strong>{resultado.metodo}</strong></div>
                  <div>Monto: <strong>${formatoCLP(resultado.monto)} CLP</strong></div>
                  {resultado.codigoAutorizacion && (
                    <div>Autorización: <strong>{resultado.codigoAutorizacion}</strong></div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <Link to="/mis-pedidos" style={{ color: "#19e6ff", fontWeight: 700 }}>
                      Ver mis pedidos →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "#19e6ff",
  fontWeight: 600,
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 8,
  border: "1px solid #252a3a",
  background: "#090c14",
  color: "#fff",
  fontSize: 13,
  boxSizing: "border-box",
};