'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  ShoppingCart,
  Package,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Plus,
  Menu,
  X,
  Sun,
  Moon,
  MoreHorizontal,
} from 'lucide-react';
import { useWorkshop } from '../context/WorkshopContext';
import { BRAND_ASSETS } from '../mocks/seedData';
import { ImageWithFallback } from '../components/common/ImageWithFallback';
import { ToastContainer } from '../components/common/ToastContainer';
import { logout } from '../../app/login/actions';

interface NavItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', shortLabel: 'Inicio', icon: LayoutDashboard },
  { to: '/reparaciones', label: 'Reparaciones', shortLabel: 'Taller', icon: Wrench },
  { to: '/ventas', label: 'Ventas (POS)', shortLabel: 'POS', icon: ShoppingCart },
  { to: '/inventario', label: 'Inventario', shortLabel: 'Stock', icon: Package },
  { to: '/compras-gastos', label: 'Compras y gastos', shortLabel: 'Gastos', icon: Receipt },
  { to: '/clientes', label: 'Clientes y motos', shortLabel: 'Clientes', icon: Users },
  { to: '/reportes', label: 'Reportes', shortLabel: 'Reportes', icon: BarChart3 },
  { to: '/configuracion', label: 'Configuración', shortLabel: 'Ajustes', icon: Settings },
];

const ROUTE_TITLES: { match: string; title: string; subtitle: string }[] = [
  { match: '/reparaciones/nueva', title: 'Nueva reparación', subtitle: 'Ingreso de motocicleta al taller' },
  { match: '/reparaciones/', title: 'Detalle de reparación', subtitle: 'Orden de servicio, repuestos y pagos' },
  { match: '/reparaciones', title: 'Reparaciones', subtitle: 'Órdenes de servicio y estado de bahías' },
  { match: '/ventas', title: 'Ventas rápidas (POS)', subtitle: 'Facturación de mostrador e historial' },
  { match: '/inventario', title: 'Inventario de repuestos', subtitle: 'Catálogo, existencias y movimientos' },
  { match: '/compras-gastos', title: 'Compras y gastos', subtitle: 'Almacén, compras directas y operación' },
  { match: '/clientes/', title: 'Perfil del cliente', subtitle: 'Garaje de motocicletas e historial' },
  { match: '/clientes', title: 'Clientes y motocicletas', subtitle: 'Directorio de pilotos y unidades' },
  { match: '/reportes', title: 'Estadísticas y reportes', subtitle: 'Ingresos, costos y resultado estimado' },
  { match: '/configuracion', title: 'Configuración', subtitle: 'Datos del taller, pagos y equipo' },
  { match: '/', title: 'Inicio / Dashboard', subtitle: 'Resumen diario y operativo del taller' },
];

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, toggleTheme, repairs } = useWorkshop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const routeMeta =
    ROUTE_TITLES.find((r) =>
      r.match === '/' ? pathname === '/' : pathname.startsWith(r.match)
    ) ?? ROUTE_TITLES[ROUTE_TITLES.length - 1];

  const activeRepairsCount = repairs.filter(
    (r) => r.status !== 'entregada'
  ).length;

  const isRepairsRoute = pathname.startsWith('/reparaciones');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F6F8] dark:bg-[#0B0E14] text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside
        aria-label="Navegación principal"
        className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-[#0F141C] text-slate-100 border-r border-slate-800/80 z-30"
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800/80 shrink-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-700">
            <ImageWithFallback
              src={BRAND_ASSETS.logo}
              alt="Logo Zona Racing"
              className="w-full h-full object-contain p-0.5"
            />
          </div>
          <div className="min-w-0">
            <span className="font-display text-xl font-bold tracking-wide uppercase text-white block leading-none">
              {settings.workshopName}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              Gestión de Taller
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={`group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  (item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`))
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.to === '/reparaciones' && activeRepairsCount > 0 && (
                  <span className="font-mono-num text-[11px] font-semibold opacity-85">
                    {activeRepairsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tema visual</span>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={settings.theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 transition-colors whitespace-nowrap shrink-0"
            >
              {settings.theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Oscuro</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Prototipo frontend · Datos locales de demostración
          </p>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar (Desktop 64px, Mobile 52px) */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-[#131822]/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 h-13 lg:h-16 px-4 lg:px-8 flex items-center justify-between gap-4">
          {/* Zone 1: Brand/Menu on mobile, Page title on desktop */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú de módulos"
              className="lg:hidden min-w-[40px] min-h-[40px] -ml-2 flex items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="lg:hidden w-7 h-7 rounded-md overflow-hidden bg-white border border-slate-200 shrink-0">
              <ImageWithFallback
                src={BRAND_ASSETS.logo}
                alt="Zona Racing"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm lg:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {routeMeta.title}
              </h1>
              <p className="hidden lg:block text-xs text-slate-500 dark:text-slate-400 truncate">
                {routeMeta.subtitle}
              </p>
            </div>
          </div>

          {/* Zone 2 & 3: Single Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={settings.theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {!pathname.startsWith('/reparaciones/nueva') && (
              <button
                type="button"
                onClick={() =>
                  router.push(isRepairsRoute ? '/reparaciones/nueva' : '/ventas')
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
              >
                <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {isRepairsRoute ? 'Nueva reparación' : 'Venta rápida POS'}
                </span>
                <span className="sm:hidden">
                  {isRepairsRoute ? 'Nueva' : 'POS'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-10 max-w-[1400px] w-full mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar (56px height, total sticky <= 13% of 844px) */}
      <nav
        aria-label="Navegación móvil inferior"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 dark:bg-[#131822]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              href={item.to}
              className={`flex flex-col items-center justify-center h-full text-[10px] font-semibold transition-colors ${
                (item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`))
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
              <span className="truncate">{item.shortLabel}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Más módulos"
          className={`flex flex-col items-center justify-center h-full text-[10px] font-semibold transition-colors ${
            mobileMenuOpen
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" aria-hidden="true" />
          <span>Más</span>
        </button>
      </nav>

      {/* Mobile Full Module Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de módulos Zona Racing"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] bg-[#0F141C] text-slate-100 h-full flex flex-col border-r border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-white p-0.5">
                  <ImageWithFallback
                    src={BRAND_ASSETS.logo}
                    alt="Zona Racing"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="font-display text-lg font-bold tracking-wide uppercase text-white">
                  {settings.workshopName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    href={item.to}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      (item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`))
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
              {settings.address}
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
      <form action={logout} className="fixed bottom-20 right-3 z-30 lg:bottom-4 lg:right-4"><button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-100">Cerrar sesión</button></form>
    </div>
  );
};
