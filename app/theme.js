export const theme = {
  navy:      '#0f132e',
  royal:     '#A9762C',
  blue:      '#536d88',
  fundo:     '#F4F6F9',
  borda:     '#E4E9F1',
  bordaForte:'#C9D2DF',
  texto:     '#151A2E',
  textoSec:  '#5B6B85',
  textoMudo: '#93A0B4',
  branco:    '#FFFFFF',
  verde:     '#16A34A',
  ambar:     '#F59E0B',
  vermelho:  '#DC2626',
  roxo:      '#7C3AED',

  // texto legivel sobre o dourado/bronze de destaque (botoes, badges)
  textoSobreAccent: '#FFFFFF',
  // azul de status estavel, independente da cor de marca (usado em "em andamento")
  statusInfo: '#1E5BC6',

  // sidebar / shell — continua escura, e o unico elemento escuro do sistema
  sidebarBg:        '#0f132e',
  sidebarBgHover:   'rgba(234,193,149,0.08)',
  sidebarActive:    '#eac195',
  sidebarText:      '#F2EFE9',
  sidebarTextMuted: '#b49b85',

  // aliases usados por telas antigas
  fundoLegado: '#F4F6F9',
  cabecalho:   '#0f132e',
  acento:      '#A9762C',
  acentoClaro: '#C79A52',
}

export const botaoVoltar = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '7px 16px',
  background: '#FFFFFF',
  border: '1px solid #E4E9F1',
  borderRadius: '8px',
  color: '#A9762C',
  fontSize: '13px',
  textDecoration: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-nunito), Arial, sans-serif',
}

export const estiloCard = {
  background: '#FFFFFF',
  border: '1px solid #E4E9F1',
  borderRadius: '14px',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 2px 6px rgba(15,23,42,0.04), 0 12px 24px -12px rgba(15,23,42,0.12)',
}

export const estiloEyebrow = {
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: '#7B8CA6',
  margin: '0 0 10px',
}

export const estiloStatNumero = {
  fontSize: '32px',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#151A2E',
  margin: '0 0 4px',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.1,
}

export const botaoPrimario = {
  background: '#A9762C',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 700,
}

export const SIDEBAR_WIDTH = 232
