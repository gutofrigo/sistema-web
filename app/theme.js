export const theme = {
  navy:      '#0f132e',
  royal:     '#eac195',
  blue:      '#536d88',
  fundo:     '#0f132e',
  borda:     'rgba(83,109,136,0.35)',
  bordaForte:'#536d88',
  texto:     '#F2EFE9',
  textoSec:  '#b49b85',
  textoMudo: '#536d88',
  branco:    '#19274e',
  verde:     '#16A34A',
  ambar:     '#F59E0B',
  vermelho:  '#DC2626',
  roxo:      '#7C3AED',

  // texto legivel sobre o dourado (botoes/badges com fundo "royal")
  textoSobreAccent: '#0f132e',
  // azul de status estavel, independente da cor de marca (usado em "em andamento")
  statusInfo: '#1E5BC6',

  // sidebar / shell
  sidebarBg:        '#0f132e',
  sidebarBgHover:   'rgba(234,193,149,0.08)',
  sidebarActive:    '#eac195',
  sidebarText:      '#F2EFE9',
  sidebarTextMuted: '#b49b85',

  // aliases usados por telas antigas
  fundoLegado: '#0f132e',
  cabecalho:   '#0f132e',
  acento:      '#eac195',
  acentoClaro: '#f2d2a6',
}

export const botaoVoltar = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 16px',
  background: '#19274e',
  border: '1px solid rgba(83,109,136,0.35)',
  borderRadius: '8px',
  color: '#eac195',
  fontSize: '13px',
  textDecoration: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-nunito), Arial, sans-serif',
}

export const estiloCard = {
  background: '#19274e',
  border: '1px solid rgba(83,109,136,0.35)',
  borderRadius: '14px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.18), 0 12px 24px -12px rgba(0,0,0,0.35)',
}

export const estiloEyebrow = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#b49b85',
  margin: '0 0 10px',
}

export const estiloStatNumero = {
  fontSize: '32px',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#F2EFE9',
  margin: '0 0 4px',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.1,
}

export const botaoPrimario = {
  background: '#eac195',
  color: '#0f132e',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
}

export const SIDEBAR_WIDTH = 232
