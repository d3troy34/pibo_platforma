"use client"

import { useState } from "react"
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Route,
  Sun,
  UserPlus,
  Users,
  UsersRound,
  X,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { BrandLogo } from "@/components/brand/brand-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface AdminSidebarProps {
  user: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  } | null
}

const navItems = [
  { label: "Resumen", href: "/admin", icon: LayoutDashboard },
  { label: "Estudiantes", href: "/admin/estudiantes", icon: Users },
  { label: "Invitar", href: "/admin/estudiantes/invitar", icon: UserPlus },
  { label: "Contenido", href: "/admin/contenido", icon: BookOpen },
  { label: "Mensajes", href: "/admin/mensajes", icon: MessageSquare },
  { label: "Comunidad", href: "/admin/comunidad", icon: UsersRound },
  { label: "Novedades", href: "/admin/anuncios", icon: Bell },
] as const

function getInitials(name?: string | null): string {
  if (!name) return "AD"
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2)
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const logout = async () => {
    const { error } = await createClient().auth.signOut()
    if (error) {
      toast.error("No pudimos cerrar la sesión")
      return
    }
    router.push("/login")
    router.refresh()
  }

  const sidebar = (
    <aside className="flex h-full w-[17rem] flex-col border-r border-ink/10 bg-ink text-white">
      <div className="border-b border-white/10 px-7 py-7">
        <BrandLogo href="/admin" onDark className="text-[2.7rem]" />
        <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/40">Administración</p>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-5" aria-label="Administración">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                active ? "bg-pink text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-[1.1rem] w-[1.1rem]" /> {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link href="/curso" className="mb-3 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">
          <Route className="h-4 w-4" /> Ver experiencia alumno
        </Link>

        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-3">
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={user?.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-indigo text-xs text-white">{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.full_name || "Admin Pibo"}</p>
            <p className="truncate text-xs text-white/40">{user?.email}</p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            {resolvedTheme === "dark" ? "Claro" : "Oscuro"}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-white/60 hover:bg-white/10 hover:text-pink" onClick={logout} aria-label="Cerrar sesión">
            <LogOut />
          </Button>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed left-4 top-4 z-[60] bg-white lg:hidden"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {isOpen && (
        <button type="button" className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} aria-label="Cerrar menú" />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebar}
      </div>
    </>
  )
}
