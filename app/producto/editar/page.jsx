'use client';

import { Suspense } from 'react';
import FormularioProductoPage from '../nuevo/page'; // O la ruta donde tengas el formulario

export default function EditarProductoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Cargando editor...</div>}>
      <FormularioProductoPage />
    </Suspense>
  );
}