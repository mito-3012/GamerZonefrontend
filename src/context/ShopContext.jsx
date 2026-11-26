import React, { createContext, useContext, useState, useEffect } from 'react';

const ShopContext = createContext();

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

export const useShop = () => useContext(ShopContext);

export const ShopProvider = ({ children }) => {
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [carrito, setCarrito] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gamer_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);

  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('usuario') || localStorage.getItem('gamer_current_user') || 'null');
    } catch {
      return null;
    }
  });

  const getAuthHeaders = (customToken) => {
    const t = customToken ?? token ?? localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };
  };

  // 1. Cargar productos (público)
  const cargarProductos = async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/productos`);
      if (resp.ok) {
        const data = await resp.json();
        const normalizados = data.map((p) => ({
          ...p,
          id: p.idProducto ?? p.id,
          categoria: typeof p.categoria === 'object' ? p.categoria?.nombre : (p.categoria || 'General'),
        }));
        setProductos(normalizados);
        localStorage.setItem('productos', JSON.stringify(normalizados));
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  // 2. Cargar usuarios (solo si hay token de Administrador/Vendedor)
  const cargarUsuarios = async (activeToken) => {
    const t = activeToken ?? token ?? localStorage.getItem('token');
    if (!t) return;
    try {
      const resp = await fetch(`${API_BASE}/api/usuarios`, {
        headers: getAuthHeaders(t),
      });
      if (resp.ok) {
        const data = await resp.json();
        setUsuarios(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('No se pudieron cargar usuarios:', err);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    if (token && currentUser) {
      const rol = (currentUser.rol || '').toLowerCase();
      if (rol === 'administrador' || rol === 'vendedor') {
        cargarUsuarios(token);
      }
    }
  }, [token, currentUser]);

  useEffect(() => {
    localStorage.setItem('gamer_cart', JSON.stringify(carrito));
  }, [carrito]);

  // Login con JWT
  const loginUser = async (email, password) => {
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || data.message || 'Credenciales incorrectas');
      }

      const userObj = {
        id: data.id,
        idUsuario: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol,
      };

      setToken(data.token);
      setCurrentUser(userObj);
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(userObj));
      localStorage.setItem('gamer_current_user', JSON.stringify(userObj));
      return userObj;
    } catch (err) {
      alert(err.message || 'No se pudo conectar con el servidor.');
      return null;
    }
  };

  const logoutUser = () => {
    setToken('');
    setCurrentUser(null);
    setUsuarios([]);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('gamer_current_user');
  };

  // Registrar usuario
  const registrarUsuario = async (nuevoUsuario) => {
    try {
      const resp = await fetch(`${API_BASE}/api/usuarios`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(nuevoUsuario),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || data.message || 'Error al registrar usuario');
      }
      alert('¡Usuario registrado con éxito en la base de datos!');
      if (token) await cargarUsuarios(token);
      return true;
    } catch (err) {
      alert(`Error: ${err.message}`);
      return false;
    }
  };

  const eliminarUsuarioAdmin = async (run) => {
    const target = usuarios.find((u) => u.run === run);
    if (!target) return;
    if (!window.confirm(`¿Eliminar al usuario ${target.nombre}?`)) return;
    try {
      const resp = await fetch(`${API_BASE}/api/usuarios/${target.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (resp.ok) {
        setUsuarios((prev) => prev.filter((u) => u.run !== run));
      } else {
        alert('No tienes permisos para eliminar usuarios.');
      }
    } catch (err) {
      console.error('Error eliminando usuario:', err);
    }
  };

  const agregarProductoAdmin = async (productoData) => {
    try {
      const resp = await fetch(`${API_BASE}/api/productos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(productoData),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || 'No se pudo crear el producto');
      }
      alert('¡Producto guardado en la base de datos!');
      await cargarProductos();
      return true;
    } catch (err) {
      alert(`Error: ${err.message}`);
      return false;
    }
  };

  const eliminarProductoAdmin = async (idProducto) => {
    if (!window.confirm('¿Eliminar este producto del catálogo?')) return;
    try {
      const resp = await fetch(`${API_BASE}/api/productos/${idProducto}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (resp.ok) {
        await cargarProductos();
      } else {
        alert('No autorizado para eliminar productos.');
      }
    } catch (err) {
      console.error('Error eliminando producto:', err);
    }
  };

  // Funciones de carrito
  const rutaImagenProducto = (img) => {
    if (!img) return '/play5.jpg';
    return img.startsWith('/') || img.startsWith('http') ? img : `/${img}`;
  };

  const agregarAlCarritoConCantidad = (idProd, cant = 1) => {
    const prod = productos.find((p) => Number(p.id) === Number(idProd));
    if (!prod) return;

    setCarrito((prev) => {
      const existente = prev.find((item) => Number(item.id) === Number(idProd));
      if (existente) {
        return prev.map((item) =>
          Number(item.id) === Number(idProd)
            ? { ...item, cantidad: Math.min(prod.stock, item.cantidad + cant) }
            : item
        );
      }
      return [...prev, { ...prod, idProducto: prod.id, cantidad: Math.min(prod.stock, cant) }];
    });
    alert(`✅ "${prod.nombre}" agregado al carrito.`);
  };

  const agregarAlCarritoGamer = (idProd) => agregarAlCarritoConCantidad(idProd, 1);

  const cambiarCantidad = (idProd, delta) => {
    setCarrito((prev) =>
      prev
        .map((item) =>
          Number(item.id) === Number(idProd)
            ? { ...item, cantidad: item.cantidad + delta }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const eliminarDelCarrito = (idProd) => {
    setCarrito((prev) => prev.filter((item) => Number(item.id) !== Number(idProd)));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setDescuentoAplicado(0);
  };

  const aplicarCuponGamer = (codigo) => {
    if (codigo.trim().toUpperCase() === 'DUOCGAMER') {
      setDescuentoAplicado(0.2);
      alert('🎉 ¡Cupón DUOCGAMER aplicado! 20% de descuento.');
    } else {
      alert('Cupón no válido. Prueba con DUOCGAMER.');
    }
  };

  const cartCount = carrito.reduce((acc, item) => acc + Number(item.cantidad || 0), 0);
  const subtotalCarrito = carrito.reduce((acc, item) => acc + Number(item.precio) * Number(item.cantidad), 0);
  const totalCarrito = Math.round(subtotalCarrito * (1 - descuentoAplicado));

  return (
    <ShopContext.Provider
      value={{
        productos,
        usuarios,
        carrito,
        currentUser,
        usuario: currentUser,
        token,
        cartCount,
        subtotalCarrito,
        totalCarrito,
        descuentoAplicado,
        loginUser,
        logoutUser,
        registrarUsuario,
        eliminarUsuarioAdmin,
        agregarProductoAdmin,
        eliminarProductoAdmin,
        agregarAlCarritoGamer,
        agregarAlCarritoConCantidad,
        cambiarCantidad,
        eliminarDelCarrito,
        vaciarCarrito,
        aplicarCuponGamer,
        rutaImagenProducto,
        cargarProductos,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};