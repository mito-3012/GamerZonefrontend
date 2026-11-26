import React, { createContext, useContext, useState, useEffect } from 'react';

const ShopContext = createContext();

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '') + '/api';

export function ShopProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState(() => {
    try {
      const saved = localStorage.getItem('carrito');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deseos, setDeseos] = useState(() => {
    try {
      const saved = localStorage.getItem('deseos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const getAuthHeaders = (customToken) => {
    const activeToken = customToken || token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    };
  };

  // Cargar catálogo público
  const cargarProductos = async () => {
    try {
      const resp = await fetch(`${API_URL}/productos`);
      if (resp.ok) {
        const data = await resp.json();
        setProductos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Guardar carrito y deseos localmente
  useEffect(() => {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }, [carrito]);

  useEffect(() => {
    localStorage.setItem('deseos', JSON.stringify(deseos));
  }, [deseos]);

  const loginUser = async (email, password) => {
    const resp = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data.error || data.message || 'Credenciales incorrectas');
    }

    const jwt = data.token || data.jwt || '';
    const usuario = data.usuario || {
      idUsuario: data.idUsuario ?? data.id,
      nombre: data.nombre,
      email: data.email || email,
      rol: data.rol || 'CLIENTE',
    };

    if (jwt) {
      localStorage.setItem('token', jwt);
      setToken(jwt);
    }
    localStorage.setItem('currentUser', JSON.stringify(usuario));
    setCurrentUser(usuario);

    return usuario;
  };

  const logoutUser = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setToken('');
    setCurrentUser(null);
  };

  const agregarAlCarrito = (producto, cantidad = 1) => {
    const idProd = producto.idProducto ?? producto.id;
    setCarrito((prev) => {
      const existe = prev.find((item) => (item.idProducto ?? item.id) === idProd);
      if (existe) {
        return prev.map((item) =>
          (item.idProducto ?? item.id) === idProd
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      }
      return [
        ...prev,
        {
          ...producto,
          idProducto: idProd,
          id: idProd,
          cantidad,
        },
      ];
    });
  };

  const actualizarCantidad = (idProducto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(idProducto);
      return;
    }
    setCarrito((prev) =>
      prev.map((item) =>
        (item.idProducto ?? item.id) === idProducto
          ? { ...item, cantidad: nuevaCantidad }
          : item
      )
    );
  };

  const eliminarDelCarrito = (idProducto) => {
    setCarrito((prev) => prev.filter((item) => (item.idProducto ?? item.id) !== idProducto));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    localStorage.removeItem('carrito');
  };

  const toggleDeseo = (producto) => {
    const idProd = producto.idProducto ?? producto.id;
    setDeseos((prev) => {
      const existe = prev.some((item) => (item.idProducto ?? item.id) === idProd);
      if (existe) {
        return prev.filter((item) => (item.idProducto ?? item.id) !== idProd);
      }
      return [...prev, { ...producto, idProducto: idProd, id: idProd }];
    });
  };

  const cartCount = carrito.reduce((acc, item) => acc + Number(item.cantidad || 1), 0);
  const totalCarrito = carrito.reduce(
    (acc, item) => acc + Number(item.precio || 0) * Number(item.cantidad || 1),
    0
  );

  return (
    <ShopContext.Provider
      value={{
        token,
        currentUser,
        loginUser,
        logoutUser,
        productos,
        cargarProductos,
        carrito,
        cartCount,
        totalCarrito,
        agregarAlCarrito,
        actualizarCantidad,
        eliminarDelCarrito,
        vaciarCarrito,
        deseos,
        toggleDeseo,
        getAuthHeaders,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export const useShop = () => useContext(ShopContext);