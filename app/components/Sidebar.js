'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, FolderKanban, Kanban, FileText, TrendingUp, Map, GanttChartSquare, Wallet, Sparkles, Workflow, LogOut, Menu, X } from 'lucide-react'
import { theme as C } from '../theme'

const MODULOS = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/projetos', label: 'Projetos', icon: FolderKanban },
  { href: '/iniciativas', label: 'Iniciativas', icon: Kanban },
  { href: '/notas', label: 'Notas', icon: FileText },
  { href: '/pmo', label: 'PMO / Dashboard', icon: TrendingUp },
  { href: '/roadmap', label: 'Roadmap', icon: Map },
  { href: '/gantt', label: 'Gantt', icon: GanttChartSquare },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/assistente', label: 'Assistente IA', icon: Sparkles },
  { href: '/bpmn', label: 'BPMN', icon: Workflow },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [aberta, setAberta] = useState(false)

  function sair() {
    document.cookie = 'logado=; path=/; max-age=0'
    router.push('/login')
  }

  return (
    <>
      <button
        className="app-sidebar-toggle"
        onClick={() => setAberta(true)}
        style={{ position: 'fixed', top: '14px', left: '14px', zIndex: 41, background: C.navy, color: 'white', border: 'none', borderRadius: '8px', width: '38px', height: '38px', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <Menu size={18} />
      </button>

      {aberta && <div className="app-sidebar-overlay" onClick={() => setAberta(false)} />}

      <aside className={'app-sidebar' + (aberta ? ' aberta' : '')} style={{ background: C.sidebarBg, display: 'flex', flexDirection: 'column', padding: '20px 14px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0 8px 20px', marginBottom: '20px', borderBottom: '1px solid rgba(234,193,149,0.14)' }}>
          <div>
            <p style={{ color: C.sidebarTextMuted, fontSize: '11px', margin: '0 0 2px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Sistema de Melhoria</p>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: 700, margin: 0 }}>Gestao de Projetos</p>
          </div>
          <button onClick={() => setAberta(false)} className="app-sidebar-toggle" style={{ background: 'none', border: 'none', color: C.sidebarTextMuted, cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {MODULOS.map(m => {
            const ativo = pathname === m.href
            const Icone = m.icon
            return (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => setAberta(false)}
                className="nav-link"
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px 9px 10px', borderRadius: '8px', textDecoration: 'none',
                  color: ativo ? '#0f132e' : C.sidebarTextMuted,
                  background: ativo ? C.sidebarActive : 'transparent',
                  fontSize: '13px', fontWeight: ativo ? 700 : 500,
                  boxShadow: ativo ? 'inset 3px 0 0 0 #0f132e, 0 2px 6px rgba(0,0,0,0.18)' : 'none',
                }}
              >
                <Icone size={17} />
                {m.label}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={sair}
          className="nav-link"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '8px', border: 'none', background: 'transparent', color: C.sidebarTextMuted, fontSize: '13px', cursor: 'pointer', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid rgba(234,193,149,0.14)', textAlign: 'left' }}
        >
          <LogOut size={17} />
          Sair
        </button>
      </aside>
    </>
  )
}
