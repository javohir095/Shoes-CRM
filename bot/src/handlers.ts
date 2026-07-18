import type { Context } from 'telegraf'
import { findOrderByNumber, findOrdersByTelegramId, linkTelegramToOrder } from './db.js'
import { STATUS_LABELS } from './types.js'

function formatOrderMessage(order: {
  order_number: string
  customer_name: string
  status: string
  shoe_type: string
  service_type: string
  price: number
  created_at: string
}): string {
  const status = STATUS_LABELS[order.status] ?? order.status
  const date = new Date(order.created_at).toLocaleDateString('uz-UZ')

  return (
    `📦 *Buyurtma ma'lumotlari*\n\n` +
    `🔢 Raqam: \`${order.order_number}\`\n` +
    `👤 Mijoz: ${order.customer_name}\n` +
    `👟 Oyoq kiyim: ${order.shoe_type}\n` +
    `🔧 Xizmat: ${order.service_type}\n` +
    `📊 Holat: *${status}*\n` +
    `💰 Narx: ${order.price.toLocaleString()} so'm\n` +
    `📅 Qabul qilingan: ${date}`
  )
}

export async function handleStart(ctx: Context) {
  const telegramId = String(ctx.from?.id)

  // Deep-link from a scanned order QR code: /start SH-YYYYMMDD-XXXX
  const startText = ctx.message && 'text' in ctx.message ? ctx.message.text : ''
  const startPayload = startText.replace(/^\/start(@\w+)?\s*/, '').trim()
  if (startPayload && /^SH-\d{8}-\d{4}$/i.test(startPayload)) {
    const order = await findOrderByNumber(startPayload.toUpperCase())
    if (order) {
      if (!order.telegram_id) {
        await linkTelegramToOrder(order.id, telegramId)
      }
      await ctx.reply(formatOrderMessage(order), { parse_mode: 'Markdown' })
      return
    }
    await ctx.reply(
      `❌ "${startPayload}" raqamli buyurtma topilmadi.`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Check if user has existing orders
  const existingOrders = await findOrdersByTelegramId(telegramId)

  if (existingOrders.length > 0) {
    const activeOrders = existingOrders.filter(
      (o) => o.status !== 'topshirildi' && o.status !== 'bekor_qilindi'
    )

    if (activeOrders.length > 0) {
      const orderList = activeOrders
        .map((o) => `• \`${o.order_number}\` — ${STATUS_LABELS[o.status] ?? o.status}`)
        .join('\n')

      await ctx.reply(
        `Salom, ${ctx.from?.first_name ?? 'Hurmatli mijoz'}! 👋\n\n` +
          `Sizning faol buyurtmalaringiz:\n\n${orderList}\n\n` +
          `Boshqa buyurtmani tekshirish uchun raqamini yuboring.`,
        { parse_mode: 'Markdown' }
      )
      return
    }
  }

  await ctx.reply(
    `Assalomu alaykum, ${ctx.from?.first_name ?? 'hurmatli mijoz'}! 👟\n\n` +
      `*SoleCare* botiga xush kelibsiz.\n\n` +
      `Buyurtmangiz holati haqida ma'lumot olish uchun buyurtma raqamini yuboring.\n\n` +
      `_Misol: SH-20260820-0001_`,
    { parse_mode: 'Markdown' }
  )
}

export async function handleText(ctx: Context) {
  if (!ctx.message || !('text' in ctx.message)) return

  const text = ctx.message.text.trim()
  const telegramId = String(ctx.from?.id)

  // Check if it looks like an order number
  if (/^SH-\d{8}-\d{4}$/i.test(text)) {
    const order = await findOrderByNumber(text.toUpperCase())

    if (!order) {
      await ctx.reply(
        `❌ "${text}" raqamli buyurtma topilmadi.\n\nIltimos, raqamni to'g'ri kiriting.\n_Misol: SH-20260820-0001_`,
        { parse_mode: 'Markdown' }
      )
      return
    }

    // Link telegram to order if not already linked
    if (!order.telegram_id) {
      await linkTelegramToOrder(order.id, telegramId)
    }

    await ctx.reply(formatOrderMessage(order), { parse_mode: 'Markdown' })
    return
  }

  // Default response
  await ctx.reply(
    `Buyurtma raqamini yuboring.\n\n_Misol: SH-20260820-0001_`,
    { parse_mode: 'Markdown' }
  )
}

export function getReadyNotificationText(orderNumber: string): string {
  return (
    `✅ *Assalomu alaykum!*\n\n` +
    `Sizning buyurtmangiz tayyor!\n\n` +
    `📦 Buyurtma raqami: \`${orderNumber}\`\n\n` +
    `Iltimos, filialga tashrif buyuring va buyurtmangizni olib keting. 🙏`
  )
}
