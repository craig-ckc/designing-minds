import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mocks=vi.hoisted(()=>({rpc:vi.fn(),fetch:vi.fn()}))
vi.mock('../../apps/functions/src/lib/supabase.ts',()=>({createServiceClient:()=>({rpc:mocks.rpc})}))
vi.mock('../../apps/functions/src/lib/diagnostics.ts',()=>({logEvent:vi.fn()}))
import { promotionsCron } from '../../apps/functions/src/handlers/promotions-cron.ts'
const request=(headers:Record<string,string>={authorization:'Bearer local-cron-secret'})=>({method:'GET',headers,body:undefined})
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('SITE_URL','https://shop.example.com');vi.stubEnv('CRON_SECRET','local-cron-secret');vi.stubEnv('VERCEL_WEB_DEPLOY_HOOK_URL','https://hook.example.com');vi.stubGlobal('fetch',mocks.fetch);mocks.fetch.mockResolvedValue({ok:true,status:200});mocks.rpc.mockResolvedValueOnce({data:{token:'lease',state:'claimed',through:'2026-10-02T10:00:00Z'},error:null}).mockResolvedValue({data:true,error:null})})
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()})
it('requires an exact cron secret and fails closed when unconfigured',async()=>{
  expect((await promotionsCron(request({}))).status).toBe(401)
  expect((await promotionsCron(request({authorization:'Bearer wrong'}))).status).toBe(401)
  vi.stubEnv('CRON_SECRET','')
  expect((await promotionsCron(request())).status).toBe(503)
  expect(mocks.rpc).not.toHaveBeenCalled()
})
it('does nothing between sale boundaries and never publishes queued content',async()=>{
  mocks.rpc.mockReset().mockResolvedValue({data:null,error:null})
  expect(await promotionsCron(request())).toMatchObject({status:200,body:{state:'idle'}})
  expect(mocks.fetch).not.toHaveBeenCalled()
  expect(mocks.rpc).not.toHaveBeenCalledWith('publish_site_content')
})
it('triggers the hook once and acknowledges the leased boundaries',async()=>{
  expect(await promotionsCron(request())).toMatchObject({status:200,body:{state:'queued'}})
  expect(mocks.fetch).toHaveBeenCalledWith('https://hook.example.com',expect.objectContaining({method:'POST'}))
  expect(mocks.rpc).toHaveBeenLastCalledWith('mark_promotion_rebuild_requested',{p_token:'lease'})
})
it('releases failed hook requests for retry and hides infrastructure details',async()=>{
  mocks.fetch.mockResolvedValue({ok:false,status:503})
  expect((await promotionsCron(request())).status).toBe(503)
  expect(mocks.rpc).toHaveBeenLastCalledWith('finish_promotion_rebuild',{p_token:'lease',p_success:false})
})
it('does not consume a boundary if the deploy hook is not configured',async()=>{
  vi.stubEnv('VERCEL_WEB_DEPLOY_HOOK_URL','')
  expect((await promotionsCron(request())).status).toBe(503)
  expect(mocks.rpc).not.toHaveBeenCalled()
})

it('only acknowledges a sale boundary when the completed website build includes it',async()=>{
  mocks.rpc.mockReset().mockResolvedValueOnce({data:{token:'lease',state:'waiting',through:'2026-10-02T10:00:00Z'},error:null}).mockResolvedValue({data:true,error:null})
  mocks.fetch.mockResolvedValue({ok:true,json:async()=>({contentAt:'2026-10-02T10:01:00Z'})})
  expect(await promotionsCron(request())).toMatchObject({status:200,body:{state:'ready'}})
  expect(mocks.fetch).toHaveBeenCalledWith(expect.stringContaining('/build-info.json'),expect.objectContaining({cache:'no-store'}))
  expect(mocks.rpc).toHaveBeenLastCalledWith('finish_promotion_rebuild',{p_token:'lease',p_success:true})
})
it('keeps an old or temporarily unavailable website build pending for subsequent checks',async()=>{
  mocks.rpc.mockReset().mockResolvedValue({data:{token:'lease',state:'waiting',through:'2026-10-02T10:00:00Z'},error:null})
  mocks.fetch.mockResolvedValue({ok:true,json:async()=>({contentAt:'2026-10-02T09:59:59Z'})})
  expect(await promotionsCron(request())).toMatchObject({status:200,body:{state:'waiting'}})
  expect(mocks.rpc).not.toHaveBeenCalledWith('finish_promotion_rebuild',expect.anything())
})
