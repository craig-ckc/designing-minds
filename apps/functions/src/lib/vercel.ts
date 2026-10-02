/* -------------------------------------------------------------------------
   Vercel deployment status for the WEB project.

   The Deploy Hook that starts a build only answers "job accepted" — it never
   says whether the build is running, finished or failed. To report that to an
   editor, this reads the project's production deployments from the Vercel
   REST API and picks the one created after the publish was requested.

   Needs a Vercel access token scoped to the team that owns the web project.
   It is a secret (it can read every deployment) so it stays server-side.
   Without it, status is 'unconfigured' and the admin falls back to watching
   the site's build-info.json, which can say "live" but never "building" or
   "failed".
   ------------------------------------------------------------------------- */

export type DeploymentState = 'unconfigured' | 'pending' | 'queued' | 'building' | 'ready' | 'error' | 'canceled'

export interface DeploymentStatus {
  state: DeploymentState
  /** Vercel deployment id, once one exists. */
  id?: string
  /** Link to the build in the Vercel dashboard, for "see what failed". */
  inspectorUrl?: string | null
  /** When Vercel created / finished the deployment (ms epoch). */
  createdAt?: number
  readyAt?: number | null
}

interface VercelDeployment {
  uid: string
  state?: string
  readyState?: string
  created: number
  ready?: number | null
  inspectorUrl?: string | null
}

/** Vercel's own vocabulary → the four words an editor needs. */
export function mapVercelState(raw: string | undefined): DeploymentState {
  switch ((raw ?? '').toUpperCase()) {
    case 'QUEUED':
    case 'INITIALIZING':
      return 'queued'
    case 'BUILDING':
      return 'building'
    case 'READY':
      return 'ready'
    case 'ERROR':
      return 'error'
    case 'CANCELED':
      return 'canceled'
    default:
      return 'pending'
  }
}

/**
 * Clock skew allowance: `since` comes from this server's clock, Vercel stamps
 * `created` with its own. A deployment created a few seconds "before" the
 * request is still ours.
 */
const SKEW_MS = 10_000

/**
 * The newest production deployment of the web project created at or after
 * `since`. 'pending' means the hook was accepted but Vercel hasn't created the
 * deployment yet — normal for the first few seconds.
 */
export async function fetchDeploymentStatus(
  since: number,
  fetchImpl: typeof fetch = fetch,
  env: Record<string, string | undefined> = process.env,
): Promise<DeploymentStatus> {
  const token = env.VERCEL_API_TOKEN
  const projectId = env.VERCEL_WEB_PROJECT_ID
  if (!token || !projectId) return { state: 'unconfigured' }

  const params = new URLSearchParams({
    projectId,
    target: 'production',
    limit: '5',
    since: String(Math.max(0, since - SKEW_MS)),
  })
  if (env.VERCEL_TEAM_ID) params.set('teamId', env.VERCEL_TEAM_ID)

  const response = await fetchImpl(`https://api.vercel.com/v6/deployments?${params}`, {
    headers: { authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error(`Vercel deployments request failed (${response.status}).`)

  const body = (await response.json()) as { deployments?: VercelDeployment[] }
  const ours = (body.deployments ?? [])
    .filter((deployment) => deployment.created >= since - SKEW_MS)
    .sort((a, b) => b.created - a.created)[0]
  if (!ours) return { state: 'pending' }

  return {
    state: mapVercelState(ours.readyState ?? ours.state),
    id: ours.uid,
    inspectorUrl: ours.inspectorUrl ?? null,
    createdAt: ours.created,
    readyAt: ours.ready ?? null,
  }
}
