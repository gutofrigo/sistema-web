'use client'
import Sidebar from './Sidebar'
import { theme as C } from '../theme'

export default function AppShell({ title, subtitle, actions, children }) {
  return (
    <div style={{ fontFamily: 'var(--font-nunito), Arial, sans-serif', minHeight: '100vh', background: C.fundo }}>
      <Sidebar />
      <div className="app-content">
        <div className="app-header" style={{ background: C.navy, borderBottom: `1px solid rgba(255,255,255,0.08)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            {subtitle && <p style={{ color: C.sidebarTextMuted, fontSize: '12px', margin: '0 0 2px' }}>{subtitle}</p>}
            <h1 style={{ color: '#FFFFFF', fontSize: '19px', fontWeight: 700, margin: 0 }}>{title}</h1>
          </div>
          {actions && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
