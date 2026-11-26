import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../context/ShopContext";

export default function Login() {
  const { loginUser } = useShop();
  const navigate = useNavigate();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!correo.trim() || !password.trim()) {
      alert("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);
    try {
      const usuario = await loginUser(correo.trim(), password);
      if (usuario?.rol === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      alert(err.message || "Correo o contraseña incorrectos. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#05060a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 420, background: "#0a0e17", border: "1px solid #1e293b", borderRadius: 12, padding: 28 }}>
        <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, letterSpacing: 1, marginBottom: 18 }}>
          INICIO DE SESIÓN
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, color: "#19e6ff", fontWeight: 700, marginBottom: 6 }}>
              CORREO
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 8,
                border: "1px solid #252a3a",
                background: "#090c14",
                color: "#fff",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, color: "#19e6ff", fontWeight: 700, marginBottom: 6 }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "11px 12px",
                borderRadius: 8,
                border: "1px solid #252a3a",
                background: "#090c14",
                color: "#fff",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid #19e6ff",
              background: "transparent",
              color: "#19e6ff",
              fontWeight: 700,
              fontSize: 13,
              cursor: cargando ? "wait" : "pointer",
            }}
          >
            {cargando ? "INGRESANDO..." : "INGRESAR"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 22, fontSize: 12, color: "#94a3b8" }}>
          ¿No tienes cuenta?{" "}
          <Link to="/registro" style={{ color: "#19e6ff", textDecoration: "none", fontWeight: 600 }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}