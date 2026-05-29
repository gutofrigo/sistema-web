'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
      router.push('/')
    } else {
      setErro(data.erro || 'Erro ao fazer login')
    }
    setCarregando(false)
  }
  function teclaEnter(e) {
    if (e.key === 'Enter') entrar()
  }
  return (
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '48px 40px', width: '380px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <h1 style={{ color: '#1e293b', fontSize: '22px', margin: '0 0 6px' }}>Sistema de Melhoria</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Faca login para continuar</p>
        </div>
        <input
          placeholder="Usuario"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          onKeyDown={teclaEnter}
          style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '12px', boxSizing: 'border-box', color: '#1e293b' }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={teclaEnter}
          style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', marginBottom: '20px', boxSizing: 'border-box', color: '#1e293b' }}
        />
        {erro && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{erro}</p>
          </div>
        )}
        <button
          onClick={entrar}
          disabled={carregando}
          style={{ width: '100%', padding: '14px', background: carregando ? '#a5b4fc' : '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}