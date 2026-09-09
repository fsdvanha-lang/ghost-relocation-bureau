import React from 'react';
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles, CheckCircle2, FileText, UserCheck } from 'lucide-react';

interface WorkflowStep {
  step: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: '01',
    title: 'Заявка',
    subtitle: 'Анкета и дедлайн',
    icon: FileText
  },
  {
    step: '02',
    title: 'Ограничения',
    subtitle: 'Чердак, зеркала, люди',
    icon: ShieldCheck
  },
  {
    step: '03',
    title: 'Скоринг',
    subtitle: 'Оценка 0–100',
    icon: Sparkles
  },
  {
    step: '04',
    title: 'Подбор',
    subtitle: 'Лучшая локация',
    icon: CheckCircle2
  },
  {
    step: '05',
    title: 'Решение',
    subtitle: 'Оператор утверждает',
    icon: UserCheck
  }
];

export const BureauWorkflowChain: React.FC = () => {
  return (
    <div className="bg-[#0b0b0e] border border-white/[0.07] rounded-2xl p-2.5 select-none relative shadow-sm">
      {/* Desktop: One sleek horizontal pipeline without text truncations and without overlapping popovers */}
      <div className="hidden lg:flex items-center justify-between gap-1 relative">
        {WORKFLOW_STEPS.map((item, idx) => {
          const isLast = idx === WORKFLOW_STEPS.length - 1;
          const Icon = item.icon;

          return (
            <React.Fragment key={item.step}>
              <div className="flex-1 min-w-0">
                {/* Step Card */}
                <div 
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl border bg-[#101014] border-white/[0.07] hover:bg-[#15151b] hover:border-white/25 transition-all duration-150"
                  style={{ animation: `entranceFadeUp 220ms cubic-bezier(0.16, 1, 0.3, 1) ${idx * 40}ms both` }}
                >
                  <span className="text-xs font-display font-black text-[#9E9E9A] shrink-0">
                    {item.step}
                  </span>
                  
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-heading font-bold text-[#F3F3F0] leading-tight flex items-center gap-1.5">
                      <Icon className="w-3 h-3 shrink-0 text-[#9E9E9A]" />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <div className="text-[10px] text-[#9E9E9A] truncate mt-0.5 leading-none font-sans">
                      {item.subtitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Connector Arrow between Steps */}
              {!isLast && (
                <div className="flex items-center shrink-0 px-0.5">
                  <ArrowRight className="w-3 h-3 text-white/20 shrink-0" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Tablet & Mobile: Vertical compact workflow */}
      <div className="lg:hidden space-y-1.5">
        <div className="text-[10px] font-heading uppercase tracking-wider text-[#9E9E9A] font-bold mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F3F3F0]" />
          <span>Как работает бюро (5 шагов)</span>
        </div>
        {WORKFLOW_STEPS.map((item, idx) => {
          const isLast = idx === WORKFLOW_STEPS.length - 1;
          const Icon = item.icon;

          return (
            <div key={item.step} className="space-y-1">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#101014] border border-white/[0.07]">
                <span className="text-xs font-mono font-bold text-[#F3F3F0] shrink-0">
                  {item.step}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-heading font-bold text-[#F3F3F0] flex items-center gap-1.5">
                    <Icon className="w-3 h-3 text-[#9E9E9A]" />
                    <span>{item.title}</span>
                  </div>
                  <div className="text-[10px] text-[#9E9E9A] mt-0.5">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div className="flex justify-center text-white/20 py-0.5">
                  <ChevronDown className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
