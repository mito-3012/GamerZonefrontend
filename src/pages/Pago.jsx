import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

const formatoCLP = (valor) =>
  Number(valor || 0).toLocaleString('es-CL');

export default function Pago({ usuario: usuarioProp, direccionDespacho: direccionProp }) {
  const shop = useShop();
  const { carrito = [], totalCarrito = 0, vaciarCarrito } = shop;

  // Resuelve el usuario desde props, contexto o localStorage (soporta id o idUsuario)
  const usuarioStorage = (() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch {
      return null;
    }
  })();

  const usuarioActual = usuarioProp || shop.usuario || usuarioStorage;
  const idUsuarioFinal = usuarioActual?.idUsuario ?? usuarioActual?.id ?? 1;

  const [direccion, setDireccion] = useState(
    direccionProp || usuarioActual?.direccion || ''
  );
  const [metodoPago, setMetodoPago] = useState('TARJETA_DEBITO');
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  // Estados para el simulador de tarjeta
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    titular: usuarioActual ? `${usuarioActual.nombre || ''} ${usuarioActual.apellido || ''}`.trim() : '',
    expiracion: '',
    cvv: ''
  });

  const esTarjeta = metodoPago === 'TARJETA_CREDITO' || metodoPago === 'TARJETA_DEBITO';
  const monto = Number(totalCarrito || 0);

  const handleTarjetaChange = (e) => {
    const { name, value } = e.target;
    setDatosTarjeta((prev) => ({ ...prev, [name]: value }));
  };

  // 1. Crea el pedido en el backend y recibe su ID generado
  const crearPedido = async () => {
    const response = await fetch(
      `${API_URL}/api/pedidos/crear-desde-carrito`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idUsuario: idUsuarioFinal,
          direccionDespacho: direccion.trim(),
          items: carrito.map((item) => ({
            idProducto: item.idProducto ?? item.id,
            cantidad: Number(item.cantidad)
          }))
        })
      }
    );

    const pedido = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        pedido.message ||
        pedido.detail ||
        pedido.error ||
        'No se pudo crear el pedido.'
      );
    }

    const idPedidoGenerado = pedido.idPedido ?? pedido.id;
    const totalGenerado = pedido.total ?? monto;

    if (!idPedidoGenerado) {
      throw new Error(
        'El backend no devolvió el ID del pedido.'
      );
    }

    return {
      ...pedido,
      idPedido: idPedidoGenerado,
      total: Number(totalGenerado)
    };
  };

  // 2. Registra el pago utilizando el pedido generado
  const registrarPago = async (pedido) => {
    const response = await fetch(`${API_URL}/api/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idPedido: pedido.idPedido,
        metodoPago,
        monto: Number(pedido.total),
        numeroTarjeta: esTarjeta ? datosTarjeta.numero.replace(/\s+/g, '') : null,
        titularTarjeta: esTarjeta ? datosTarjeta.titular : null
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.detail ||
        data.error ||
        'No fue posible registrar el pago.'
      );
    }

    return data;
  };

  const enviarPago = async (e) => {
    e.preventDefault();

    setError('');
    setResultado(null);

    if (!carrito.length || monto <= 0) {
      setError('Tu carrito está vacío. Agrega productos antes de continuar.');
      return;
    }

    if (!direccion.trim()) {
      setError('Por favor, ingresa una dirección de despacho.');
      return;
    }

    if (esTarjeta) {
      const numLimpio = datosTarjeta.numero.replace(/\s+/g, '');
      if (numLimpio.length < 13 || !datosTarjeta.titular.trim() || !datosTarjeta.expiracion.trim() || datosTarjeta.cvv.length < 3) {
        setError('Completa correctamente todos los datos de la tarjeta simulada.');
        return;
      }
    }

    setProcesando(true);

    try {
      // 1. Crear el pedido
      const pedido = await crearPedido();

      // 2. Registrar el pago con el ID generado
      const pago = await registrarPago(pedido);

      // 3. Vaciar carrito si la función existe en el contexto
      if (typeof vaciarCarrito === 'function') {
        vaciarCarrito();
      }

      // 4. Mostrar la confirmación
      setResultado({
        ...pago,
        idPedido: pedido.idPedido,
        monto: Number(pedido.total)
      });
    } catch (err) {
      setError(err.message || 'No se pudo conectar con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <main
      className="container"
      style={{
        maxWidth: 1120,
        margin: '32px auto',
        padding: 24
      }}
    >
      <h1 className="page-title">Pago</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(280px, 1fr)',
          gap: 24,
          alignItems: 'start'
        }}
      >
        <section className="cart-summary" style={{ padding: 24 }}>
          {resultado ? (
            <div role="status">
              <h2 style={{ color: '#198754' }}>
                Pago {resultado.estado || 'APROBADO'}
              </h2>

              <p>
                Pedido: <strong>#{resultado.idPedido}</strong>
              </p>

              <p>
                Monto:{' '}
                <strong>
                  ${formatoCLP(resultado.monto)} CLP
                </strong>
              </p>

              <p>Método: {resultado.metodoPago}</p>

              {resultado.referenciaTransaccion && (
                <p>
                  Referencia: <strong>{resultado.referenciaTransaccion}</strong>
                </p>
              )}

              <Link className="btn btn-primary" to="/productos">
                Volver a la tienda
              </Link>
            </div>
          ) : (
            <form
              onSubmit={enviarPago}
              style={{ display: 'grid', gap: 18 }}
            >
              <h2 style={{ margin: 0 }}>
                Datos de envío y método de pago
              </h2>

              <label style={{ display: 'grid', gap: 6 }}>
                <strong>Dirección de despacho</strong>
                <input
                  className="form-control"
                  type="text"
                  placeholder="Ej: Av. Concha y Toro 1340, Puente Alto"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  required
                />
              </label>

              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['TARJETA_DEBITO', 'Tarjeta de débito (Simulador)'],
                  ['TARJETA_CREDITO', 'Tarjeta de crédito (Simulador)'],
                  ['TRANSFERENCIA', 'Transferencia bancaria'],
                  ['EFECTIVO', 'Efectivo contra entrega']
                ].map(([value, label]) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      border:
                        metodoPago === value
                          ? '2px solid #0d6efd'
                          : '1px solid #dee2e6',
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value={value}
                      checked={metodoPago === value}
                      onChange={(e) => setMetodoPago(e.target.value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

              {/* --- SIMULADOR VISUAL DE TARJETA (Se abre automáticamente al elegir Débito o Crédito) --- */}
              {esTarjeta && (
                <div
                  style={{
                    border: '1px solid #ced4da',
                    borderRadius: 12,
                    padding: 20,
                    backgroundColor: '#f8f9fa',
                    display: 'grid',
                    gap: 14
                  }}
                >
                  {/* Tarjeta gráfica simulada */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #1a1f36 0%, #0d6efd 100%)',
                      color: '#fff',
                      borderRadius: 12,
                      padding: 20,
                      display: 'grid',
                      gap: 14,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, opacity: 0.9 }}>
                      <span>GAMERZONE PAY</span>
                      <span>{metodoPago === 'TARJETA_CREDITO' ? 'CRÉDITO' : 'DÉBITO'}</span>
                    </div>
                    <div style={{ fontSize: 20, letterSpacing: 2, fontFamily: 'monospace' }}>
                      {datosTarjeta.numero || '4532 •••• •••• 9012'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span>{(datosTarjeta.titular || 'NOMBRE DEL TITULAR').toUpperCase()}</span>
                      <span>{datosTarjeta.expiracion || 'MM/AA'}</span>
                    </div>
                  </div>

                  <label style={{ display: 'grid', gap: 4 }}>
                    <small>Número de tarjeta</small>
                    <input
                      className="form-control"
                      type="text"
                      name="numero"
                      maxLength="19"
                      placeholder="4532 1234 5678 9012"
                      value={datosTarjeta.numero}
                      onChange={handleTarjetaChange}
                      required
                    />
                  </label>

                  <label style={{ display: 'grid', gap: 4 }}>
                    <small>Nombre del titular</small>
                    <input
                      className="form-control"
                      type="text"
                      name="titular"
                      placeholder="Como aparece en la tarjeta"
                      value={datosTarjeta.titular}
                      onChange={handleTarjetaChange}
                      required
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ display: 'grid', gap: 4 }}>
                      <small>Vencimiento (MM/AA)</small>
                      <input
                        className="form-control"
                        type="text"
                        name="expiracion"
                        maxLength="5"
                        placeholder="08/29"
                        value={datosTarjeta.expiracion}
                        onChange={handleTarjetaChange}
                        required
                      />
                    </label>

                    <label style={{ display: 'grid', gap: 4 }}>
                      <small>Código CVV</small>
                      <input
                        className="form-control"
                        type="password"
                        name="cvv"
                        maxLength="4"
                        placeholder="123"
                        value={datosTarjeta.cvv}
                        onChange={handleTarjetaChange}
                        required
                      />
                    </label>
                  </div>
                </div>
              )}

              <label style={{ display: 'grid', gap: 8 }}>
                Monto a pagar (CLP)
                <input
                  className="form-control"
                  type="text"
                  value={`$${formatoCLP(monto)} CLP`}
                  readOnly
                  aria-readonly="true"
                />
                <small>
                  El monto se calcula automáticamente con el total actual del carrito.
                </small>
              </label>

              {error && (
                <p
                  role="alert"
                  style={{ color: '#dc3545', margin: 0, fontWeight: 500 }}
                >
                  {error}
                </p>
              )}

              <button
                className="btn btn-success btn-block"
                type="submit"
                disabled={procesando || monto <= 0}
              >
                {procesando ? 'Procesando pago...' : `Pagar $${formatoCLP(monto)} CLP`}
              </button>

              <small>
                Pago de demostración: no se realizan cobros bancarios reales.
              </small>
            </form>
          )}
        </section>

        <aside className="cart-summary" style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>
            Resumen de la compra
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 0',
              borderBottom: '1px solid #dee2e6'
            }}
          >
            <span>
              Productos (
              {carrito.reduce(
                (total, item) => total + Number(item.cantidad || 0),
                0
              )}
              )
            </span>

            <strong>${formatoCLP(monto)}</strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '14px 0'
            }}
          >
            <strong>Total</strong>
            <strong>${formatoCLP(monto)} CLP</strong>
          </div>

          <Link to="/carrito">
            Volver al carrito
          </Link>
        </aside>
      </div>
    </main>
  );
}