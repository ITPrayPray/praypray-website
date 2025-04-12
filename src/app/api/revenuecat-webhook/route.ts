import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** 你的 Supabase 環境變數 */
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
})

// 你的預期的 Authorization Token（可在 RevenueCat Webhook 設定中加上一個 Authorization Header）
// 假設我們用 "Bearer secret_revenuecat" 作範例
const REVENUECAT_WEBHOOK_TOKEN = process.env.REVENUECAT_WEBHOOK_TOKEN || 'secret_revenuecat'

export async function POST(req: NextRequest) {
  try {
    // 1. 驗證請求 Header 或 Token
    const authorization = req.headers.get('authorization')
    if (!authorization || authorization !== `Bearer ${REVENUECAT_WEBHOOK_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 解析 Body
    const body = await req.json()
    console.log('RevenueCat Webhook Body:', body)

    /* 
      Body 常見欄位(僅舉例):
      body.event.type = "INITIAL_PURCHASE" | "RENEWAL" | "EXPIRATION" | "CANCELLATION" ...
      body.app_user_id = "用戶在RevenueCat的ID"
      body.product_id = "proservice_monthly" (對應Stripe Price ID)
      ...
    */

    const event = body.event
    if (!event) {
      return NextResponse.json({ error: 'Missing event data' }, { status: 400 })
    }

    const { type, app_user_id, entitlement_id, product_id, expiration_at_ms } = event

    // 3. 根據 event.type 更新 Supabase DB
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        // 假設你想將 listing 狀態設為 pending_review 或 approved
        // 或者紀錄用戶的付費到期日(若為訂閱)
        // 例如:
        await supabase
          .from('listings')
          .update({ status: 'pending_review' })
          .eq('revenuecat_product_id', product_id)
        break

      case 'CANCELLATION':
      case 'EXPIRATION':
        // 若訂閱已取消/到期 → 可能將 listing 設為 expired / canceled
        await supabase
          .from('listings')
          .update({ status: 'canceled' })
          .eq('revenuecat_product_id', product_id)
        break

      default:
        // 其他事件: trial開始、升級/降級等
        break
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('RevenueCat Webhook Error:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}