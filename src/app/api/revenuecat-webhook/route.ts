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

    // Prefix unused variables with underscore
    const { type, product_id } = event

    // Log the used variables
    console.log(`Processing webhook event type: ${type}, product_id: ${product_id}`);

    // 3. 根據 event.type 更新 Supabase DB
    switch (type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
        // Use product_id for matching
        await supabase
          .from('listings')
          .update({ status: 'pending_review' })
          // TODO: Update based on listing_id (external_id) passed from paywall instead of product_id?
          // Or use app_user_id if that links to owner?
          .eq('revenuecat_product_id', product_id) // This might affect multiple listings if product_id is reused
        break

      case 'CANCELLATION':
      case 'EXPIRATION':
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
  } catch (error: unknown) {
    console.error('RevenueCat Webhook Error:', error)
    const message = error instanceof Error ? error.message : 'Server Error';
    return NextResponse.json({ error: message }, { status: 500 })
  }
}