import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ShaderAnimation } from "@/components/ui/shader-animation"

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center p-4">
      <ShaderAnimation />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center space-y-8 max-w-2xl"
        style={{ zIndex: 10 }}
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-7xl md:text-9xl lg:text-[12rem] font-bold text-white tracking-tight pointer-events-none"
        >
          WAVY AI
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={() => navigate("/connect")}
            size="lg"
            className="text-lg px-8 py-6 bg-teal-600 hover:bg-teal-700 hover:scale-105 transition-all duration-200 shadow-lg relative z-10"
          >
            Connect Wallet
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}