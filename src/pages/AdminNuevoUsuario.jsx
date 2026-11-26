import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';

const regionesYComunas = {
  "Región Metropolitana": ["Santiago", "Puente Alto", "Maipú", "La Florida", "Las Condes"],
  "Valparaíso": ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana"],
  "Biobío": ["Concepción", "Talcahuano", "Los Ángeles", "San Pedro de la Paz"]
};

export default function AdminNuevoUsuario() {
  const navigate = useNavigate();
  const { registrarUsuario, logoutUser } = useShop();

  const [formData, setFormData] = useState({
    role: '',
    run: '',
    name: '',
    lastname: '',
    email: '',
    password: '',
    telefono: '',
    region: '',
    comuna: '',
    address: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [id]: value };
      if (id === 'region') updated.comuna = '';
      return updated;
    });
  };

  const cerrarSesionGamer = (e) => {
    e.preventDefault();
    logoutUser();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (
      !formData.role ||
      !formData.run ||
      !formData.name ||
      !formData.lastname ||
      !formData.email ||
      !formData.password ||
      !formData.region ||
      !formData.comuna ||
      !formData.address
    ) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (formData.password.length < 4) {
      alert('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsLoading(true);
    const exito = await registrarUsuario({
      run: formData.run.replace(/[^0-9kK]/g, '').toUpperCase(),
      nombre: formData.name.trim(),
      apellido: formData.lastname.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      telefono: formData.telefono.trim() || '900000000',
      region: formData.region,
      comuna: formData.comuna,
      direccion: formData.address.trim(),
      rol: formData.role,
    });
    setIsLoading(false);

    if (exito) {
      navigate('/admin-usuarios');
    }
  };

  const comunasDisponibles = formData.region ? regionesYComunas[formData.region] : [];

  return (
    <div className="admin-body">
      <aside className="sidebar">
        <div className="sidebar-brand">⚡ ADMIN PANEL</div>
        <nav className="sidebar-nav">
          <Link to="/admin-home">📊 DASHBOARD</Link>
          <Link to="/admin-productos">🎮 INVENTARIO</Link>
          <Link to="/admin-pedidos">📦 PEDIDOS</Link>
          <Link to="/admin-usuarios" className="active">👥 USUARIOS</Link>
          <Link to="/">🛍️ IR A TIENDA</Link>
          <a
            href="#"
            onClick={cerrarSesionGamer}
            style={{ color: 'var(--primary-pink)', marginTop: '20px' }}
          >
            🚪 CERRAR SESIÓN
          </a>
        </nav>
      </aside>

      <main className="admin-content">
        <h1 style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--primary-cyan)' }}>
          NUEVO USUARIO (ADMINISTRACIÓN)
        </h1>
        <p style={{ marginTop: '10px', color: 'var(--text-muted)', fontSize: '1rem' }}>
          Registra un nuevo usuario en la base de datos asignándole un perfil de acceso específico.
        </p>

        <div className="form-card wide-card" style={{ marginTop: '25px' }}>
          <form id="user-admin-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="role">TIPO DE USUARIO (ROLES)</label>
              <select
                id="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">-- Seleccionar Perfil --</option>
                <option value="Administrador">Administrador (Acceso total)</option>
                <option value="Vendedor">Vendedor (Gestión de ventas)</option>
                <option value="Cliente">Cliente Gamer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="run">RUN (Sin puntos ni guión. Ej: 19011022K)</label>
              <input
                type="text"
                id="run"
                className="form-control"
                placeholder="19011022K"
                value={formData.run}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">NOMBRE</label>
                <input
                  type="text"
                  id="name"
                  className="form-control"
                  placeholder="Ej: Juan"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastname">APELLIDOS</label>
                <input
                  type="text"
                  id="lastname"
                  className="form-control"
                  placeholder="Ej: Pérez González"
                  value={formData.lastname}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">CORREO ELECTRÓNICO</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">CONTRASEÑA (Mín. 4 carac.)</label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  placeholder="Ej: 19011022K"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="region">Región</label>
                <select
                  id="region"
                  className="form-control"
                  value={formData.region}
                  onChange={handleChange}
                >
                  <option value="">-- Seleccione --</option>
                  {Object.keys(regionesYComunas).map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="comuna">Comuna</label>
                <select
                  id="comuna"
                  className="form-control"
                  value={formData.comuna}
                  onChange={handleChange}
                  disabled={!formData.region}
                >
                  <option value="">-- Seleccione --</option>
                  {comunasDisponibles.map((comuna) => (
                    <option key={comuna} value={comuna}>
                      {comuna}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">DIRECCIÓN</label>
              <input
                type="text"
                id="address"
                className="form-control"
                placeholder="Av. Siempre Viva 742"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={isLoading}
            >
              {isLoading ? 'GUARDANDO...' : 'GUARDAR USUARIO'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}