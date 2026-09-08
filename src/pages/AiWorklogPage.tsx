import React, { useState } from 'react';
import { 
  Bot, 
  Clock, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  Lightbulb, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
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
      title: '8. Финальная проверка',
      humanAction: 'Контроль соответствия Definition of Done, аудит интерфейса, проверка объяснимости кода перед собеседованием.',
      aiAction: 'Провел сквозной функциональный аудит, проверил пересчет аналитики в реальном времени, подготовил документацию в README.md.',
      keyPrompt: '«Получить не просто работающую демку, а маленький законченный продукт, который выглядит как работа AI-first Developer.»',
      result: 'Готовый production-ready проект, упакованный для легкого запуска и демонстрации на оценке MOX.'
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              AI Worklog: Прозрачный протокол разработки
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              MOX AI-First Developer Assignment • Audit & Reflection Log
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
          Данный раздел фиксирует реальное разделение ролей человека и искусственного интеллекта,
          ключевые архитектурные решения оператора, исправление ошибок модели и векторы дальнейшего развития.
        </p>
      </div>

      {/* Meta Parameters Grid: Tools, Time, Tokens */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tools */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Инструменты и среда</span>
          </div>
          <div className="text-xs text-slate-200 font-medium space-y-1">
            <p>• <strong>Среда:</strong> Google Antigravity IDE</p>
            <p>• <strong>Модель:</strong> Gemini 3.8 Flash (High)</p>
            <p>• <strong>Стек:</strong> React 19, TypeScript, Vite, Tailwind v3, Vitest</p>
          </div>
        </div>

        {/* Development Time */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Общее время разработки</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Поле для указания реального времени работы над заданием (без синтетических цифр):
          </p>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={operatorHours}
              onChange={e => setOperatorHours(e.target.value)}
              placeholder="Например: 2.5 часа"
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 flex-1 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSaveHours}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
              title="Сохранить в локальное состояние"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          </div>
          {isSaved && <span className="text-[10px] text-emerald-400 font-medium">✓ Время сохранено</span>}
        </div>

        {/* Tokens */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Использованные токены</span>
          </div>
          <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-amber-300/90 font-mono">
            Токены не учитывались / статистика недоступна в используемом инструменте
          </div>
          <p className="text-[10px] text-slate-500">
            Синтетические числа не выдумывались согласно принципу честности в ТЗ.
          </p>
        </div>
      </div>

      {/* Operator Independent Decisions (3-5 items) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span>Ключевые инженерные решения оператора (Human Decisions)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-indigo-300">
              1. Дедлайн вынесен из Hard Constraints в приоритет очереди
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Просроченный дедлайн не должен физически блокировать расселение. Привидение с просроченным сроком должно получить наивысший приоритет в диспетчеризации, а не статус невозможности.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-indigo-300">
              2. 100% отказ от LLM для вычисления скоринга
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Математический подбор реализован детерминированными чистыми функциями на TypeScript. Это гарантирует мгновенный отклик, нулевые затраты на API и стопроцентную повторяемость для тестов.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-indigo-300">
              3. Двухфазное ручное управление (Human-in-the-Loop)
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Оператору не запрещается выбор неидеальных или конфликтующих мест. Система выводит модальное окно с описанием всех рисков и требует подтверждения с указанием причины исключения.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs font-semibold text-indigo-300">
              4. Разрешение конкуренции за слоты с фиксацией вытеснения
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              При нехватке мест у популярной локации слот отдается более срочной заявке, а уступленная заявка получает 2-е по качеству место с понятным объяснением причины смещения.
            </p>
          </div>
        </div>
      </div>

      {/* AI Errors & Corrections */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>Ошибки AI и их устранение (AI Errors & Fixes)</span>
        </h4>
        <div className="p-4 bg-slate-950/60 border border-rose-900/40 rounded-xl space-y-2 text-xs">
          <div className="text-rose-300 font-semibold">
            • Ошибка первоначальной классификации фактора дедлайна:
          </div>
          <div className="text-slate-300 pl-3 border-l-2 border-rose-800 space-y-1">
            <p><strong>Что предложил AI:</strong> В первой версии плана AI предложил считать просроченный дедлайн (deadline &lt; 0) блокирующим hard constraint, делающим расселение невозможным.</p>
            <p><strong>Почему это было плохим решением:</strong> В реальном операционном процессе просроченное привидение (например, Луиза) обязано быть расселено как можно быстрее. Блокировать расселение из-за просрочки противоречит бизнес-логике бюро.</p>
            <p><strong>Как исправлено:</strong> Оператор вовремя скорректировал модель: дедлайн был перенесен в модуль приоритета очереди (`calculateGhostPriority`), поднимая просроченные заявки на самый верх диспетчерского списка.</p>
          </div>
        </div>
      </div>

      {/* Stages 1-8 Accordion */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Хронологические этапы разработки (1–8)</span>
        </h4>

        <div className="space-y-2">
          {stages.map(stage => {
            const isOpen = !!openStages[stage.number];
            return (
              <div
                key={stage.number}
                className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40"
              >
                <button
                  onClick={() => toggleStage(stage.number)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <span className="font-semibold text-xs text-slate-200">{stage.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 border-t border-slate-800/60 space-y-2.5 text-xs text-slate-300">
                    <div>
                      <strong className="text-indigo-300 block mb-0.5">Что сделал человек:</strong>
                      <p className="text-slate-400">{stage.humanAction}</p>
                    </div>
                    <div>
                      <strong className="text-sky-300 block mb-0.5">Что сделал AI:</strong>
                      <p className="text-slate-400">{stage.aiAction}</p>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <strong className="text-amber-300 block mb-0.5 font-mono text-[11px]">Ключевой промпт:</strong>
                      <p className="font-mono text-[11px] text-slate-300">{stage.keyPrompt}</p>
                    </div>
                    <div>
                      <strong className="text-emerald-300 block mb-0.5">Результат:</strong>
                      <p className="text-slate-300 font-medium">{stage.result}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Roadmap & What to improve */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>План будущих улучшений (Roadmap)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-100">1. Persistent Backend & ORM</span>
            <p className="text-slate-400">
              Переход с локального хранилища на PostgreSQL/FastAPI с аудитом изменений (Audit Trail) и версионированием заявок.
            </p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-100">2. Венгерский алгоритм (Kuhn-Munkres)</span>
            <p className="text-slate-400">
              Переход от жадного приоритетного подбора к глобальной максимизации суммарного коэффициента удовлетворенности бюро.
            </p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-100">3. Real-time Multi-Operator (WebSockets)</span>
            <p className="text-slate-400">
              Коллаборативная блокировка заявок в реальном времени, предотвращающая конфликт одновременных ручных назначений.
            </p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-100">4. Календарные события и сезонные аномалии</span>
            <p className="text-slate-400">
              Динамическое изменение характеристик мест по сезонам (период дождей в Маяке, приток туристов в Замок).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
