"use client"

import { useState } from "react"
import {
  BarChart3,
  Bell,
  Headphones,
  LayoutDashboard,
  Lock,
  LogOut,
  Map,
  Menu,
  Moon,
  Sun,
  UserRound,
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
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/database"

interface SidebarProps {
  user: Profile | null
  totalProgress?: number
  hasEnrollment?: boolean
}

const navigation = [
  { name: "Mi ruta", href: "/curso", icon: Map, requiresPaid: false },
  { name: "Progreso", href: "/progreso", icon: BarChart3, requiresPaid: true },
  { name: "Soporte", href: "/mensajes", icon: Headphones, requiresPaid: true },
  { name: "Comunidad", href: "/comunidad", icon: UsersRound, requiresPaid: true },
  { name: "Novedades", href: "/anuncios", icon: Bell, requiresPaid: true },
  { name: "Perfil", href: "/perfil", icon: UserRound, requiresPaid: false },
] as const

function getInitials(name?: string | null): string {
  if (!name) return "PI"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function Sidebar({ user, totalProgress = 0, hasEnrollment = true }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const logout = async () => {
    const { error } = await createClient().auth.signOut()
    if (error) {
      toast.error("No pudimos cerrar la sesión")
      return
    }
    toast.success("Sesión cerrada")
    router.push("/login")
    router.refresh()
  }

  const sidebar = (
    <aside className="flex h-full w-[17rem] flex-col border-r border-ink/10 bg-white/55 backdrop-blur-sm">
      <div className="px-7 py-7">
        <BrandLogo href="/curso" className="text-[2.7rem]" />
      </div>

      <nav className="flex-1 space-y-1 px-4 py-3" aria-label="Navegación principal">
        {navigation.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const locked = item.requiresPaid && !hasEnrollment
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-indigo text-white shadow-[0_10px_30px_rgba(52,55,217,0.17)]"
                  : "text-muted-foreground hover:bg-paper hover:text-ink"
              )}
            >
              <Icon className="h-[1.15rem] w-[1.15rem]" />
              <span>{item.name}</span>
              {locked && <Lock className="ml-auto h-3.5 w-3.5 opacity-70" />}
            </Link>
          )
        })}

        {user?.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-paper hover:text-ink"
          >
            <LayoutDashboard className="h-[1.15rem] w-[1.15rem]" /> Administrar
          </Link>
        )}
      </nav>

      {hasEnrollment && (
        <div className="mx-5 mb-5 border-y border-ink/10 py-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Tu avance</p>
              <p className="mt-1 font-display text-3xl">{totalProgress}%</p>
            </div>
            <span className="text-xs text-muted-foreground">Seguí así</span>
          </div>
          <Progress value={totalProgress} aria-label={`${totalProgress}% de la ruta recorrida`} className="h-1.5" />
        </div>
      )}

      <div className="border-t border-ink/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar className="h-10 w-10 border border-ink/10">
            <AvatarImage src={user?.avatar_url || undefined} alt="" />
            <AvatarFallback className="bg-indigo text-xs text-white">{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user?.full_name || "Estudiante Pibo"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-muted-foreground"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            {resolvedTheme === "dark" ? "Claro" : "Oscuro"}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={logout} aria-label="Cerrar sesión">
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
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/35 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Cerrar menú"
        />
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
