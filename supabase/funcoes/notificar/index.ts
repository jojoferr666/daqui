// =====================================================================================
// Daqui — função "notificar" (Supabase Edge Function)
// Recebe mensagens já escritas pela base de dados (supabase/05-notificacoes.sql) e envia-as
// para os telemóveis através do Firebase Cloud Messaging (FCM, API HTTP v1).
//
// Onde: Supabase → Edge Functions → Deploy a new function → Via Editor → nome: notificar
//       → colar este ficheiro → Deploy. Depois, nos detalhes da função, DESLIGUE "Verify JWT".
// Segredos (Edge Functions → Secrets):
//   FIREBASE_SERVICE_ACCOUNT = o conteúdo inteiro do ficheiro .json da conta de serviço do Firebase
//   DAQUI_SEGREDO            = um texto longo à sua escolha (o mesmo que põe no 05-notificacoes.sql)
// Pedido esperado: POST { "mensagens": [ { "token", "titulo", "texto", "rota" } ] } com o cabeçalho x-daqui-segredo.
// =====================================================================================

const conta = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}');
const SEGREDO = Deno.env.get('DAQUI_SEGREDO') ?? '';
const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// token de acesso do Google a partir da conta de serviço (JWT assinado com RS256), guardado durante ~50 minutos
let cache: { token: string; ate: number } | null = null;
export async function tokenGoogle(): Promise<string> {
  if (cache && cache.ate > Date.now()) return cache.token;
  const agora = Math.floor(Date.now() / 1000);
  const parte = (o: unknown) => b64url(enc.encode(JSON.stringify(o)));
  const semAssinatura = `${parte({ alg: 'RS256', typ: 'JWT' })}.${parte({
    iss: conta.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token', iat: agora, exp: agora + 3600,
  })}`;
  const pem = String(conta.private_key ?? '').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const chave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const assinatura = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave, enc.encode(semAssinatura)));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${semAssinatura}.${b64url(assinatura)}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Google OAuth: ' + JSON.stringify(j));
  cache = { token: j.access_token, ate: Date.now() + 50 * 60 * 1000 };
  return j.access_token;
}

type Mensagem = { token: string; titulo: string; texto: string; rota?: string };

export async function enviar(m: Mensagem, acesso: string): Promise<number> {
  const r = await fetch(`https://fcm.googleapis.com/v1/projects/${conta.project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acesso}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: m.token,
        notification: { title: m.titulo, body: m.texto },
        data: { rota: m.rota ?? '' },
        android: { priority: 'HIGH', notification: { color: '#3C6104', icon: 'ic_stat_daqui', channel_id: 'daqui_som', sound: 'daqui_notificacao' } },
      },
    }),
  });
  if (!r.ok) console.warn('FCM', r.status, (await r.text()).slice(0, 300));
  return r.status;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Daqui: função de notificações ativa.');
  if (!SEGREDO || req.headers.get('x-daqui-segredo') !== SEGREDO) return new Response('Segredo em falta ou errado', { status: 401 });
  if (!conta.client_email) return new Response('Falta o segredo FIREBASE_SERVICE_ACCOUNT', { status: 500 });
  let corpo: { mensagens?: Mensagem[] } = {};
  try { corpo = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }
  const lista = (corpo.mensagens ?? []).filter((m) => m && m.token);
  if (!lista.length) return Response.json({ enviadas: 0, total: 0 });
  const acesso = await tokenGoogle();
  const estados = await Promise.all(lista.map((m) => enviar(m, acesso)));
  return Response.json({ enviadas: estados.filter((s) => s === 200).length, total: lista.length, estados });
});
