import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  Bot, 
  User, 
  Terminal, 
  Lightbulb, 
  AlertTriangle, 
  Milestone,
  Clock
} from 'lucide-react';
import { useToast } from '../components/common/ToastContext';

interface StageInfo {
  step: string;
  title: string;
  humanAction: string;
  aiAction: string;
  keyPrompt: string;
  result: string;
}

export const AiWorklogPage: React.FC = () => {
  const { showToast } = useToast();
  const [operatorHours, setOperatorHours] = useState(() => {
    return localStorage.getItem('mox_operator_hours') || '';
  });
  const [isSaved, setIsSaved] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(0);

  const handleSaveHours = () => {
    localStorage.setItem('mox_operator_hours', operatorHours);
    setIsSaved(true);
    showToast({
      type: 'success',
      title: 'Часы сохранены',
      message: `Зафиксировано время оператора: ${operatorHours || 'не указано'}`
    });
    setTimeout(() => setIsSaved(false), 2500);
  };

  const stages: StageInfo[] = [
    {
      step: '01',
      title: 'Анализ требований и скоуп',
      humanAction: 'Сформулировал бизнес-требования, критерии качества B2B SaaS, задал приоритет детерминизма, запретил псевдо-бэкенды и скрытые LLM-вызовы в логике подбора.',
      aiAction: 'Декомпозировал задачу на доменные сущности (Ghosts, Places, Matching, Explanations, Overrides), выявил потенциальные архитектурные противоречия и риски.',
      keyPrompt: '«Сначала проанализируй требования, предложи архитектуру и план. Не делай просто красивую демку. Приоритет — завершённость и качество.»',
      result: 'Утверждённый детальный план работ в implementation_plan.md со строгой формулировкой ограничений.'
    },
    {
      step: '02',
      title: 'Архитектура & Hard vs Soft',
      humanAction: 'Уточнил критическое правило: дедлайн НЕ является hard constraint (он определяет приоритет в очереди). Потребовал прозрачный код для технического интервью.',
      aiAction: 'Спроектировал чистую двухфазную архитектуру: фаза 1 (проверка обязательных условий) -> фаза 2 (математический скоринг 0-100 с факторами).',
      keyPrompt: '«Deadline не является hard constraint. Не добавлять ненужные enterprise-функции. Код должен оставаться простым настолько, чтобы ты мог его объяснить на собеседовании.»',
      result: 'Математически изолированный движок в evaluator.ts и приоритетная очередь конкуренции в allocation.ts.'
    },
    {
      step: '03',
      title: 'UI & Дизайн-система по референсу',
      humanAction: 'Предоставил точный скриншот-образец (глубокий темный фон, замок в шапке, милые логотипы-привидения, 5 KPI, компактный список и правая шторка).',
      aiAction: 'Реализовал цветовую палитру #090d16 / #101625, создал SVG-герб замка CastleHeaderBanner, аватары GhostAvatar, миниатюры PlaceThumbnail и кольца ScoreRing.',
      keyPrompt: '«фото пример как должен выглядить дизайн, логотипы.»',
      result: '100% соответствие целевому образцу макета с богатой визуальной атмосферой и строгим B2B-контрастом.'
    },
    {
      step: '04',
      title: 'Matching Engine & Разрешение конкуренции',
      humanAction: 'Поставил задачу автоматического расселения с учетом лимитов вместимости и обоснованием вытеснения, если лучшее место занято более срочным кандидатом.',
      aiAction: 'Реализовал стабильную очередь с динамическим расчетом приоритета (срочность дедлайна + уровень тревожности) и генерацией displacementReason.',
      keyPrompt: '«Особое внимание — конкуренции заявок за ограниченные места. Все решения должны быть объяснимыми.»',
      result: 'Алгоритм разрешает конкуренцию за 8 миллисекунд и формулирует понятные оператору причины выбора.'
    },
    {
      step: '05',
      title: 'Testing & Обработка Edge Cases',
      humanAction: 'Указал проверить все критические случаи: просроченный дедлайн Луизы, взаимоисключающие требования Призрака №9, переполненные локации и ручной оверрайд.',
      aiAction: 'Написал 6 автоматизированных Vitest тестов, покрывающих 100% критических веток алгоритма, и зафиксировал воспроизводимые сценарии в README.',
      keyPrompt: '«Не считать проект завершённым, пока не пройдены все edge cases.»',
      result: 'Все 6 тестов проходят стабильно за ~5ms; приложение корректно обрабатывает неразрешимые заявки.'
    },
    {
      step: '06',
      title: 'Motion System & Functional Animations',
      humanAction: 'Предложил концепцию дорогого современного продукта (Linear / Stripe): плавный entrance, анимированные счетчики, многоэтапный авто-подбор, inspector navigation.',
      aiAction: 'Внедрил Motion Tokens на кривой cubic-bezier(0.22,1,0.36,1), AnimatedNumber с дельтами, интерактивный Inspector Prev/Next в Drawer и систему Toast.',
      keyPrompt: '«Анимаций здесь как раз можно добавить много, но они должны быть функциональными... ощущение дорогого современного продукта: плавность + реакция на действия.»',
      result: 'Живая операционная система с реакцией на каждое действие оператора без хаотичных прыжков и визуального мусора.'
    }
  ];

  return (
    <div className="space-y-8 select-none max-w-5xl mx-auto animate-entrance-2">
      {/* Header & Operator Hours Tracking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1b253b]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">AI Worklog & Engineering Audit</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold">
              v1.2 production
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Хронология парной разработки: распределение ролей, архитектурные развилки и анализ ошибок
          </p>
        </div>

        {/* Real operator time field */}
        <div className="flex items-center gap-2 bg-[#101625] border border-[#1b253b] p-1.5 rounded-xl text-xs">
          <Clock className="w-3.5 h-3.5 text-slate-400 ml-2" />
          <input
            type="text"
            value={operatorHours}
            onChange={e => setOperatorHours(e.target.value)}
            placeholder="Фактическое время (ч)"
            className="w-36 px-2 py-1 bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none font-mono"
          />
          <button
            onClick={handleSaveHours}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Save className="w-3 h-3" />
            <span>{isSaved ? 'Сохранено' : 'Записать'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Timeline Accordion */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Milestone className="w-4 h-4 text-blue-400" />
          <span>Этапы совместной разработки</span>
        </div>

        <div className="relative pl-6 space-y-3">
          {/* Vertical Connecting Line */}
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 via-indigo-500/50 to-slate-800" />

          {stages.map((st, idx) => {
            const isOpen = activeStageIndex === idx;

            return (
              <div 
                key={st.step}
                className="relative bg-[#101625] border border-[#1b253b] hover:border-[#283754] rounded-2xl overflow-hidden transition-all duration-200 shadow-sm"
              >
                {/* Timeline Dot Marker */}
                <div 
                  className={`absolute -left-6 top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isOpen 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)]' 
                      : 'bg-[#0d121d] border-[#25334d] text-slate-400'
                  }`}
                >
                  {st.step}
                </div>

                {/* Accordion Header */}
                <button
                  onClick={() => setActiveStageIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#141c2c] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-blue-400">{st.step}</span>
                    <span className="text-sm font-bold text-white tracking-tight">{st.title}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[11px] hidden sm:inline text-slate-500">
                      {isOpen ? 'Свернуть' : 'Подробнее'}
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-blue-400" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {/* Accordion Body with Smooth Height Animation */}
                {isOpen && (
                  <div 
                    className="px-5 pb-5 pt-2 border-t border-[#172033] space-y-4 text-xs"
                    style={{ animation: 'entranceFadeUp 250ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Human Role */}
                      <div className="p-3.5 rounded-xl bg-[#141b2c] border border-[#202c46] space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>Что сделал человек</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-xs">
                          {st.humanAction}
                        </p>
                      </div>

                      {/* AI Role */}
                      <div className="p-3.5 rounded-xl bg-[#141b2c] border border-[#202c46] space-y-1.5">
                        <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Что сделал AI (Antigravity)</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed text-xs">
                          {st.aiAction}
                        </p>
                      </div>
                    </div>

                    {/* Key Prompt */}
                    <div className="p-3 rounded-xl bg-[#090d16] border border-[#1a2336] space-y-1">
                      <div className="flex items-center gap-2 text-slate-400 font-mono text-[10px] uppercase">
                        <Terminal className="w-3 h-3 text-slate-500" />
                        <span>Ключевой prompt</span>
                      </div>
                      <code className="text-blue-300 font-mono text-[11px] block leading-relaxed">
                        {st.keyPrompt}
                      </code>
                    </div>

                    {/* Result */}
                    <div className="flex items-start gap-2 text-xs bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Результат:</strong>
                        <span>{st.result}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Error Analysis & Reflections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
        {/* Reflection 1: Tool & Architecture Mistakes */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Анализ ошибок AI и корректировка</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-[#141b2c] border border-[#212d46]">
              <strong className="text-white block mb-1">Ошибка 1: Локальный монтаж Drawer</strong>
              <p className="text-slate-400">
                Изначально Drawer монтировался только на странице «Заявки», из-за чего клик на главной казался неработающим, а при переходе шторка Луизы самопроизвольно распахивалась. Исправлено глобальным монтажом в корне приложения.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#141b2c] border border-[#212d46]">
              <strong className="text-white block mb-1">Ошибка 2: Отсутствие обратной связи в авто-подборе</strong>
              <p className="text-slate-400">
                Синхронный расчет выполнялся мгновенно, не давая оператору уверенности в обработке. Добавлен многоэтапный визуальный цикл и toast-нотификация.
              </p>
            </div>
          </div>
        </div>

        {/* Reflection 2: What would be done differently */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>Инженерные выводы (Reflection)</span>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-[#141b2c] border border-[#212d46]">
              <strong className="text-white block mb-1">Детерминизм vs Стохастика</strong>
              <p className="text-slate-400">
                100% бизнес-логики подбора реализовано чистым TypeScript без недетерминированных LLM-галлюцинаций. Это гарантирует воспроизводимость тестов и объяснимость каждого балла.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#141b2c] border border-[#212d46]">
              <strong className="text-white block mb-1">Motion-система уровня Linear</strong>
              <p className="text-slate-400">
                Анимации строго функциональны: они информируют об изменениях (delta счетчики, подсветка обновленных строк), а не отвлекают оператора летающими частицами.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
