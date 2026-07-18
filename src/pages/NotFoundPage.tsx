import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Footprints, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Footprints className="h-8 w-8" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-lg font-medium">Sahifa topilmadi</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan.
        </p>
        <Button className="mt-6" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
          Bosh sahifaga qaytish
        </Button>
      </motion.div>
    </div>
  )
}

export default NotFoundPage
