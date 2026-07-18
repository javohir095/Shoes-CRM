import 'dotenv/config'
import { Telegraf } from 'telegraf'
import { getAllCompaniesWithBots, updateCompanyBotUsername } from './db.js'
import { handleStart, handleText } from './handlers.js'
import type { Company } from './types.js'

// Registry of running bot instances keyed by company ID, along with the
// token each one was started with (so we can detect a token being edited).
const botRegistry = new Map<string, { bot: Telegraf; token: string }>()

/**
 * Start a bot instance for a single company.
 * Idempotent — calling with the same companyId AND token that's already
 * running is a no-op. If the token changed, the old instance is stopped
 * first and a fresh one is started with the new token.
 */
async function startCompanyBot(company: Company): Promise<void> {
  if (!company.bot_token) return

  const existing = botRegistry.get(company.id)
  if (existing) {
    if (existing.token === company.bot_token) return
    console.log(`[Bot] Token changed for company: ${company.name} — restarting`)
    stopCompanyBot(company.id)
  }

  console.log(`[Bot] Starting bot for company: ${company.name}`)

  const bot = new Telegraf(company.bot_token)

  bot.start((ctx) => handleStart(ctx, company.id))
  bot.on('text', (ctx) => handleText(ctx, company.id))

  bot.catch((err, ctx) => {
    console.error(`[Bot][${company.name}] Error for update ${ctx.update.update_id}:`, err)
  })

  // Persist the bot's @username so the frontend can build t.me deep links for QR codes.
  bot.telegram
    .getMe()
    .then((me) => {
      if (me.username && me.username !== company.bot_username) {
        return updateCompanyBotUsername(company.id, me.username)
      }
    })
    .catch((err) => console.error(`[Bot][${company.name}] getMe failed:`, err))

  // Launch in background
  bot.launch().catch((err) => {
    console.error(`[Bot][${company.name}] Launch failed:`, err)
    botRegistry.delete(company.id)
  })

  botRegistry.set(company.id, { bot, token: company.bot_token })
  console.log(`[Bot] ✅ Bot started for: ${company.name}`)
}

function stopCompanyBot(companyId: string): void {
  const entry = botRegistry.get(companyId)
  if (entry) {
    entry.bot.stop()
    botRegistry.delete(companyId)
    console.log(`[Bot] Stopped bot for company: ${companyId}`)
  }
}

/**
 * Poll Supabase every 60 seconds for new/changed bot tokens.
 * Starts bots for new companies, does nothing for already-running ones.
 */
async function syncBots(): Promise<void> {
  try {
    const companies = await getAllCompaniesWithBots()
    const activeIds = new Set(companies.map((c) => c.id))

    // Stop bots for companies that no longer have a token
    for (const [id] of botRegistry) {
      if (!activeIds.has(id)) {
        stopCompanyBot(id)
      }
    }

    // Start bots for new companies
    await Promise.allSettled(companies.map((c) => startCompanyBot(c)))
  } catch (err) {
    console.error('[Bot] syncBots error:', err)
  }
}

async function main() {
  console.log('[SoleCare Bot Manager] Starting...')

  await syncBots()
  setInterval(syncBots, 60_000)

  // Graceful shutdown
  const shutdown = () => {
    console.log('[Bot] Shutting down all bots...')
    for (const [id, entry] of botRegistry) {
      entry.bot.stop('SIGTERM')
      botRegistry.delete(id)
    }
    process.exit(0)
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  console.log('[SoleCare Bot Manager] Running. Polling every 60s for new companies.')
}

main().catch((err) => {
  console.error('[Bot] Fatal error:', err)
  process.exit(1)
})
