'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const verificarSesion = async () => {
      // Usamos getUser() para validar la autenticidad del token con el servidor
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    verificarSesion();

    // Listener para redirección inmediata si el usuario inicia/cierra sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#c4a77d]"></div>
        <span className="text-xs text-gray-400 font-medium">Cargando aplicación...</span>
      </div>
    </div>
  );
}