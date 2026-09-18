import React from 'react';
import { UserHealthProfile } from '../types';
import { Settings, CheckSquare, Square, Save } from 'lucide-react';

interface SettingsPanelProps {
  userProfile: UserHealthProfile;
  onChange: (profile: UserHealthProfile) => void;
}

const COMMON_CONDITIONS = ["Diabetes", "Hypertension", "High Cholesterol", "Asthma"];
const COMMON_ALLERGIES = ["Peanuts", "Shellfish", "Dairy", "Gluten"];

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ userProfile, onChange }) => {
  const handleToggleCondition = (conditionName: string) => {
    const isSelected = userProfile.conditions.includes(conditionName.toLowerCase());
    const newConditions = isSelected
      ? userProfile.conditions.filter((c) => c !== conditionName.toLowerCase())
      : [...userProfile.conditions, conditionName.toLowerCase()];
    
    onChange({ ...userProfile, conditions: newConditions });
  };

  const handleToggleAllergy = (allergyName: string) => {
    const isSelected = userProfile.allergies.includes(allergyName.toLowerCase());
    const newAllergies = isSelected
      ? userProfile.allergies.filter((a) => a !== allergyName.toLowerCase())
      : [...userProfile.allergies, allergyName.toLowerCase()];
    
    onChange({ ...userProfile, allergies: newAllergies });
  };

  return (
    <section id="settings-panel-section" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-cream-soft">Profile & Settings</h3>
          <p className="text-xs text-beige-light/80">
            Manage your personal health constraints, conditions, and allergies for localized overrides.
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-cream-soft border border-wellness-border/80 shadow-xs max-w-3xl">
        <div className="flex items-center gap-2 mb-6 border-b border-wellness-border/60 pb-4">
          <Settings className="w-5 h-5 text-olive" />
          <h4 className="text-base font-bold text-wellness-dark">Health Constraints (Sub-feature 4.1)</h4>
        </div>

        <p className="text-xs text-wellness-muted mb-6">
          Toggle active conditions and allergies. Any selected option will dynamically adjust AI recommendations (Wellness Coach) and Meal Scanner results.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Conditions */}
          <div>
            <h5 className="text-sm font-bold text-wellness-dark uppercase tracking-wider mb-3">
              Medical Conditions
            </h5>
            <div className="space-y-2">
              {COMMON_CONDITIONS.map((cond) => {
                const isActive = userProfile.conditions.includes(cond.toLowerCase());
                return (
                  <button
                    key={cond}
                    onClick={() => handleToggleCondition(cond)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-beige-cream transition-colors border border-transparent hover:border-wellness-border text-left"
                  >
                    {isActive ? (
                      <CheckSquare className="w-5 h-5 text-olive shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-wellness-muted shrink-0" />
                    )}
                    <span className={`text-sm ${isActive ? 'font-semibold text-wellness-dark' : 'text-wellness-muted'}`}>
                      {cond}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <h5 className="text-sm font-bold text-wellness-dark uppercase tracking-wider mb-3">
              Allergies & Intolerances
            </h5>
            <div className="space-y-2">
              {COMMON_ALLERGIES.map((alg) => {
                const isActive = userProfile.allergies.includes(alg.toLowerCase());
                return (
                  <button
                    key={alg}
                    onClick={() => handleToggleAllergy(alg)}
                    className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-beige-cream transition-colors border border-transparent hover:border-wellness-border text-left"
                  >
                    {isActive ? (
                      <CheckSquare className="w-5 h-5 text-orange-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-wellness-muted shrink-0" />
                    )}
                    <span className={`text-sm ${isActive ? 'font-semibold text-wellness-dark' : 'text-wellness-muted'}`}>
                      {alg}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-wellness-border/50 flex items-center justify-between text-xs">
          <span className="text-wellness-muted">Changes are applied immediately to all features.</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-olive/10 text-olive font-medium border border-olive/20">
            <Save className="w-3.5 h-3.5" />
            <span>Auto-Saved Local State</span>
          </div>
        </div>
      </div>
    </section>
  );
};
