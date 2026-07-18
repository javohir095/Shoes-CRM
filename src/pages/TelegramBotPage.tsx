import { motion } from 'framer-motion'
import { Bot, Check, Copy, ExternalLink, MessageCircle, Send, Terminal } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrders } from '@/hooks/useOrders'
import { formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/orders/StatusBadge'

export function TelegramBotPage() {
  const [copied, setCopied] = useState<string | null>(null)

  const { data, isLoading } = useOrders({}, 1, 100)
  const linkedOrders = (data?.orders ?? []).filter((o) => o.telegram_id)

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Nusxalandi')
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Telegram Bot</h1>
        <p className="text-sm text-muted-foreground">
          Mijozlar buyurtma holatini Telegram orqali kuzatishi mumkin
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Status card */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">SoleCare Bot</p>
              <p className="text-sm text-muted-foreground">Telegraf.js asosida ishlaydi</p>
            </div>
            <Badge variant="success" className="ml-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Faol
            </Badge>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Mijozlar uchun qo'llanma</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">1.</span>
                  Telegram'da botni oching va <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">/start</code> buyrug'ini yuboring
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">2.</span>
                  Bot sizdan buyurtma raqamini so'raydi (masalan: SH-20260820-0001)
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">3.</span>
                  Buyurtma holati, qabul qilingan sana va taxminiy tayyor bo'lish vaqti ko'rsatiladi
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground">4.</span>
                  Buyurtma "Tayyor" statusiga o'tganda avtomatik xabar yuboriladi
                </li>
              </ol>
            </div>

            <div className="rounded-xl border bg-secondary/50 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Terminal className="h-4 w-4" />
                Bot ishga tushirish (server)
              </p>
              <div className="space-y-2 font-mono text-xs">
                <CodeLine
                  text="cd bot && npm install"
                  onCopy={() => copy('cd bot && npm install', 'install')}
                  copied={copied === 'install'}
                />
                <CodeLine
                  text="npm run start"
                  onCopy={() => copy('npm run start', 'start')}
                  copied={copied === 'start'}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <code className="rounded bg-background px-1 py-0.5">BOT_TOKEN</code> va{' '}
                <code className="rounded bg-background px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code>{' '}
                muhit o'zgaruvchilarini <code className="rounded bg-background px-1 py-0.5">bot/.env</code> faylida sozlang.
              </p>
            </div>
          </div>
        </Card>

        {/* Notification template */}
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">"Tayyor" xabari shabloni</p>
          <div className="rounded-xl border bg-secondary/50 p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Send className="h-3.5 w-3.5" />
              SoleCare Bot
            </div>
            <p className="leading-relaxed">
              Assalomu alaykum. Sizning buyurtmangiz tayyor.
              <br />
              Buyurtma raqami: <span className="font-mono font-semibold">SH-20260820-0001</span>
              <br />
              Iltimos filialga tashrif buyuring.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() =>
              copy(
                "Assalomu alaykum. Sizning buyurtmangiz tayyor. Buyurtma raqami: {order_number}\nIltimos filialga tashrif buyuring.",
                'template'
              )
            }
          >
            {copied === 'template' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Shablonni nusxalash
          </Button>
        </Card>
      </div>

      {/* Linked orders */}
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          Telegram bilan bog'langan buyurtmalar
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : linkedOrders.length > 0 ? (
          <div className="space-y-2">
            {linkedOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm"
              >
                <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                <span className="font-medium">{order.customer_name}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Send className="h-3 w-3" />
                  {order.telegram_id}
                </span>
                <StatusBadge status={order.status} />
                <span className="ml-auto text-xs text-muted-foreground">{formatDateTime(order.created_at)}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <ExternalLink className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Hozircha Telegram ID kiritilgan buyurtmalar yo'q
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

function CodeLine({ text, onCopy, copied }: { text: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-background px-3 py-2">
      <code>{text}</code>
      <button onClick={onCopy} className="text-muted-foreground transition-colors hover:text-foreground">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

export default TelegramBotPage
