import React, { useState, useEffect } from 'react';
import {
  PRESET_ROLES,
  RoleProfile,
  getActiveRoleProfile,
  setActiveRoleProfile,
} from '../../utils/rbacClient';
import {
  ShieldCheck,
  Building,
  UserCheck,
  EyeOff,
  Coins,
  FileCheck,
  ChevronDown,
  Info,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export function RoleDepartmentSwitcher({ onRoleChange }: { onRoleChange?: (profile: RoleProfile) => void }) {
  const [activeProfile, setActiveProfile] = useState<RoleProfile>(getActiveRoleProfile());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleRoleChanged = (e: any) => {
      setActiveProfile(e.detail);
      if (onRoleChange) onRoleChange(e.detail);
    };
    window.addEventListener('ravengard_role_changed', handleRoleChanged);
    return () => window.removeEventListener('ravengard_role_changed', handleRoleChanged);
  }, [onRoleChange]);

  const handleSelectRole = (profile: RoleProfile) => {
    setActiveProfile(profile);
    setActiveRoleProfile(profile.id);
    setIsOpen(false);
    if (onRoleChange) onRoleChange(profile);
  };

  return (
    <div className="bg-slate-900/90 border-b border-white/10 px-4 py-2.5 backdrop-blur-md sticky top-0 z-40 text-xs font-mono">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Role Switcher Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold uppercase tracking-wider shrink-0">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline text-[11px]">RBAC Sandbox:</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-blue-500/30 text-white hover:border-blue-400 transition-all cursor-pointer shadow-sm"
              title="Switch user role and department to test sandboxing"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wide">{activeProfile.badge}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70 text-[11px] truncate max-w-[130px] sm:max-w-none">
                {activeProfile.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-white/50 ml-1" />
            </button>

            {isOpen && (
              <div className="absolute left-0 mt-1.5 w-80 sm:w-96 rounded-xl bg-slate-950/95 border border-white/15 shadow-2xl p-2 z-50 backdrop-blur-xl">
                <div className="px-3 py-2 text-[10px] text-white/40 border-b border-white/8 uppercase tracking-widest flex items-center justify-between">
                  <span>Simulate Enterprise Persona</span>
                  <Lock className="w-3 h-3 text-white/30" />
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-white/5 py-1">
                  {PRESET_ROLES.map((role) => {
                    const isSelected = role.id === activeProfile.id;
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleSelectRole(role)}
                        className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected ? 'bg-blue-500/15 border border-blue-500/30' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-white/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white text-xs">{role.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-blue-300 font-mono">
                              {role.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/50 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3 h-3 text-white/40" />
                            <span>{role.department}</span>
                          </div>
                          <p className="text-[11px] text-white/60 font-sans mt-1 line-clamp-2 leading-relaxed">
                            {role.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-white/40 border-l border-white/10 pl-3">
            <Building className="w-3 h-3 text-white/30" />
            <span>Dept: <strong className="text-white/80">{activeProfile.department}</strong></span>
          </div>
        </div>

        {/* Right: Active Sandboxing & Redaction Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] w-full md:w-auto justify-end">
          {activeProfile.permissions.isDepartmentSiloed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Lock className="w-3 h-3" /> Siloed: {activeProfile.department} Only
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Building className="w-3 h-3" /> Enterprise-Wide Access
            </span>
          )}

          {!activeProfile.permissions.canViewDemographics && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <EyeOff className="w-3 h-3" /> PII & Contact Redacted
            </span>
          )}

          {!activeProfile.permissions.canViewCompensation && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <Coins className="w-3 h-3" /> Compensation Redacted
            </span>
          )}

          {activeProfile.permissions.canApproveFinance && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
              <FileCheck className="w-3 h-3" /> Token Budget Authority
            </span>
          )}

          {activeProfile.permissions.canApproveRubrics && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <UserCheck className="w-3 h-3" /> Rubric Gate Authority
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
