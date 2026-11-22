
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

const formatoCLP = (valor) =>
  Number(valor || 0).toLocaleString('es-CL');

export default function Pago({ usuario, direccionDespacho }) {
  const { carrito, totalCarrito } = useShop();

  const [metodoPago, setMetodoPago] = useState('TARJETA_DEBITO');
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const monto = Number(totalCarrito || 0);

  // Crea el pedido en el backend y recibe su ID generado por MySQL.
  const crearPedido = async () => {
    const response = await fetch(
      `${API_URL}/api/pedidos/crear-desde-carrito`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idUsuario: usuario.idUsuario,
          direccionDespacho,
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
        'No se pudo crear el pedido.'
      );
    }

    if (!pedido.idPedido || pedido.total == null) {
      throw new Error(
        'El backend no devolvió el ID o el total del pedido.'
      );
    }

    return pedido;
  };

  // Registra el pago utilizando el pedido generado.
  const registrarPago = async (pedido) => {
    const response = await fetch(`${API_URL}/api/pagos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idPedido: pedido.idPedido,
        metodoPago,
        monto: Number(pedido.total)
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.detail ||
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
      setError(
        'Tu carrito está vacío. Agrega productos antes de continuar.'
      );
      return;
    }

    if (!usuario?.idUsuario || !direccionDespacho) {
      setError(
        'Falta la información del usuario o la dirección de entrega.'
      );
      return;
    }

    setProcesando(true);

    try {
      // 1. Crear el pedido.
      const pedido = await crearPedido();

      // 2. Registrar el pago con el ID generado.
      const pago = await registrarPago(pedido);

      // 3. Mostrar la confirmación.
      setResultado({
        ...pago,
        idPedido: pedido.idPedido,
        monto: Number(pedido.total)
      });

    } catch (err) {
      setError(
        err.message || 'No se pudo conectar con el servidor.'
      );
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
          gridTemplateColumns:
            'minmax(0, 1.5fr) minmax(280px, 1fr)',
          gap: 24,
          alignItems: 'start'
        }}
      >
        <section className="cart-summary" style={{ padding: 24 }}>
          {resultado ? (
            <div role="status">
              <h2 style={{ color: '#198754' }}>
                Pago {resultado.estado}
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

              <p>
                Referencia: {resultado.referenciaTransaccion}
              </p>

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
                Método de pago
              </h2>

              <p>
                Tu número de pedido se generará
                automáticamente al continuar.
              </p>

              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  ['TARJETA_CREDITO', 'Tarjeta de crédito'],
                  ['TARJETA_DEBITO', 'Tarjeta de débito'],
                  ['TRANSFERENCIA', 'Transferencia bancaria'],
                  ['EFECTIVO', 'Efectivo']
                ].map(([value, label]) => (
                  <label
                    key={value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      border:
                        metodoPago === value
                          ? '1px solid #343a40'
                          : '1px solid #dee2e6',
                      borderRadius: 10,
                      padding: 16,
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="metodoPago"
                      value={value}
                      checked={metodoPago === value}
                      onChange={(e) =>
                        setMetodoPago(e.target.value)
                      }
                    />

                    <span>{label}</span>
                  </label>
                ))}
              </div>

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
                  El monto se calcula automáticamente
                  con el total actual del carrito.
                </small>
              </label>

              {error && (
                <p
                  role="alert"
                  style={{ color: '#dc3545', margin: 0 }}
                >
                  {error}
                </p>
              )}

              <button
                className="btn btn-success btn-block"
                type="submit"
                disabled={procesando || monto <= 0}
              >
                {procesando
                  ? 'Procesando...'
                  : 'Confirmar pago'}
              </button>

              <small>
                Pago de demostración: no se realizan
                cobros bancarios reales.
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
                (total, item) =>
                  total + Number(item.cantidad || 0),
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
