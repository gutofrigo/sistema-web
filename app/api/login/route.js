export async function POST(req) {
  try {
    const body = await req.json()
    const { usuario, senha } = body
    if (
      usuario === process.env.LOGIN_USUARIO &&
      senha === process.env.LOGIN_SENHA
    ) {
      return Response.json({ ok: true })
    }
    return Response.json({ erro: 'Usuario ou senha incorretos' }, { status: 401 })
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 500 })
  }
}