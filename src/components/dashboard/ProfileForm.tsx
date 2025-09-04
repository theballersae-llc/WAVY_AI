// src/pages/ProfileForm.tsx
import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import {
  Api,
  ProfileStore,
  StoredProfile,
  toRiskPayload,
} from "@/lib/api";

interface ProfileFormProps {
  onSubmit: () => void;
}

export function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [profile, setProfile] = useState<StoredProfile>({
    income: 5000,
    expenses: 3000,
    goal: "Long-term wealth building",
    horizon: 5,
    riskTolerance: 0.5,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = ProfileStore.load();
    if (saved) setProfile(saved);
  }, []);

  const handleProfileChange = (updates: Partial<StoredProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    ProfileStore.save(newProfile);
  };

  const handleEnter = async () => {
    setBusy(true);
    try {
      // Use the helper to convert local profile to backend payload
      const payload = toRiskPayload(profile);
      const { risk_score } = await Api.risk(payload);

      const withRisk: StoredProfile = {
        ...profile,
        self_risk: payload.self_risk,
        risk_score,
      };

      ProfileStore.save(withRisk);
      setProfile(withRisk);
      setIsOpen(false);
      onSubmit();
    } catch (e: any) {
      alert(`Risk API failed: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <CardContent className="p-6">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between border-white/30 hover:bg-white/10 text-white"
            >
              Profile Settings
              <Settings className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="income" className="text-white/80">
                  Monthly Income (AED)
                </Label>
                <Input
                  id="income"
                  type="number"
                  value={profile.income}
                  onChange={(e) =>
                    handleProfileChange({ income: Number(e.target.value) })
                  }
                  className="border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="expenses" className="text-white/80">
                  Monthly Expenses (AED)
                </Label>
                <Input
                  id="expenses"
                  type="number"
                  value={profile.expenses}
                  onChange={(e) =>
                    handleProfileChange({ expenses: Number(e.target.value) })
                  }
                  className="border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="goal" className="text-white/80">
                Investment Goal
              </Label>
              <Input
                id="goal"
                value={profile.goal}
                onChange={(e) => handleProfileChange({ goal: e.target.value })}
                className="border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-teal-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="horizon" className="text-white/80">
                  Time Horizon (years)
                </Label>
                <Input
                  id="horizon"
                  type="number"
                  value={profile.horizon}
                  onChange={(e) =>
                    handleProfileChange({ horizon: Number(e.target.value) })
                  }
                  className="border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-teal-400"
                />
              </div>
              <div>
                <Label htmlFor="risk" className="text-white/80">
                  Risk Tolerance
                </Label>
                <Select
                  value={profile.riskTolerance.toString()}
                  onValueChange={(v) =>
                    handleProfileChange({ riskTolerance: Number(v) })
                  }
                >
                  <SelectTrigger className="border-white/30 bg-white/10 text-white focus:border-teal-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-md border-white/20">
                    <SelectItem value="0.2" className="text-white hover:bg-white/10">
                      Conservative
                    </SelectItem>
                    <SelectItem value="0.5" className="text-white hover:bg-white/10">
                      Moderate
                    </SelectItem>
                    <SelectItem value="0.8" className="text-white hover:bg-white/10">
                      Aggressive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleEnter}
              disabled={busy}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              {busy ? "Saving…" : "Enter"}
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
