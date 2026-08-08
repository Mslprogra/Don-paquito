'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

export default function DashboardPage() {
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [errorGlobal, setErrorGlobal] = useState(null);

  // Formateador memorizado de moneda (Evita hydration mismatches)
  const formatoCOP = useMemo(() => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    });
  }, []);

  // Fetching de datos memoizado con useCallback
  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setErrorGlobal(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('v_productos_resumen')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error al cargar dashboard:', error.message);
      setErrorGlobal('No se pudieron cargar los datos del inventario.');
    } finally {
      setCargando(false);
    }
  }, [router]);

  // Manejo de autenticación y sincronización en tiempo real
  useEffect(() => {
    cargarDashboard();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [cargarDashboard, router]);

  // Handler de eliminación optimista
  const eliminarProducto = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción borra sus ingredientes asociados.')) {
      return;
    }

    // Copia previa para rollback optimista si falla
    const productosPrevios = [...productos];
    setProductos((prev) => prev.filter((p) => p.id !== id));

    const { error } = await supabase.from('productos').delete().eq('id', id);

    if (error) {
      console.error('Error al eliminar:', error.message);
      setErrorGlobal('Error al eliminar el producto. Inténtalo de nuevo.');
      setProductos(productosPrevios); // Rollback
    }
  };

  // Logout directo desde el Dashboard
  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Filtrado de productos memoizado para evitar ejecuciones innecesarias en re-renders
  const productosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    if (!query) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(query));
  }, [productos, busqueda]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 text-white min-h-screen">
      {/* Header & Acciones Principal */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[#c4a77d] tracking-tight">
            Don Paquito Inventario
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Gestiona la rentabilidad de tus productos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/producto/nuevo')}
            className="bg-[#c4a77d] hover:bg-white text-[#1a1a1a] font-bold px-5 py-2.5 rounded-xl uppercase text-xs tracking-wider transition-all shadow-lg active:scale-95"
          >
            + Nuevo Producto
          </button>
          
          <button
            type="button"
            onClick={cerrarSesion}
            className="bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/50 px-4 py-2.5 rounded-xl text-xs font-semibold transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Alerta de Error Global */}
      {errorGlobal && (
        <div className="mb-6 p-4 bg-red-950/60 border border-red-800 text-red-200 rounded-xl text-sm flex justify-between items-center">
          <span>{errorGlobal}</span>
          <button 
            onClick={() => setErrorGlobal(null)} 
            className="text-xs font-bold underline ml-4 hover:text-white"
          >
            Descartar
          </button>
        </div>
      )}

      {/* Input de Búsqueda */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-96 p-3 bg-[#2d2d2d] border border-gray-700 focus:border-[#c4a77d] rounded-xl text-white text-sm outline-none transition"
        />
      </div>

      {/* Grid de Contenido */}
      {cargando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-[#2d2d2d] animate-pulse rounded-2xl border border-gray-800/80" />
          ))}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="bg-[#2d2d2d] p-12 text-center rounded-2xl border border-gray-800 text-gray-400">
          <p className="text-base font-medium">No se encontraron productos registrados.</p>
          <p className="text-xs text-gray-500 mt-1">Crea un producto nuevo para empezar a calcular</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productosFiltrados.map((item) => (
            <article
              key={item.id}
              className="bg-[#2d2d2d] border border-gray-700/60 hover:border-[#c4a77d]/80 p-6 rounded-2xl transition-all duration-200 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex justify-between items-start mb-4 gap-2">
                  <h2 className="text-xl font-bold text-white leading-snug line-clamp-1">{item.nombre}</h2>
                  <span className="text-[11px] bg-gray-800 px-2.5 py-1 rounded-full text-gray-400 font-mono shrink-0">
                    {item.total_ingredientes} insumos
                  </span>
                </div>

                <div className="space-y-2 mb-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Precio Venta:</span>
                    <span className="font-bold text-white">{formatoCOP.format(item.precio_venta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Costo Producción:</span>
                    <span className="font-bold text-red-400">{formatoCOP.format(item.costo_total)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700/70 pt-2">
                    <span className="text-gray-400">Ganancia Bruta:</span>
                    <span className="font-extrabold text-emerald-400">{formatoCOP.format(item.ganancia_bruta)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2 bg-[#1a1a1a] p-3 rounded-xl text-center mb-4 border border-gray-800">
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider"></span>
                    <span className="text-sm font-bold text-[#c4a77d]">{item.margen_porcentaje}%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider"></span>
                    <span className="text-sm font-bold text-gray-300">{item.markup_porcentaje}%</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/producto/editar?id=${item.id}`)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-xs font-bold transition"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminarProducto(item.id)}
                    className="bg-red-950/40 hover:bg-red-900/80 text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition border border-red-900/50"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}