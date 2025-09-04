import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShaderAnimation } from "@/components/ui/shader-animation"
import { GlowingEffect } from "@/components/ui/glowing-effect"

interface WalletOption {
  id: string
  name: string
  icon: string
  comingSoon?: boolean
  description?: string
}

export function ConnectWalletPage() {
  const navigate = useNavigate()
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  const walletOptions: WalletOption[] = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
      description: "Connect using MetaMask browser extension"
    },
    {
      id: "phantom",
      name: "Phantom",
      icon: "https://cryptologos.cc/logos/phantom-phm-logo.png",
      description: "Connect to your Phantom wallet (Solana)"
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: "https://avatars.githubusercontent.com/u/18060234?s=280&v=4",
      description: "Connect with Coinbase Wallet"
    },
    {
      id: "slush",
      name: "Slush",
      icon: "https://assets.coingecko.com/coins/images/28463/small/slush.png",
      description: "Connect with Slush wallet"
    }
  ]

  const connectWallet = async (walletId: string) => {
    setIsConnecting(walletId)
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const randomWallet = "0x" + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("")
    
    localStorage.setItem("wavy_wallet", randomWallet)
    localStorage.setItem("wavy_wallet_type", walletId)
    localStorage.setItem("wavy_user", JSON.stringify({ 
      walletType: walletId,
      address: randomWallet 
    }))
    
    navigate("/dashboard")
  }

  const connectDemo = async () => {
    setIsConnecting("demo")
    
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const randomWallet = "0x" + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("")
    
    localStorage.setItem("wavy_wallet", randomWallet)
    localStorage.setItem("wavy_wallet_type", "demo")
    localStorage.setItem("wavy_user", JSON.stringify({ 
      walletType: "demo",
      address: randomWallet 
    }))
    
    navigate("/dashboard")
  }

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center p-4">
      <ShaderAnimation />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            Connect your wallet
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/80"
          >
            Choose one of the popular options below
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          {walletOptions.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="relative"
            >
              <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
                <GlowingEffect
                  spread={30}
                  glow={true}
                  disabled={false}
                  proximity={48}
                  inactiveZone={0.05}
                  borderWidth={1}
                />
                <CardContent className="p-0">
                  <Button
                    onClick={() => connectWallet(wallet.id)}
                    disabled={isConnecting !== null}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-6 hover:bg-white/5 text-white hover:scale-[1.02] transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                        <img 
                          src={wallet.icon} 
                          alt={wallet.name} 
                          className="w-8 h-8 object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-white text-lg mb-1">{wallet.name}</h3>
                        <p className="text-sm text-white/70 leading-relaxed">{wallet.description}</p>
                      </div>
                      {isConnecting === wallet.id && (
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="relative"
        >
          <Card className="relative bg-black/20 backdrop-blur-md border-white/10 shadow-xl">
            <CardContent className="p-4">
              <Button
                onClick={connectDemo}
                disabled={isConnecting !== null}
                variant="ghost"
                className="w-full text-white/80 hover:bg-white/5 hover:text-white"
              >
                <div className="flex items-center space-x-3">
                  {isConnecting === "demo" ? (
                    <div className="w-5 h-5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="text-xl">🎮</span>
                  )}
                  <span>Continue in Demo Mode</span>
                </div>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}