'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  LogOut,
  Menu,
  Zap,
  Tag,
  Truck,
} from 'lucide-react';

const ADMIN_EMAIL = 'shehrozhameed61@gmail.com';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, href: '/powerhouse' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/powerhouse/orders' },
  { id: 'inventory', label: 'Products', icon: Package, href: '/powerhouse/inventory' },
  { id: 'bundles', label: 'Bundles', icon: Tag, href: '/powerhouse/bundles' },
  { id: 'categories', label: 'Categories', icon: Tag, href: '/powerhouse/categories' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/powerhouse/settings' },
];

export default function PowerhouseLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
      } else {
        router.replace('/admin/login');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        setAdminEmail(session.user.email);
      } else {
        router.replace('/admin/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  if (!adminEmail) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading Powerhouse...</p>
        </div>
      </div>
    );
  }

  const isAdmin = adminEmail === ADMIN_EMAIL || adminEmail.startsWith('shehrozhameed61+');
  
  if (!isAdmin) {
    router.replace('/admin/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-30 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Powerhouse</p>
              <p className="text-xs text-gray-500">Admin Console</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/powerhouse' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">{adminEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all w-full"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-4 p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <Menu size={18} />
          </button>
          <h1 className="font-bold text-red-400">Powerhouse</h1>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
