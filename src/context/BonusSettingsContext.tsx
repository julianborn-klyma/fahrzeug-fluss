import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BonusSettings {
  id: string;
  half_year_bonus_pool: number;
  weight_speed: number;
  weight_quality: number;
  weight_reliability: number;
  weight_team: number;
  weight_cleanliness: number;
  threshold_min_bonus: number;
  threshold_min_neutral: number;
  require_approval: boolean;
  module_performance_enabled: boolean;
  module_fahrzeuglager_enabled: boolean;
  module_klyma_os_enabled: boolean;
}

interface BonusSettingsContextType {
  settings: BonusSettings | null;
  loading: boolean;
  updateSettings: (s: Partial<BonusSettings>) => Promise<void>;
  calculateScore: (scores: { speed: number; quality: number; reliability: number; team: number; cleanliness: number }) => number;
  getResult: (totalScore: number) => 'bonus' | 'neutral' | 'improvement';
  getMonthlyBonus: (totalScore: number) => number;
}

const DEFAULT_SETTINGS: Omit<BonusSettings, 'id'> = {
  half_year_bonus_pool: 2000,
  weight_speed: 0.30,
  weight_quality: 0.30,
  weight_reliability: 0.15,
  weight_team: 0.15,
  weight_cleanliness: 0.10,
  threshold_min_bonus: 1.0,
  threshold_min_neutral: 0.5,
  require_approval: true,
  module_performance_enabled: true,
  module_fahrzeuglager_enabled: true,
  module_klyma_os_enabled: true,
};

const BonusSettingsContext = createContext<BonusSettingsContextType | undefined>(undefined);

export const BonusSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BonusSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bonus_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (data) {
      setSettings({
        id: data.id,
        half_year_bonus_pool: Number(data.half_year_bonus_pool),
        weight_speed: Number(data.weight_speed),
        weight_quality: Number(data.weight_quality),
        weight_reliability: Number(data.weight_reliability),
        weight_team: Number(data.weight_team),
        weight_cleanliness: Number(data.weight_cleanliness),
        threshold_min_bonus: Number(data.threshold_min_bonus),
        threshold_min_neutral: Number(data.threshold_min_neutral),
        require_approval: (data as any).require_approval ?? true,
        module_performance_enabled: (data as any).module_performance_enabled ?? true,
        module_fahrzeuglager_enabled: (data as any).module_fahrzeuglager_enabled ?? true,
        module_klyma_os_enabled: (data as any).module_klyma_os_enabled ?? true,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const updateSettings = async (updates: Partial<BonusSettings>) => {
    if (!settings) return;
    const { id, ...rest } = updates;
    await supabase
      .from('bonus_settings')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', settings.id);
    setSettings(prev => prev ? { ...prev, ...updates } : prev);
  };

  const s = settings || { ...DEFAULT_SETTINGS, id: '' };

  const calculateScore = (scores: { speed: number; quality: number; reliability: number; team: number; cleanliness: number }) => {
    return (
      scores.speed * s.weight_speed +
      scores.quality * s.weight_quality +
      scores.reliability * s.weight_reliability +
      scores.team * s.weight_team +
      scores.cleanliness * s.weight_cleanliness
    );
  };

  const getResult = (totalScore: number): 'bonus' | 'neutral' | 'improvement' => {
    if (totalScore >= s.threshold_min_bonus) return 'bonus';
    if (totalScore >= s.threshold_min_neutral) return 'neutral';
    return 'improvement';
  };

  const getMonthlyBonus = (totalScore: number): number => {
    if (totalScore >= s.threshold_min_bonus) {
      return (totalScore / 2.0) * (s.half_year_bonus_pool / 6);
    }
    return 0;
  };

  return (
    <BonusSettingsContext.Provider value={{ settings, loading, updateSettings, calculateScore, getResult, getMonthlyBonus }}>
      {children}
    </BonusSettingsContext.Provider>
  );
};

export const useBonusSettings = () => {
  const context = useContext(BonusSettingsContext);
  if (!context) throw new Error('useBonusSettings must be used within BonusSettingsProvider');
  return context;
};
