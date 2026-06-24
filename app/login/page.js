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
    <div style={{ fontFamily: 'Arial', minHeight: '100vh', background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '16px', boxSizing: 'border-box' }}>
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: 'white', border: '1px solid #d6dbe0', borderRadius: '6px', color: '#2e4a63', fontSize: '13px', textDecoration: 'none', fontWeight: 'bold' }}>
        ← Voltar para Inicio
      </a>
      <div style={{ background: 'white', borderRadius: '8px', padding: '40px 32px', width: '100%', maxWidth: '380px', border: '1px solid #d6dbe0', borderLeft: '3px solid #2e4a63', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
          <h1 style={{ color: '#1c2b3a', fontSize: '20px', margin: '0 0 6px', fontWeight: 'bold' }}>Sistema de Melhoria</h1>
          <p style={{ color: '#8fa3b1', fontSize: '14px', margin: 0 }}>Faca login para continuar</p>
        </div>
        <input
          placeholder="Usuario"
          value={usuario}
          onChange={e => setUsuario(e.target.value)}
          onKeyDown={teclaEnter}
          style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', color: '#1c2b3a' }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyDown={teclaEnter}
          style={{ width: '100%', padding: '11px', border: '1px solid #d6dbe0', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', boxSizing: 'border-box', color: '#1c2b3a' }}
        />
        {erro && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
            <p style={{ color: '#dc2626', fontSize: '13px', margin: 0 }}>{erro}</p>
          </div>
        )}
        <button
          onClick={entrar}
          disabled={carregando}
          style={{ width: '100%', padding: '13px', background: carregando ? '#6b8fa3' : '#1c2b3a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '15px', cursor: carregando ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
