import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
).replace(/\/$/, '');

// ==========================================
// 1. DATOS INICIALES (RESPALDO / SEED DATA)
// ==========================================
export const PRODUCTOS_INICIALES = [
  { id: 1, idProducto: 1, codigo: "PS5-001", nombre: "PlayStation 5 Sony Slim Digital", precio: 499999, stock: 10, critical: 5, categoria: "Consola", imagen: "play5.jpg" },
  { id: 2, idProducto: 2, codigo: "NSW-002", nombre: "Consola Nintendo Switch 2 NS2 LCD", precio: 669990, stock: 8, critical: 5, categoria: "Consola", imagen: "switch2.jpg" },
  { id: 3, idProducto: 3, codigo: "PS5-003", nombre: "PlayStation 5 Grand Theft Auto VI", precio: 94990, stock: 25, critical: 10, categoria: "Videojuego", imagen: "grandtheft.jpg" },
  { id: 4, idProducto: 4, codigo: "PS5-004", nombre: "PlayStation 5 1348 Ex Voto", precio: 69990, stock: 15, critical: 5, categoria: "Videojuego", imagen: "1348.jpg" },
  { id: 5, idProducto: 5, codigo: "NSW-005", nombre: "Nintendo Switch Grand Theft Auto VI", precio: 24990, stock: 4, critical: 5, categoria: "Videojuego", imagen: "grandtheft.jpg" },
  { id: 6, idProducto: 6, codigo: "NSW-006", nombre: "Nintendo Switch Assassin's Creed III Remastered", precio: 94990, stock: 12, critical: 5, categoria: "Videojuego", imagen: "ac3nswchico.jpg" },
  { id: 7, idProducto: 7, codigo: "NSW-007", nombre: "9 JUEGOS EN 1 PACK MEGA NINTENDO SWITCH", precio: 80000, stock: 30, critical: 10, categoria: "Videojuego", imagen: "Super-Pack-3-2.jpg" },
  { id: 8, idProducto: 8, codigo: "NSW-008", nombre: "Super Mario Bros U Deluxe Nintendo Switch", precio: 59000, stock: 0, critical: 5, categoria: "Videojuego", imagen: "mario.jpg" }
];

export const USUARIOS_INICIALES = [
  { idUsuario: 1, run: "19011022K", nombre: "Gonzalo Gamer", name: "Gonzalo Gamer", email: "gonzalo@duoc.cl", correo: "gonzalo@duoc.cl", password: "123", rol: "Administrador", role: "Administrador", region: "Región Metropolitana de Santiago", comuna: "Santiago", direccion: "Av. Vicuña Mackenna 4917, San Joaquín" },
  { idUsuario: 2, run: "201234567", nombre: "Camila Player", name: "Camila Player", email: "camila@gmail.com", correo: "camila@gmail.com", password: "123", rol: "Cliente", role: "Cliente", region: "Región de la Araucanía", comuna: "Temuco", direccion: "Av. Alemania 0671, Temuco" }
];

export const REGIONES_DATA = [
  { region: "Región Metropolitana de Santiago", comunas: ["Santiago", "Puente Alto", "Maipú", "Las Condes", "La Florida", "Providencia"] },
  { region: "Región de Valparaíso", comunas: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"] },
  { region: "Región de la Araucanía", comunas: ["Temuco", "Padre Las Casas", "Villarrica", "Pucón"] }
];

const ShopContext = createContext();

// ==========================================
// 2. PROVEEDOR DEL CONTEXTO (ShopProvider)
// ==========================================
export const ShopProvider = ({ children }) => {
  const [productos, setProductos] = useState(() => {
    const saved = localStorage.getItem("gamer_products");
    return saved ? JSON.parse(saved) : PRODUCTOS_INICIALES;
  });

  const [carrito, setCarrito] = useState(() => {
    const saved = localStorage.getItem("gamer_cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [usuarios, setUsuarios] = useState(() => {
    const saved = localStorage.getItem("gamer_users");
    return saved ? JSON.parse(saved) : USUARIOS_INICIALES;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("gamer_current_user") || localStorage.getItem("usuario");
    return saved ? JSON.parse(saved) : null;
  });

  const [descuentoAplicado, setDescuentoAplicado] = useState(0);

  // Cargar productos reales desde Spring Boot al iniciar
  useEffect(() => {
    const cargarProductosBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/api/productos`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const normalizados = data.map((p) => ({
              ...p,
              id: p.idProducto ?? p.id,
              idProducto: p.idProducto ?? p.id,
              categoria: typeof p.categoria === 'object' ? p.categoria?.nombre : (p.categoria || 'General'),
            }));
            setProductos(normalizados);
          }
        }
      } catch {
        // Si el backend no responde aún, usa los productos de respaldo
      }
    };
    cargarProductosBackend();
  }, []);

  // SINCRONIZACIÓN CON LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem("gamer_products", JSON.stringify(productos));
  }, [productos]);

  useEffect(() => {
    localStorage.setItem("gamer_cart", JSON.stringify(carrito));
  }, [carrito]);

  useEffect(() => {
    localStorage.setItem("gamer_users", JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("gamer_current_user", JSON.stringify(currentUser));
      localStorage.setItem("usuario", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("gamer_current_user");
      localStorage.removeItem("usuario");
    }
  }, [currentUser]);

  // AUXILIAR: RUTA DE IMÁGENES DESDE LA CARPETA PUBLIC
  const rutaImagenProducto = (imagen) => {
    if (!imagen) return "/play5.jpg";
    if (imagen.startsWith("http")) return imagen;
    const nombreLimpio = imagen.replace(/^(\.\.\/|\.\/)+/, "");
    return nombreLimpio.startsWith("/") ? nombreLimpio : "/" + nombreLimpio;
  };

  // ==========================================
  // 3. FUNCIONES DEL CARRITO DE COMPRAS
  // ==========================================
  const agregarAlCarritoConCantidad = (idProducto, cantidad = 1) => {
    if (cantidad <= 0) return;
    const prod = productos.find(p => (p.idProducto ?? p.id) === Number(idProducto));
    if (!prod) return;

    if (prod.stock <= 0) {
      alert(`El producto ${prod.nombre} se encuentra agotado.`);
      return;
    }

    const itemIndex = carrito.findIndex(item => (item.idProducto ?? item.id) === Number(idProducto));
    const cantidadActual = itemIndex > -1 ? carrito[itemIndex].cantidad : 0;

    if ((cantidadActual + cantidad) > prod.stock) {
      alert(`No puedes agregar más unidades. Solo quedan ${prod.stock} en stock.`);
      return;
    }

    let nuevoCarrito = [...carrito];
    if (itemIndex > -1) {
      nuevoCarrito[itemIndex] = {
        ...nuevoCarrito[itemIndex],
        cantidad: nuevoCarrito[itemIndex].cantidad + cantidad
      };
    } else {
      nuevoCarrito.push({
        ...prod,
        id: prod.idProducto ?? prod.id,
        idProducto: prod.idProducto ?? prod.id,
        cantidad
      });
    }

    setCarrito(nuevoCarrito);
    alert(`¡${cantidad} unidad(es) de ${prod.nombre} añadida(s) al carrito!`);
  };

  const agregarAlCarritoGamer = (idProducto) => {
    agregarAlCarritoConCantidad(idProducto, 1);
  };

  const cambiarCantidad = (idProducto, delta) => {
    const prod = productos.find(p => (p.idProducto ?? p.id) === Number(idProducto));
    const itemIndex = carrito.findIndex(item => (item.idProducto ?? item.id) === Number(idProducto));

    if (itemIndex === -1) return;

    if (delta > 0 && prod && (carrito[itemIndex].cantidad + delta) > prod.stock) {
      alert(`Has alcanzado el límite de stock para ${prod.nombre}.`);
      return;
    }

    let nuevoCarrito = [...carrito];
    nuevoCarrito[itemIndex].cantidad += delta;

    if (nuevoCarrito[itemIndex].cantidad <= 0) {
      nuevoCarrito.splice(itemIndex, 1);
    }

    setCarrito(nuevoCarrito);
  };

  const eliminarDelCarrito = (idProducto) => {
    setCarrito(prev => prev.filter(item => (item.idProducto ?? item.id) !== Number(idProducto)));
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setDescuentoAplicado(0);
  };

  const aplicarCuponGamer = (cupon) => {
    const codigo = cupon.trim().toUpperCase();
    if (codigo === "DUOCGAMER") {
      setDescuentoAplicado(0.20);
      alert("¡Cupón del 20% de descuento aplicado con éxito!");
    } else {
      setDescuentoAplicado(0);
      alert("Cupón no válido.");
    }
  };

  const procesarCompraGamer = () => {
    if (carrito.length === 0) {
      alert("Tu carrito está vacío. Agrega productos antes de comprar.");
      return;
    }

    const nuevosProductos = productos.map(prod => {
      const prodId = prod.idProducto ?? prod.id;
      const itemCart = carrito.find(item => (item.idProducto ?? item.id) === prodId);
      if (itemCart) {
        const nuevoStock = prod.stock - itemCart.cantidad;
        return { ...prod, stock: nuevoStock < 0 ? 0 : nuevoStock };
      }
      return prod;
    });

    setProductos(nuevosProductos);
    setCarrito([]);
    setDescuentoAplicado(0);
    alert("¡Gracias por tu compra en GamerZone! Tu pedido ha sido procesado con éxito.");
  };

  // ==========================================
  // 4. AUTENTICACIÓN Y REGISTRO (CONECTADO A BACKEND)
  // ==========================================
  const normalizarUsuario = (u, indexFallback = 1) => ({
    ...u,
    idUsuario: u.idUsuario ?? u.id ?? indexFallback,
    nombre: u.nombre ?? u.name ?? 'Usuario',
    name: u.nombre ?? u.name ?? 'Usuario',
    email: u.correo ?? u.email,
    correo: u.correo ?? u.email,
    rol: u.rol ?? u.role ?? 'Cliente',
    role: u.rol ?? u.role ?? 'Cliente',
  });

  const loginUser = async (email, password) => {
    // 1. Intentar autenticar contra Spring Boot (MySQL)
    try {
      const res = await fetch(`${API_URL}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, email, password, contrasena: password })
      });

      if (res.ok) {
        const data = await res.json();
        const userNormalizado = normalizarUsuario(data);
        setCurrentUser(userNormalizado);
        return { success: true, user: userNormalizado };
      }
    } catch {
      // Si el backend no responde, continúa al respaldo local
    }

    // 2. Respaldo en usuarios locales
    const idx = usuarios.findIndex(
      u => (u.email || u.correo || '').toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (idx !== -1) {
      const userNormalizado = normalizarUsuario(usuarios[idx], idx + 1);
      setCurrentUser(userNormalizado);
      return { success: true, user: userNormalizado };
    }

    return { success: false, message: "Correo o contraseña incorrectos" };
  };

  const logoutUser = () => {
    setCurrentUser(null);
  };

  const registrarUsuario = async (nuevoUsuario) => {
    try {
      const payload = {
        run: nuevoUsuario.run,
        nombre: nuevoUsuario.nombre || nuevoUsuario.name,
        apellidos: nuevoUsuario.apellidos || '',
        correo: nuevoUsuario.email || nuevoUsuario.correo,
        contrasena: nuevoUsuario.password,
        direccion: nuevoUsuario.direccion || `${nuevoUsuario.comuna || ''}, ${nuevoUsuario.region || ''}`.trim(),
        rol: nuevoUsuario.rol || nuevoUsuario.role || 'Cliente'
      };

      const res = await fetch(`${API_URL}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const creado = await res.json();
        const userNormalizado = normalizarUsuario(creado, usuarios.length + 1);
        setUsuarios(prev => [...prev, userNormalizado]);
        alert("¡Usuario registrado exitosamente en la base de datos!");
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "El usuario con este RUN o correo ya se encuentra registrado.");
        return false;
      }
    } catch {
      // Fallback local si el servidor está apagado
      const existe = usuarios.some(
        u => (u.email || u.correo || '').toLowerCase() === (nuevoUsuario.email || '').toLowerCase() || u.run === nuevoUsuario.run
      );
      if (existe) {
        alert("El usuario con este RUN o correo ya se encuentra registrado.");
        return false;
      }

      const usuarioConRol = normalizarUsuario(nuevoUsuario, usuarios.length + 1);
      setUsuarios(prev => [...prev, usuarioConRol]);
      alert("¡Usuario registrado exitosamente!");
      return true;
    }
  };

  // ==========================================
  // 5. FUNCIONES DE ADMINISTRACIÓN
  // ==========================================
  const eliminarProductoAdmin = (id) => {
    if (window.confirm("¿Estás seguro de eliminar este producto del inventario?")) {
      setProductos(prev => prev.filter(p => (p.idProducto ?? p.id) !== Number(id)));
    }
  };

  const agregarProductoAdmin = (nuevoProducto) => {
    const id = Date.now();
    setProductos(prev => [...prev, { ...nuevoProducto, id, idProducto: id }]);
    alert("Producto agregado correctamente.");
  };

  const eliminarUsuarioAdmin = (run) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      setUsuarios(prev => prev.filter(u => u.run !== run));
    }
  };

  // ==========================================
  // 6. VALORES CALCULADOS (METRICAS Y TOTALES)
  // ==========================================
  const cartCount = carrito.reduce((acc, item) => acc + (item.cantidad || 0), 0);
  const subtotalCarrito = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalCarrito = descuentoAplicado > 0 ? Math.round(subtotalCarrito * (1 - descuentoAplicado)) : subtotalCarrito;

  const metricasDashboard = {
    totalProductos: productos.length,
    lowStock: productos.filter(p => Number(p.stock) < 10).length,
    cartItems: cartCount,
    totalUsuarios: usuarios.length
  };

  return (
    <ShopContext.Provider value={{
      productos,
      setProductos,
      carrito,
      usuarios,
      currentUser,
      usuario: currentUser,
      descuentoAplicado,
      REGIONES_DATA,
      rutaImagenProducto,
      agregarAlCarritoConCantidad,
      agregarAlCarritoGamer,
      cambiarCantidad,
      eliminarDelCarrito,
      vaciarCarrito,
      aplicarCuponGamer,
      procesarCompraGamer,
      loginUser,
      logoutUser,
      registrarUsuario,
      eliminarProductoAdmin,
      agregarProductoAdmin,
      eliminarUsuarioAdmin,
      cartCount,
      subtotalCarrito,
      totalCarrito,
      metricasDashboard
    }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);