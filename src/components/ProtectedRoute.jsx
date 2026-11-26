import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { usuario, token, cargandoSesion } = useContext(ShopContext);

  if (cargandoSesion) {
    return <div className="p-5 text-center">Verificando credenciales...</div>;
  }

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && usuario.rol?.toUpperCase() !== requiredRole.toUpperCase()) {
    return <Navigate to="/" replace />;
  }

  return children;
};