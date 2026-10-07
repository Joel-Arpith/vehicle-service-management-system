// Pages Function: forwards /api/* to the FastAPI backend, so the browser stays
// same-origin (no CORS), exactly like the Vite dev proxy.
// The backend's address lives in KV (`api_origin`), written by scripts/tunnel.sh each time
// the tunnel starts, so a new tunnel URL needs no redeploy. API_ORIGIN overrides it.
interface Env { CONFIG: KVNamespace; API_ORIGIN?: string }

const down = (message: string) =>
  Response.json({ error: "backend_offline", message }, { status: 503 })

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const origin = env.API_ORIGIN ?? (await env.CONFIG.get("api_origin", { cacheTtl: 30 }))
  if (!origin) return down("The AutoCare server is not running. Start it with scripts/tunnel.sh.")

  const url = new URL(request.url)
  try {
    const res = await fetch(new Request(origin.replace(/\/$/, "") + url.pathname + url.search, request))
    // A dead quick tunnel answers 530/502 with an HTML page; turn that into JSON the UI can show.
    if (res.status === 530 || (res.status === 502 && !res.headers.get("content-type")?.includes("json"))) {
      return down("The AutoCare server is offline (the host machine may be asleep).")
    }
    return res
  } catch {
    return down("The AutoCare server could not be reached.")
  }
}
