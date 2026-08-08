import './globals.css';

export const metadata = {
  title: 'Don Paquito | Inventario de Costos',
  description: 'Sistema de cálculo de costo y margen de ganancia para hamburguesas y restaurantes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'paquito-black': '#1a1a1a',
                    'paquito-dark': '#2d2d2d',
                    'paquito-gold': '#c4a77d',
                    'paquito-red': '#e63946',
                    'paquito-green': '#2a9d8f',
                    'paquito-text': '#f1f1f1'
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body className="bg-[#1a1a1a] text-[#f1f1f1] min-h-screen font-sans antialiased">
        {children}
      </body>
    </html>
  );
}