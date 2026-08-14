'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, ArrowLeft } from 'lucide-react'
import { theme as C } from '../theme'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const router = useRouter()
  async function entrar() {
    if (!usuario || !senha) return setErro('Preencha usuario e senha')
    setCarregando(true)
    setErro('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    })
    const data = await res.json()
    if (data.ok) {
      document.cookie = 'logado=true; path=/; max-age=86400'
      router.push('/pmo')
    } else {
      setErro(data.erro || 'Erro ao fazer login')
    }
    setCarregando(false)
  }
  function teclaEnter(e) {
    if (e.key === 'Enter') entrar()
  }
  return (
    <div style={{ fontFamily: 'var(--font-nunito), Arial, sans-serif', minHeight: '100vh', background: C.fundo, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '16px', boxSizing: 'border-box' }}>
      <a href="/inicio" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: `1px solid ${C.borda}`, borderRadius: '8px', color: C.navy, fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
        <ArrowLeft size={14} /> Voltar para Inicio
      </a>
      <div style={{ background: 'white', borderRadius: '12px', padding: '40px 32px', width: '100%', maxWidth: '380px', border: `1px solid ${C.borda}`, borderTop: `3px solid ${C.royal}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: C.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={22} color="white" />
          </div>
          <h1 style={{ color: C.texto, fontSize: '20px', margin: '0 0 6px', fontWeight: 700 }}>Sistema de Melhoria</h1>
          <p style={{ color: C.textoMudo, fontSize: '14px', margin: 0 }}>Faca login para continuar</p>
        </div>
        <input
          placeholder="Usuario"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          onKeyDown={teclaEnter}
          style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: C.texto }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={teclaEnter}
          style={{ width: '100%', padding: '11px', border: `1px solid ${C.borda}`, borderRadius: '8px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', color: C.texto }}
        />
        {erro && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
            <p style={{ color: C.vermelho, fontSize: '13px', margin: 0 }}>{erro}</p>
          </div>
        )}
        <button
          onClick={entrar}
          disabled={carregando}
          className="btn-hover"
          style={{ width: '100%', padding: '13px', background: carregando ? C.textoMudo : C.navy, color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 700 }}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
