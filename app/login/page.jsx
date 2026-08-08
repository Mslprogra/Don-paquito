'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const manejarAutenticacion = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    // Normalizamos el usuario eliminando espacios y pasándolo a minúsculas
    const usuarioLimpio = username.trim().toLowerCase();
    
    // Generamos un correo sintético interno para Supabase Auth
    const emailFicticio = `${usuarioLimpio}@donpaquito.local`;

    try {
      if (esRegistro) {
        const { error: errorSignUp } = await supabase.auth.signUp({
          email: emailFicticio,
          password,
          options: {
            data: { username: usuarioLimpio }, // Guardamos el nombre de usuario original
          },
        });
        if (errorSignUp) throw errorSignUp;
        alert('Registro exitoso. Ya puedes iniciar sesión con tu usuario.');
        setEsRegistro(false);
      } else {
        const { error: errorSignIn } = await supabase.auth.signInWithPassword({
          email: emailFicticio,
          password,
        });
        if (errorSignIn) throw errorSignIn;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      // Personalizamos mensajes de error comunes
      if (err.message.includes('Invalid login credentials')) {
        setError('Usuario o contraseña incorrectos.');
      } else if (err.message.includes('User already registered')) {
        setError('El nombre de usuario ya está registrado. Elige otro.');
      } else {
        setError(err.message);
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 text-white">
      <div className="bg-[#2d2d2d] p-8 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-bold text-center text-[#c4a77d] mb-2">
          {esRegistro ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h1>
        <p className="text-xs text-gray-400 text-center mb-6">
          Gestión de Costeo Gastronómico
        </p>

        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 p-3 rounded-lg text-xs mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={manejarAutenticacion} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Usuario</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: donpaquito"
              className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white outline-none focus:border-[#c4a77d]"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white outline-none focus:border-[#c4a77d]"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-[#c4a77d] hover:bg-white text-[#1a1a1a] font-bold rounded-lg text-xs uppercase tracking-wider transition disabled:opacity-50"
          >
            {cargando ? 'Procesando...' : esRegistro ? 'Registrarse' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError(null);
            }}
            className="text-xs text-gray-400 hover:text-[#c4a77d] transition"
          >
            {esRegistro
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿No tienes cuenta? Regístrate gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}