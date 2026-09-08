import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight,
  Save
} from 'lucide-react';

interface StageInfo {
  number: number;
  title: string;
  humanAction: string;
  aiAction: string;
  keyPrompt: string;
  result: string;
}

export const AiWorklogPage: React.FC = () => {
  const [operatorHours, setOperatorHours] = useState(() => {
    return localStorage.getItem('mox_operator_hours') || '';
  });
  const [isSaved, setIsSaved] = useState(false);
  const [openStages, setOpenStages] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: false,
    5: true,
    6: false,
    7: false,
    8: false
  });

  const toggleStage = (num: number) => {
    setOpenStages(prev => ({ ...prev, [num]: !prev[num] }));
  };

  const handleSaveHours = () => {
    localStorage.setItem('mox_operator_hours', operatorHours);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const stages: StageInfo[] = [
    {
      number: 1,
      title: '1. Анализ ТЗ',
      humanAction: 'Сформулировал бизнес-требования, критерии качества B2B SaaS, задал приоритет детерминизма и запретил псевдо-бэкенды и скрытые LLM-вызовы.',
      aiAction: 'Декомпозировал задачу на доменные сущности (Ghosts, Places, Matching, Explanations, Overrides), выявил потенциальные архитектурные противоречия.',
      keyPrompt: '«Сначала проанализируй требования, предложи архитектуру и план. Не делай просто красивую демку. Приоритет — завершённость и качество.»',
      result: 'Утверждённый детальный план работ в implementation_plan.md со строгой формулировкой ограничений.'
    },
    {
      number: 2,
      title: '2. Архитектура',
      humanAction: 'Уточнил, что дедлайн не является hard constraint, запретил избыточные enterprise-надстройки, потребовал код, понятный для собеседования.',
      aiAction: 'Спроектировал модульную структуру (matching engine, domain types, context reducer, SaaS components), изолировав математику от React-рендеринга.',
      keyPrompt: '«Deadline не является hard constraint. Не добавлять ненужные enterprise-функции. Код должен оставаться простым настолько, чтобы ты мог его объяснить на собеседовании.»',
      result: 'Чистая двухфазная архитектура подбора (Hard Constraints -> Soft Scoring) и предсказуемый React Context.'
    },
    {
      number: 3,
      title: '3. UI / Дизайн-система',
      humanAction: 'Определил визуальный стиль: нейтральный B2B SaaS, глубокий тёмный slate, строгая типографика, отсутствие аляповатых градиентов.',
      aiAction: 'Реализовал адаптивную дизайн-систему на Tailwind CSS, создал информативные бейджи дедлайнов и скоринга, компоновку Sidebar + TopBar.',
      keyPrompt: '«Интерфейс уровня хорошего современного B2B SaaS-продукта... профессиональный операционный инструмент.»',
      result: 'Готовая рабочая среда оператора с 5 экранами, четкой информационной иерархией и визуализацией загрузки слотов.'
    },
    {
      number: 4,
      title: '4. Модель данных',
      humanAction: 'Предоставил базовые кейсы привидений и локаций, задал правила структурирования ограничений.',
      aiAction: 'Написал строгие TypeScript-интерфейсы без any, создал seed-датасет из 10 привидений и 8 мест со всеми типами конфликтов.',
      keyPrompt: '«Создай достаточно данных, чтобы были: хорошие совпадения; спорные; невозможные; места с заполненной вместимостью; конфликтующие условия.»',
      result: 'Сбалансированный seed-датасет, покрывающий нормальные, пограничные и невозможные сценарии.'
    },
    {
      number: 5,
      title: '5. Алгоритм подбора и конкуренция',
      humanAction: 'Указал правила математического скоринга (+20/-25), потребовал детерминизма и особого внимания к конкуренции заявок за ограниченные места.',
      aiAction: 'Реализовал evaluator.ts и allocation.ts с приоритетной очередью по дедлайнам и прозрачной фиксацией причин вытеснения в объяснениях.',
      keyPrompt: '«Особое внимание — конкуренции заявок за ограниченные места. Не использовать LLM для самого математического решения.»',
      result: 'Воспроизводимый scoring engine 0-100 и глобальный диспетчер распределения с отслеживанием емкости.'
    },
    {
      number: 6,
      title: '6. Обработка edge cases',
      humanAction: 'Сформировал чеклист обязательных крайних ситуаций: пустой список, просроченные дедлайны, превышение вместимости, ручные конфликты.',
      aiAction: 'Добавил предупреждающие диалоги с подтверждением оверрайда, генерацию множественных причин невозможности и блокировку переполнения.',
      keyPrompt: '«Если оператор выбирает плохое место, НЕ запрещай действие автоматически. Покажи предупреждение... Не считать проект завершённым, пока не пройдены все edge cases.»',
      result: 'Надежная обработка всех 10 краевых состояний без падений и некорректных статусов.'
    },
    {
      number: 7,
      title: '7. Отладка и тестирование',
      humanAction: 'Потребовал писать код и тесты поэтапно, проверяя компиляцию и бизнес-логику после каждого этапа.',
      aiAction: 'Написал набор из 6 автоматических unit-тестов на Vitest, покрывающий скоринг, hard constraints, конкуренцию и дедлайны. Проверил build.',
      keyPrompt: '«Каждый этап сначала реализовать, затем тестировать. Все найденные ошибки фиксировать для последующего Worklog.»',
      result: '100% прохождение unit-тестов Vitest и чистый билд TypeScript/Vite без единого предупреждения.'
    },
    {
      number: 8,
      title: '8. Финальная проверка и UI refinement',
      humanAction: 'Провёл критический дизайн-ревью: убрал неоновый стиль AI-дашборда, card-пролиферацию, восстановил строгую визуальную иерархию и плотные таблицы.',
      aiAction: 'Переработал дашборд, выделил блок «Требуют внимания» в главный фокус, сжал KPI до типографики, оптимизировал Drawer и таблицы.',
      keyPrompt: '«Интерфейс уровня современного B2B SaaS/internal operations tool... минималистично, спокойно, функционально.»',
      result: 'Спокойный, выверенный operations tool оператора уровня Linear/Stripe.'
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-[#202326] pb-4 space-y-1">
        <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">
          AI Worklog
        </h2>
        <p className="text-xs text-zinc-400 font-mono">
          Протокол процесса разработки · Роли человека и модели · Принятые решения
        </p>
      </div>

      {/* Meta: Tools, Time, Tokens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#202326] pb-6">
        {/* Tools */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-zinc-200">Инструменты и среда</div>
          <p className="text-xs text-zinc-400">
            Antigravity IDE · Gemini 3.8 Flash (High) · React 19 · TypeScript · Vite · Tailwind v3 · Vitest
          </p>
        </div>

        {/* Development Time */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-zinc-200">Время разработки</div>
          <p className="text-[11px] text-zinc-500">
            Поле для указания реального времени работы:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={operatorHours}
              onChange={e => setOperatorHours(e.target.value)}
              placeholder="Например: 2.5 часа"
              className="px-2.5 py-1 bg-[#131517] border border-[#26292d] rounded text-xs text-zinc-100 flex-1 focus:outline-none focus:border-zinc-400"
            />
            <button
              onClick={handleSaveHours}
              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>
          {isSaved && <span className="text-[10px] text-emerald-400 font-medium">✓ Сохранено</span>}
        </div>

        {/* Tokens */}
        <div className="space-y-1">
          <div className="text-xs font-semibold text-zinc-200">Использованные токены</div>
          <p className="text-xs text-zinc-400 leading-relaxed font-mono">
            Токены не учитывались / статистика недоступна в используемом инструменте
          </p>
        </div>
      </div>

      {/* Operator Independent Decisions */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          Ключевые инженерные решения оператора (Human Decisions)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-[#111214] border border-[#202326] rounded-lg space-y-1">
            <span className="font-semibold text-zinc-200">
              1. Дедлайн вынесен из Hard Constraints в приоритет очереди
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Просроченный дедлайн не должен физически блокировать расселение. Привидение с просроченным сроком должно получить наивысший приоритет в диспетчеризации, а не статус невозможности.
            </p>
          </div>

          <div className="p-4 bg-[#111214] border border-[#202326] rounded-lg space-y-1">
            <span className="font-semibold text-zinc-200">
              2. 100% отказ от LLM для вычисления скоринга
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Математический подбор реализован детерминированными чистыми функциями на TypeScript. Это гарантирует мгновенный отклик, нулевые затраты на API и стопроцентную повторяемость для тестов.
            </p>
          </div>

          <div className="p-4 bg-[#111214] border border-[#202326] rounded-lg space-y-1">
            <span className="font-semibold text-zinc-200">
              3. Двухфазное ручное управление (Human-in-the-Loop)
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Оператору не запрещается выбор неидеальных мест. Система перехватывает риски понятным предупреждающим диалогом и требует осознанного подтверждения с указанием причины.
            </p>
          </div>

          <div className="p-4 bg-[#111214] border border-[#202326] rounded-lg space-y-1">
            <span className="font-semibold text-zinc-200">
              4. Разрешение конкуренции за слоты с фиксацией вытеснения
            </span>
            <p className="text-zinc-400 leading-relaxed">
              При нехватке мест слот отдается более срочной заявке, а уступленная заявка получает 2-е по качеству место с понятным объяснением причины смещения.
            </p>
          </div>
        </div>
      </div>

      {/* AI Errors & Fixes */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          Ошибки AI и их устранение (AI Errors & Fixes)
        </h3>
        <div className="p-4 bg-[#111214] border border-[#202326] rounded-lg space-y-2 text-xs">
          <div className="text-zinc-200 font-medium">
            Ошибка первоначальной классификации фактора дедлайна:
          </div>
          <div className="text-zinc-400 space-y-1 pl-3 border-l-2 border-zinc-700">
            <p><strong>Что предложил AI:</strong> В первой версии плана AI предложил считать просроченный дедлайн (deadline &lt; 0) блокирующим hard constraint, делающим расселение невозможным.</p>
            <p><strong>Почему это было плохим решением:</strong> В реальном процессе просроченное привидение (Луиза) обязано быть расселено как можно скорее. Блокировать расселение из-за просрочки противоречит здравому смыслу.</p>
            <p><strong>Как исправлено:</strong> Оператор вовремя скорректировал модель: дедлайн был перенесен в модуль приоритета очереди (`calculateGhostPriority`), поднимая просроченные заявки на самый верх диспетчерского списка.</p>
          </div>
        </div>
      </div>

      {/* Stages 1-8 Accordion */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">
          Хронологические этапы разработки (1–8)
        </h3>

        <div className="space-y-1.5 border border-[#202326] rounded-lg overflow-hidden bg-[#111214] divide-y divide-[#1b1d20]">
          {stages.map(stage => {
            const isOpen = !!openStages[stage.number];
            return (
              <div key={stage.number}>
                <button
                  onClick={() => toggleStage(stage.number)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#16181b] transition-colors"
                >
                  <span className="font-medium text-xs text-zinc-200">{stage.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2 text-xs text-zinc-400 bg-[#0e1012]">
                    <div>
                      <strong className="text-zinc-300 block mb-0.5">Что сделал человек:</strong>
                      <p>{stage.humanAction}</p>
                    </div>
                    <div>
                      <strong className="text-zinc-300 block mb-0.5">Что сделал AI:</strong>
                      <p>{stage.aiAction}</p>
                    </div>
                    <div className="p-2 bg-[#131517] rounded border border-[#202326] font-mono text-[11px] text-zinc-300">
                      <strong className="text-zinc-400 block mb-0.5">Ключевой промпт:</strong>
                      <p>{stage.keyPrompt}</p>
                    </div>
                    <div>
                      <strong className="text-zinc-300 block mb-0.5">Результат:</strong>
                      <p className="text-zinc-200">{stage.result}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-200">План будущих улучшений (Roadmap)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-400">
          <div className="p-3 bg-[#111214] rounded-lg border border-[#202326] space-y-0.5">
            <span className="font-medium text-zinc-200">1. Persistent Backend & ORM</span>
            <p>Переход с localStorage на PostgreSQL/FastAPI с аудитом изменений и версионированием заявок.</p>
          </div>
          <div className="p-3 bg-[#111214] rounded-lg border border-[#202326] space-y-0.5">
            <span className="font-medium text-zinc-200">2. Венгерский алгоритм (Kuhn-Munkres)</span>
            <p>Глобальная оптимизация распределения для максимизации суммарного скора бюро.</p>
          </div>
          <div className="p-3 bg-[#111214] rounded-lg border border-[#202326] space-y-0.5">
            <span className="font-medium text-zinc-200">3. Real-time WebSockets</span>
            <p>Коллаборативный режим одновременной работы нескольких операторов с блокировками.</p>
          </div>
          <div className="p-3 bg-[#111214] rounded-lg border border-[#202326] space-y-0.5">
            <span className="font-medium text-zinc-200">4. Календарные события</span>
            <p>Динамические средовые коэффициенты в зависимости от сезона и внешних условий.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
