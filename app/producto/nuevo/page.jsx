'use client';

import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../supabaseClient';

// Componente con la lógica principal
function FormularioProductoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productoId = searchParams.get('id');

  const [nombreProducto, setNombreProducto] = useState('');
  const [precioVenta, setPrecioVenta] = useState(0);
  const [ingredientes, setIngredientes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(!!productoId);

  const formatoCOP = useMemo(() => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    });
  }, []);

  const cargarProductoExistente = useCallback(async () => {
    try {
      const { data: prod, error: errorProd } = await supabase
        .from('productos')
        .select('*')
        .eq('id', productoId)
        .maybeSingle();

      if (errorProd) throw errorProd;

      if (prod) {
        setNombreProducto(prod.nombre || '');
        setPrecioVenta(prod.precio_venta || 0);

        const { data: ings } = await supabase
          .from('ingredientes')
          .select('*')
          .eq('producto_id', productoId);

        if (ings) {
          setIngredientes(
            ings.map((i) => ({
              nombre: i.nombre || '',
              unidad: i.unidad_medida || 'gr',
              receta: i.cantidad_receta || 1,
              costo: i.costo_paquete || 0,
            }))
          );
        }
      }
    } catch (err) {
      alert('Error al cargar producto: ' + err.message);
    } finally {
      setCargando(false);
    }
  }, [productoId]);

  useEffect(() => {
    if (productoId) cargarProductoExistente();
  }, [productoId, cargarProductoExistente]);

  const agregarFila = () => {
    setIngredientes([...ingredientes, { nombre: '', unidad: 'gr', receta: 1, costo: 0 }]);
  };

  const eliminarFila = (index) => {
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const actualizarIngrediente = (index, campo, valor) => {
    const nuevos = [...ingredientes];
    nuevos[index][campo] = valor;
    setIngredientes(nuevos);
  };

  const costoTotal = ingredientes.reduce((acc, item) => {
    return acc + (parseFloat(item.receta) || 0) * (parseFloat(item.costo) || 0);
  }, 0);

  const ganancia = precioVenta - costoTotal;
  const margen = precioVenta > 0 ? (ganancia / precioVenta) * 100 : 0;
  const markup = costoTotal > 0 ? (ganancia / costoTotal) * 100 : 0;

  const guardarEnBaseDeDatos = async () => {
    if (!nombreProducto.trim()) {
      alert('Por favor ingresa un nombre válido.');
      return;
    }

    setGuardando(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Sesión no encontrada');

      let targetId = productoId;

      if (productoId) {
        const { error } = await supabase
          .from('productos')
          .update({ nombre: nombreProducto.trim(), precio_venta: parseFloat(precioVenta) || 0 })
          .eq('id', productoId);
        if (error) throw error;
      } else {
        const { data: nuevo, error } = await supabase
          .from('productos')
          .insert([{ user_id: user.id, nombre: nombreProducto.trim(), precio_venta: parseFloat(precioVenta) || 0 }])
          .select()
          .single();
        if (error) throw error;
        targetId = nuevo.id;
      }

      await supabase.from('ingredientes').delete().eq('producto_id', targetId);

      const insumosAptos = ingredientes.filter((i) => i.nombre.trim() !== '');
      if (insumosAptos.length > 0) {
        const aInsertar = insumosAptos.map((i) => ({
          producto_id: targetId,
          nombre: i.nombre.trim(),
          unidad_medida: i.unidad,
          cantidad_receta: parseFloat(i.receta) || 0,
          costo_paquete: parseFloat(i.costo) || 0,
        }));

        const { error: errIngs } = await supabase.from('ingredientes').insert(aInsertar);
        if (errIngs) throw errIngs;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      alert('Error en el guardado: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return <div className="p-8 text-center text-gray-400 min-h-screen bg-[#1a1a1a]">Cargando producto...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-white min-h-screen">
      <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-[#c4a77d]">
          {productoId ? 'Don paquito' : 'Nuevo Producto'}
        </h1>
        <button type="button" onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white text-sm">
          ← Volver al Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-[#2d2d2d] p-6 rounded-2xl border border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs text-gray-400 mb-1">Nombre del Plato / Producto</label>
                <input
                  type="text"
                  value={nombreProducto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  placeholder="Ej: Hamburguesa Especial"
                  className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-white outline-none focus:border-[#c4a77d]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Precio Venta (COP)</label>
                <input
                  type="number"
                  value={precioVenta}
                  onChange={(e) => setPrecioVenta(parseFloat(e.target.value) || 0)}
                  className="w-full p-3 bg-[#1a1a1a] border border-gray-600 rounded-lg text-[#c4a77d] font-bold outline-none focus:border-[#c4a77d]"
                />
              </div>
            </div>
          </section>

          <section className="bg-[#2d2d2d] p-6 rounded-2xl border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm uppercase font-bold text-[#c4a77d]">Insumos del Producto</h2>
              <button
                type="button"
                onClick={agregarFila}
                className="bg-[#c4a77d] text-[#1a1a1a] hover:bg-white px-4 py-2 rounded-lg font-bold text-xs uppercase"
              >
                + Añadir Insumo
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-400 border-b border-gray-600">
                  <tr>
                    <th className="p-3">Insumo</th>
                    <th className="p-3 text-center">Unidad</th>
                    <th className="p-3 text-center">Cant. Usada</th>
                    <th className="p-3 text-center">Costo Unit. (COP)</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {ingredientes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-500">
                        No hay insumos añadidos aún.
                      </td>
                    </tr>
                  ) : (
                    ingredientes.map((item, index) => {
                      const subtotal = (parseFloat(item.receta) || 0) * (parseFloat(item.costo) || 0);
                      return (
                        <tr key={index}>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.nombre}
                              onChange={(e) => actualizarIngrediente(index, 'nombre', e.target.value)}
                              placeholder="Ej: Queso Cheddar"
                              className="w-full p-2 bg-[#1a1a1a] border border-gray-700 rounded text-white text-sm"
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.unidad}
                              onChange={(e) => actualizarIngrediente(index, 'unidad', e.target.value)}
                              className="p-2 bg-[#1a1a1a] border border-gray-700 rounded text-white text-sm"
                            >
                              <option value="gr">gr</option>
                              <option value="kg">kg</option>
                              <option value="ml">ml</option>
                              <option value="lt">lt</option>
                              <option value="und">und</option>
                              <option value="porcion">porción</option>
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.receta}
                              onChange={(e) => actualizarIngrediente(index, 'receta', e.target.value)}
                              className="w-20 text-center mx-auto p-2 bg-[#1a1a1a] border border-gray-700 rounded text-white text-sm block"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              value={item.costo}
                              onChange={(e) => actualizarIngrediente(index, 'costo', e.target.value)}
                              className="w-28 text-center mx-auto p-2 bg-[#1a1a1a] border border-gray-700 rounded text-white text-sm block"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-[#f1f1f1]">
                            {formatoCOP.format(subtotal)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarFila(index)}
                              className="text-red-500 hover:text-red-400 font-bold p-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <button
            type="button"
            onClick={guardarEnBaseDeDatos}
            disabled={guardando}
            className="w-full py-4 bg-[#c4a77d] hover:bg-white text-[#1a1a1a] font-bold rounded-xl text-sm uppercase tracking-wider shadow-xl transition disabled:opacity-50"
          >
            {guardando ? 'Guardando en Servidor...' : 'Guardar Producto'}
          </button>
        </div>

        <aside>
          <div className="bg-[#2d2d2d] p-6 rounded-2xl border-2 border-[#c4a77d] space-y-6 sticky top-8">
            <h2 className="text-center text-xs uppercase font-bold text-[#c4a77d] tracking-widest">
              Análisis Financiero
            </h2>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-gray-700">
              <span className="block text-xs text-gray-400">Costo Total Producción</span>
              <span className="text-2xl font-extrabold text-white">{formatoCOP.format(costoTotal)}</span>
            </div>

            <div className="bg-[#1a1a1a] p-4 rounded-xl border border-emerald-900/50">
              <span className="block text-xs text-emerald-400">Ganancia Bruta Est.</span>
              <span className="text-2xl font-extrabold text-emerald-400">{formatoCOP.format(ganancia)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a] p-3 rounded-xl text-center border border-gray-700">
                <span className="block text-[10px] text-gray-400 uppercase">Margen</span>
                <span className="text-xl font-bold text-[#c4a77d]">{margen.toFixed(1)}%</span>
              </div>
              <div className="bg-[#1a1a1a] p-3 rounded-xl text-center border border-gray-700">
                <span className="block text-[10px] text-gray-400 uppercase">Markup</span>
                <span className="text-xl font-bold text-gray-300">{markup.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Exportación envuelta en Suspense para Vercel
export default function FormularioProductoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-[#c4a77d] font-bold">
          Cargando formulario...
        </div>
      }
    >
      <FormularioProductoContent />
    </Suspense>
  );
}