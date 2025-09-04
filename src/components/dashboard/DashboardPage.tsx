// src/pages/DashboardPage.tsx (your current path)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Wallet,
  PieChart,
  AlertTriangle,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShaderAnimation } from "@/components/ui/shader-animation";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ChatInterface } from "./ChatInterface";
import { ProfileForm } from "./ProfileForm";
import { Api, ProfileStore, StoredProfile } from "@/lib/api";

interface MarketAlert {
  title: string;
  note: string;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState("");
  const [walletType, setWalletType] = useState("");
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [profile, setProfile] = useState<StoredProfile | any>({});
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);

  // --- Wallet gate ---
  useEffect(() => {
    const wallet = localStorage.getItem("wavy_wallet");
    const type = localStorage.getItem("wavy_wallet_type");

    if (!wallet) {
      navigate("/connect");
      return;
    }
    setWalletAddress(wallet);
    setWalletType(type || "unknown");
  }, [navigate]);

  // --- Load profile if submitted previously ---
  useEffect(() => {
    const saved = ProfileStore.load();
    const submitted = localStorage.getItem("wavy_profile_submitted") === "true";
    if (saved && submitted) {
      setProfile(saved);
      setProfileSubmitted(true);
    }
  }, []);

  // --- Fetch market alerts from backend ---
  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const { alerts } = await Api.alerts();
        if (mounted) setAlerts(alerts || []);
      } catch {
        if (mounted) setAlerts([]);
      }
    }
    refresh();
    const id = setInterval(refresh, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const handleProfileSubmit = () => {
    const saved = ProfileStore.load();
    if (saved) setProfile(saved);
    setProfileSubmitted(true);
    localStorage.setItem("wavy_profile_submitted", "true");
  };

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(walletAddress);
  };

  const shortenAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const getWalletDisplayName = (type: string) => {
    const walletNames: Record<string, string> = {
      metamask: "MetaMask",
      walletconnect: "WalletConnect",
      phantom: "Phantom",
      coinbase: "Coinbase Wallet",
      demo: "Demo Mode",
    };
    return walletNames[type] || "Unknown Wallet";
  };

  const handleSignOut = () => {
    localStorage.removeItem("wavy_wallet");
    localStorage.removeItem("wavy_user");
    localStorage.removeItem("wavy_profile");
    localStorage.removeItem("wavy_profile_submitted");
    navigate("/");
  };

  // Allocation demo (static for now)
  const allocations = profileSubmitted
    ? [
        { name: "BTC", value: 40, color: "#f7931a" },
        { name: "ETH", value: 30, color: "#627eea" },
        { name: "Stablecoins", value: 20, color: "#26a69a" },
        { name: "Other", value: 10, color: "#9c27b0" },
      ]
    : [
        { name: "BTC", value: 0, color: "#f7931a" },
        { name: "ETH", value: 0, color: "#627eea" },
        { name: "Stablecoins", value: 0, color: "#26a69a" },
        { name: "Other", value: 0, color: "#9c27b0" },
      ];

  const surplus =
    profileSubmitted && profile?.income && profile?.expenses
      ? Number(profile.income) - Number(profile.expenses)
      : null;

  const getRiskToleranceLabel = (value: number) => {
    if (value <= 0.3) return "Conservative";
    if (value <= 0.6) return "Moderate";
    return "Aggressive";
  };

  return (
    <div className="relative min-h-screen bg-black">
      <ShaderAnimation />

      {/* Top Bar */}
      <div className="relative z-10 bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="font-semibold text-white">Wavy AI</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 hover:bg-white/10 text-white"
              >
                <Avatar className="w-8 h-8">
                  <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">JD</span>
                  </div>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-white/80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-black/90 backdrop-blur-md border-white/20"
            >
              <DropdownMenuItem className="text-white hover:bg-white/10">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - AI Agent */}
          <div className="space-y-6">
            <ProfileForm onSubmit={handleProfileSubmit} />
            <ChatInterface />
          </div>

          {/* Right Column - Wallet & Insights */}
          <div className="space-y-6">
            {/* Wallet Overview */}
            <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <CardHeader className="border-b border-white/20">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="h-5 w-5 text-teal-400" />
                  Wallet Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-sm text-white/70">Connected Wallet</p>
                  <div className="flex items-center space-x-2 mt-1 mb-4">
                    <span className="text-sm text-teal-400 font-medium">
                      {getWalletDisplayName(walletType)}
                    </span>
                    <span className="text-white/50">•</span>
                    <code className="text-sm bg-white/10 px-2 py-1 rounded text-white">
                      {shortenAddress(walletAddress)}
                    </code>
                    <Button
                      onClick={copyWalletAddress}
                      size="sm"
                      variant="outline"
                      className="border-white/30 hover:bg-white/10 text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Separator className="border-white/20" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/70">Balance (AED)</p>
                    <p className="text-lg font-semibold text-white">12,450</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Balance (USDC)</p>
                    <p className="text-lg font-semibold text-white">3,390</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allocation & Budget */}
            <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <CardHeader className="border-b border-white/20">
                <CardTitle className="flex items-center gap-2 text-white">
                  <PieChart className="h-5 w-5 text-teal-400" />
                  Allocation & Budget
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {allocations.map((item) => (
                      <div key={item.name} className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-white/80">
                          {item.name}: {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4 border-white/20" />
                  <div className="text-sm text-white/70">
                    <div className="flex justify-between">
                      <span>Monthly Income:</span>
                      <span className="font-medium text-white">
                        {profileSubmitted && profile?.income
                          ? `${profile.income} AED`
                          : "–"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Monthly Expenses:</span>
                      <span className="font-medium text-white">
                        {profileSubmitted && profile?.expenses
                          ? `${profile.expenses} AED`
                          : "–"}
                      </span>
                    </div>
                    <div className="flex justify-between text-teal-400 font-medium">
                      <span>Available for Investment:</span>
                      <span>{surplus !== null ? `${surplus} AED` : "–"}</span>
                    </div>
                    {profileSubmitted && profile?.goal ? (
                      <div className="flex justify-between mt-2">
                        <span>Investment Goal:</span>
                        <span className="font-medium text-white">
                          {profile.goal}
                        </span>
                      </div>
                    ) : profileSubmitted ? (
                      <div className="flex justify-between mt-2">
                        <span>Investment Goal:</span>
                        <span className="font-medium text-white">–</span>
                      </div>
                    ) : null}
                    {profileSubmitted && profile?.horizon ? (
                      <div className="flex justify-between">
                        <span>Time Horizon:</span>
                        <span className="font-medium text-white">
                          {profile.horizon} years
                        </span>
                      </div>
                    ) : profileSubmitted ? (
                      <div className="flex justify-between">
                        <span>Time Horizon:</span>
                        <span className="font-medium text-white">–</span>
                      </div>
                    ) : null}
                    {profileSubmitted && profile?.riskTolerance !== undefined ? (
                      <div className="flex justify-between">
                        <span>Risk Tolerance:</span>
                        <span className="font-medium text-white">
                          {getRiskToleranceLabel(Number(profile.riskTolerance))}
                        </span>
                      </div>
                    ) : profileSubmitted ? (
                      <div className="flex justify-between">
                        <span>Risk Tolerance:</span>
                        <span className="font-medium text-white">–</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Alerts */}
            <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={2}
              />
              <CardHeader className="border-b border-white/20">
                <CardTitle className="flex items-center gap-2 text-white">
                  <AlertTriangle className="h-5 w-5 text-teal-400" />
                  Market Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 bg-white/10 rounded-lg border border-white/10"
                    >
                      <h4 className="font-medium text-sm text-white">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-white/70 mt-1">{alert.note}</p>
                    </motion.div>
                  ))}
                  {alerts.length === 0 && (
                    <p className="text-white/60 text-sm">
                      No alerts right now.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
