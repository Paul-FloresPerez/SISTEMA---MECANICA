import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Zona Racing — Gestión de Taller de Motocicletas',
  description:
    'Sistema de gestión integral para taller de motocicletas Zona Racing: reparaciones, ventas rápidas POS, inventario, compras, gastos, clientes y reportes.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F5F6F8] text-[#111827] antialiased selection:bg-rose-600/15 selection:text-rose-700 dark:bg-[#0B0E14] dark:text-[#F3F4F6]">
        {children}
      </body>
    </html>
  );
}
