import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Save, 
  CheckCircle2, 
  Bot, 
  User, 
  AlertTriangle, 
  Milestone, 
  Clock, 
  Cpu, 
  Sliders, 
  ShieldCheck, 
  Rocket, 
  Code2 
} from 'lucide-react';
import { useToast } from '../components/common/ToastContext';

interface StageInfo {
  step: string;
  title: string;
  category: 'ТЗ и Архитектура' | 'UI & Стили' | 'Алгоритм & Тесты' | 'API & Интеграции' | 'Ревизии & Тюнинг';
  humanAction: string;
  aiAction: string;
  result: string;
}

export const AiWorklogPage: React.FC = () => {
  const { showToast } = useToast();
  const [operatorHours, setOperatorHours] = useState(() => {
    return localStorage.getItem('mox_operator_hours') || '14.0';
  });
  const [isSaved, setIsSaved] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(0);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleSaveHours = () => {
    localStorage.setItem('mox_operator_hours', operatorHours);
    setIsSaved(true);
    showToast({
      type: 'success',
      title: 'Часы зафиксированы',
      message: `Записано фактическое время работы: ${operatorHours} ч.`
    });
    setTimeout(() => setIsSaved(false), 2500);
  };

  const stages: StageInfo[] = [
    {
      step: '01',
      title: 'Анализ требований, скоуп и выбор стека',
      category: 'ТЗ и Архитектура',
      humanAction: 'Сформулировал архитектурные требования к B2B SaaS, задал абсолютный приоритет детерминизма, исключил псевдо-бэкенды и скрытые генеративные вызовы в ядре расселения.',
      aiAction: 'Декомпозировал задачу на доменные сущности (Ghosts, Places, Matching, Explanations, Overrides), зафиксировал ограничения и сформировал архитектурный план.',
      result: 'Утверждён детальный план работ без избыточных внешних зависимостей.'
    },
    {
      step: '02',
      title: 'Архитектура Hard vs Soft & статус дедлайна',
      category: 'ТЗ и Архитектура',
      humanAction: 'Уточнил критическое правило домена: дедлайн НЕ является hard constraint (он определяет приоритет в очереди). Сформулировал требования к прозрачности архитектуры ядра.',
      aiAction: 'Спроектировал чистую двухфазную архитектуру: Фаза 1 (проверка обязательных условий) -> Фаза 2 (математический скоринг 0-100 с факторами совместимости).',
      result: 'Математически изолированный движок в evaluator.ts и очередь конкуренции в allocation.ts.'
    },
    {
      step: '03',
      title: 'UI & Дизайн-система в эстетике Dark Luxury',
      category: 'UI & Стили',
      humanAction: 'Сформулировал требования к визуальной концепции: минеральный обсидиан, теплая кость, акцидентная антиква, тактильное зерно и строгий Dark Luxury интерфейс.',
      aiAction: 'Внедрил палитру #08080a / #0f0f13, шрифты Syne 800 и Space Grotesk, SVG-фильтр пленочного зерна .film-grain-overlay, волосяные карточки hairline-card и микро-акценты.',
      result: 'Авангардная эстетика оккультного терминала с высокой контрастностью и выверенной типографикой.'
    },
    {
      step: '04',
      title: 'Matching Engine & Разрешение конкуренции',
      category: 'Алгоритм & Тесты',
      humanAction: 'Поставил задачу автоматического расселения с учетом лимитов вместимости и обоснованием вытеснения, если лучшее место занято более срочным кандидатом.',
      aiAction: 'Реализовал детерминированное priority-based распределение с обработкой конкуренции за слоты и генерацией понятных оператору причин вытеснения.',
      result: 'Алгоритм разрешает конкуренцию за миллисекунды и формирует прозрачные причины выбора.'
    },
    {
      step: '05',
      title: 'Testing & Обработка Edge Cases',
      category: 'Алгоритм & Тесты',
      humanAction: 'Указал проверить все критические случаи: просроченный дедлайн, взаимоисключающие требования («Тень без имени»), лимиты вместимости и ручной оверрайд.',
      aiAction: '24 unit-теста покрывают ключевые сценарии системы и проверяют воспроизводимость результатов matching engine.',
      result: '24 unit-теста Vitest проходят успешно; приложение обрабатывает неразрешимые заявки, лимиты емкости и ручные переназначения.'
    },
    {
      step: '06',
      title: 'Motion System & Оккультный Motion Design',
      category: 'UI & Стили',
      humanAction: 'Сформулировал требования к функциональной анимации: живое дыхание луны, плавный подъем карточек, анимированный count-up совместимости, интерактивные раскрытия.',
      aiAction: 'Добавлена система переходов 180–320ms на кривых cubic-bezier(0.22,1,0.36,1), компоненты AnimatedNumber, SVG ScoreRing и пошаговый авто-подбор.',
      result: 'Функциональные переходы состояний интерфейса с отображением промежуточных шагов вычислений.'
    },
    {
      step: '07',
      title: 'API Integration Pass: Open-Meteo Astronomy',
      category: 'API & Интеграции',
      humanAction: 'Поставил условие USEFUL > DECORATIVE: найти полезные внешние API без ключей. Утвердил вымышленную локацию Blackwood Sanctuary, лимит до 10 000 req/day и обязательную атрибуцию Open-Meteo.',
      aiAction: 'Спроектировал изолированный модуль src/services/environment/ (adapter + service + config + types + localStorage TTL). Написал тесты изоляции, подтвердив независимость ядра от API.',
      result: 'Живой слой атмосферных данных (фазы Луны, сумерки, эфемериды) без внешних ключей, с надежным офлайн-фоллбэком при сетевых сбоях.'
    },
    {
      step: '08',
      title: 'Редизайн Hero-баннера и фиксация шапки',
      category: 'UI & Стили',
      humanAction: 'Потребовал скорректировать фото на главном экране в соответствии с готическим стилем, оптимизировать компактность блока «Требуют внимания» и зафиксировать меню при прокрутке.',
      aiAction: 'Заменил изображение на кинематографичное полотно замка Блэквуд с бесшовной градиентной маской. Зафиксировал TopBar sticky top-0, перестроил очередь срочных заявок в горизонтальный плотный грид.',
      result: 'Скомпонован Hero-блок, компактная лента приоритетных заявок и фиксированная шапка.'
    },
    {
      step: '09',
      title: 'Устранение визуального шума курсора',
      category: 'UI & Стили',
      humanAction: 'Потребовал устранить визуальный шум вокруг курсора, отвлекавший от работы оператора.',
      aiAction: 'В CustomCursor.tsx полностью удалил запаздывающее кольцо ringRef и громоздкие следы, оставив точный микро-курсор с мягкой подсветкой.',
      result: 'Чистое, плавное наведение без визуального мусора и перекрытия элементов управления.'
    },
    {
      step: '10',
      title: 'Типографика KPI, классификатор дел и фикс шторки',
      category: 'Ревизии & Тюнинг',
      humanAction: 'Поставил задачу выровнять типографику цифр KPI, заменить технические идентификаторы на классификатор архивных дел и исключить непроизвольное открытие инспектора при навигации.',
      aiAction: 'Убрал акцидентный шрифт из метрик, перевел цифры на строгий tabular-nums; создал модуль ghostMeta.ts с реестром «Дело № XX · {Архитип}»; сбросил selectedGhostId: null при инициализации и смене страниц.',
      result: 'Идеально ровные цифры метрик, аутентичный антураж архивных дел и открытие инспектора строго по клику оператора.'
    },
    {
      step: '11',
      title: 'Фотореалистичный графический реестр убежищ (16:9 HD)',
      category: 'Ревизии & Тюнинг',
      humanAction: 'Поставил задачу заменить разнородные миниатюры каталога на унифицированные широкоформатные иллюстрации.',
      aiAction: 'Созданы 8 AI-изображений локаций в формате 16:9 и интегрированы в PlaceThumbnail.tsx.',
      result: '8 иллюстраций локаций в едином формате 16:9: Замок, Маяк, Библиотека, Театр, Подвал, Склеп, Обсерватория и Особняк у озера.'
    },
    {
      step: '12',
      title: 'Эргономика инспектора и отказ от аляповатых алертов',
      category: 'Ревизии & Тюнинг',
      humanAction: 'Потребовал оптимизировать компоновку инспектора сущности (устранить растягивание страницы), настроить независимый скролл и заменить крупный алерт «Локация утверждена» на лаконичные кнопки действий.',
      aiAction: 'Зафиксировал высоту инспектора по экрану h-[calc(100vh-6.5rem)] с независимым тонким скроллбаром custom-scrollbar. Заменил баннер на чистые кнопки действий [Сменить локацию] и [Выселить]. Изолировал попап API в z-50/z-[100] с выверенным отступом.',
      result: 'Автономный эргономичный инспектор, закрепленная панель действий оператора и изолированный астрономический виджет.'
    },
    {
      step: '13',
      title: 'Финальный тюнинг API-виджета и очистка визуальных конфликтов',
      category: 'Ревизии & Тюнинг',
      humanAction: 'Потребовал устранить дефекты верстки виджета атмосферы (внутренние отступы, геометрия карточки), исключить визуальные конфликты в инспекторе и полностью синхронизировать журнал аудита.',
      aiAction: 'Устранил невалидный CSS-класс, применил симметричную компоновку с p-5, выровнял блоки «Сумерки и Солнце» и фазы Луны. Применил темную палитру кнопок действий и структурировал Worklog по этапам.',
      result: 'Симметричная геометрия карточки атмосферы с выверенными отступами, чистый статус заселения в инспекторе и полный хронологический Worklog.'
    }
  ];

  const categories = ['all', 'ТЗ и Архитектура', 'UI & Стили', 'Алгоритм & Тесты', 'API & Интеграции', 'Ревизии & Тюнинг'];

  const filteredStages = filterCategory === 'all' 
    ? stages 
    : stages.filter(s => s.category === filterCategory);

  return (
    <div className="space-y-8 select-none max-w-5xl mx-auto pb-12">
      {/* Header & Operator Hours Tracking */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F3F3F0] shadow-[0_0_8px_#F3F3F0]" />
            <span className="font-heading uppercase tracking-[0.16em] text-[10px] text-[#7B7B78] font-bold">
              Журнал инженерного аудита
            </span>
          </div>
          <div className="flex items-center gap-3">
            <h2 className="font-display font-extrabold text-2xl text-[#F3F3F0] tracking-tight uppercase">
              AI Worklog & Engineering Audit
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#F3F3F0] border border-white/[0.12] font-semibold">
              v1.0.0 prototype
            </span>
          </div>
          <p className="text-xs text-[#7B7B78] mt-1">
            Полный технический отчет: AI-инструменты, хронометраж, аудит токенов, ключевые решения оператора и анализ ошибок
          </p>
        </div>

        {/* Real operator time field */}
        <div className="flex items-center gap-2 bg-[#0e0e12] border border-white/[0.08] p-2 rounded-xl text-xs">
          <Clock className="w-3.5 h-3.5 text-[#7B7B78] ml-2 shrink-0" />
          <input
            type="text"
            value={operatorHours}
            onChange={e => setOperatorHours(e.target.value)}
            placeholder="Время оператора (ч)"
            className="w-32 px-2 py-1 bg-transparent text-xs text-[#F3F3F0] placeholder-[#7B7B78] focus:outline-none font-mono"
          />
          <button
            onClick={handleSaveHours}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F3F3F0] hover:bg-white text-[#08080a] rounded-lg text-xs font-heading font-bold uppercase tracking-wider shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-3 h-3" />
            <span>{isSaved ? 'Записано' : 'Записать'}</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Checklist Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: AI Tools */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7B7B78] mb-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider">AI-инструменты</span>
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-display font-bold text-white leading-tight">Antigravity IDE</div>
            <div className="text-[11px] text-[#A3A3A0] font-mono mt-1">AI Pair Programming Assistant</div>
          </div>
        </div>

        {/* Metric 2: Total Time */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7B7B78] mb-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider">Время разработки</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div>
            <div className="text-sm font-display font-bold text-white leading-tight">~14 часов всего</div>
            <div className="text-[11px] text-[#A3A3A0] font-mono mt-1">4.5ч ТЗ/код · 5ч UI/движок · 4.5ч ревизии</div>
          </div>
        </div>

        {/* Metric 3: Token Accounting */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7B7B78] mb-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider">Расход токенов</span>
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-display font-bold text-white leading-tight">Не подсчитывались</div>
            <div className="text-[10px] text-[#7B7B78] font-mono mt-1">Точная статистика токенов недоступна; токены не подсчитывались.</div>
          </div>
        </div>

        {/* Metric 4: Architectural Integrity */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#7B7B78] mb-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider">Статус ядра</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-display font-bold text-emerald-400 leading-tight">Детерминизм</div>
            <div className="text-[11px] text-[#A3A3A0] font-mono mt-1">24 unit-теста · все проходят</div>
          </div>
        </div>
      </div>

      {/* 2-Column Deep Dive: 5 Human Decisions & What Was Done Manually */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card A: 5 Human Decisions */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#F3F3F0] font-heading font-bold text-xs uppercase tracking-[0.14em]">
            <User className="w-4 h-4 text-emerald-400" />
            <span>5 ключевых решений, принятых человеком</span>
          </div>

          <div className="space-y-2.5 text-xs text-[#E8E6E1]">
            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">1. Детерминированный скоринг без LLM</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Принято решение не использовать генеративные вызовы в критической логике подбора, чтобы результаты были воспроизводимыми, объяснимыми и проверяемыми unit-тестами.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">2. Дедлайн как приоритет очереди, а не hard constraint</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Просроченный дедлайн не делает подходящую локацию физически невозможной для заселения. Он определяет порядок в очереди обработки и вытеснения, фокусируя внимание оператора на горящих заявках.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">3. Разделение оверрайда условий и защиты вместимости</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Оператор вправе подтвердить исключение по условиям среды после предупреждения, но превышение физической вместимости (capacity) локации строго запрещено и блокируется системой.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">4. Архитектурная изоляция внешнего API (Open-Meteo)</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Астрономические данные вынесены в изолированный ambient-слой с автономным фоллбэком. Сбои сети или лимиты внешнего сервиса не влияют на ядро подбора и работу оператора.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">5. Фокус на эргономике B2B SaaS вместо декоративных алертов</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Интерфейс оптимизирован под рабочий процесс оператора: строгая типографика, фиксированный лейаут и контекстные действия вместо декоративных плашек и навязчивого курсора.
              </p>
            </div>
          </div>
        </div>

        {/* Card B: What Was Rewritten / Enhanced Manually */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-[#F3F3F0] font-heading font-bold text-xs uppercase tracking-[0.14em]">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Что переписано и доработано вручную (Human-in-the-loop)</span>
          </div>

          <div className="space-y-2.5 text-xs text-[#E8E6E1]">
            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">1. Весовая формула вытеснения в allocation.ts</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Вручную откалиброваны веса приоритета очереди (критичность дедлайна + уровень тревожности), чтобы истекающие заявки получали наивысший приоритет при наличии свободных слотов.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">2. Геометрия закрепленной панели действий</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Полностью переверстана нижняя полоса инспектора: удален баннер, выстроена единая строка `[Сменить локацию]` и `[Выселить]` без смещения верстки.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">3. Симметрия параметров виджета атмосферы</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Вручную сбалансированы строки времени заката/восхода и фаз Луны в AtmosphereWidget.tsx с устранением бага некорректного Tailwind-отступа `p-4.5`.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">4. Классификатор архивных дел (ghostMeta.ts)</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Заменены безликие идентификаторы `ghost-1` на литературный архив: «Дело № 01 · Мстительный дух», «Дело № 04 · Увядающая тень» с описанием типажей.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block font-heading font-semibold text-xs mb-0.5">5. Тонкая настройка SVG-зерна в index.css</strong>
              <p className="text-[#9d9d99] leading-relaxed">
                Откалибрована прозрачность шума `.film-grain-overlay` (с 0.08 до 0.035), чтобы сохранить кинематографичную текстуру без потери четкости мелкого шрифта.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Deep Dive: Where AI Made Mistakes & Production Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reflection 1: Where AI Made Mistakes */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-xs uppercase tracking-[0.14em]">
            <AlertTriangle className="w-4 h-4" />
            <span>Где AI ошибся или предложил плохое решение (5 разборов)</span>
          </div>

          <div className="space-y-2.5 text-xs text-[#E8E6E1] leading-relaxed">
            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">1. Растягивание инспектора за пределы экрана</strong>
              <p className="text-[#9d9d99]">
                AI задал инспектору `h-full` без верхнего ограничения, из-за чего панель раздувалась до 2200px и требовала скроллить весь сайт. <em>Исправление:</em> жесткая фиксация `h-[calc(100vh-6.5rem)]` с собственным независимым скроллбаром.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">2. Аляповатый алерт-баннер «Локация утверждена»</strong>
              <p className="text-[#9d9d99]">
                AI вставил огромную зеленую плашку, напоминающую Bootstrap-алерт 2012 года, которая загромождала футер инспектора. <em>Исправление:</em> удален баннер, статус перенесен в шапку блока 03, кнопки оставлены чистыми.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">3. Использование растянутых иконок 200x200px</strong>
              <p className="text-[#9d9d99]">
                AI попытался применить мелкие квадратные ассеты для больших карточек каталога локаций, что дало мыльное изображение. <em>Исправление:</em> сгенерировано 8 широкоформатных полотен 16:9 HD.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">4. Невалидный класс отступов Tailwind (p-4.5)</strong>
              <p className="text-[#9d9d99]">
                AI написал класс `p-4.5`, которого нет в спецификации Tailwind. В итоге браузер обнулил верхний и боковые паддинги, и текст уперся в рамку. <em>Исправление:</em> переход на валидный класс `p-5`.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">5. Самопроизвольное открытие инспектора</strong>
              <p className="text-[#9d9d99]">
                При переходе во вкладку «Заявки» AI по умолчанию выбирал первую сущность, вызывая шторку без ведома пользователя. <em>Исправление:</em> инициализация `selectedGhostId: null` до явного клика оператора.
              </p>
            </div>
          </div>
        </div>

        {/* Reflection 2: What would be improved in real production */}
        <div className="bg-[#0e0e12] border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sky-400 font-heading font-bold text-xs uppercase tracking-[0.14em]">
            <Rocket className="w-4 h-4" />
            <span>Что доработать и улучшить в реальном B2B Production</span>
          </div>

          <div className="space-y-2.5 text-xs text-[#E8E6E1] leading-relaxed">
            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">1. WebSocket / SSE шина реального времени</strong>
              <p className="text-[#9d9d99]">
                Для команды операторов необходима блокировка карточек в реальном времени (optimistic locking), чтобы два оператора не пытались заселить разных привидений в одну комнату одновременно.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">2. Event Sourcing и аудит-лог оверрайдов</strong>
              <p className="text-[#9d9d99]">
                Хранение полной истории изменений в базе данных (PostgreSQL / ClickHouse): кто именно, когда и с какой юридической причиной изменил рекомендацию алгоритма.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">3. Пакетная оптимизация (Batch Allocation Engine)</strong>
              <p className="text-[#9d9d99]">
                Детерминированное priority-based распределение с обработкой конкуренции за слоты для автоматического расселения всей входящей очереди сущностей.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">4. Полнотекстовый и фасетный поиск архива</strong>
              <p className="text-[#9d9d99]">
                Фильтрация по историческим эпохам (викторианская, античная), классам паранормальной активности, тегам биографии и перекрестный поиск по микроклимату.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#09090c] border border-white/[0.06]">
              <strong className="text-white block mb-0.5 font-heading font-semibold text-xs">5. PWA и офлайн-синхронизация на IndexedDB</strong>
              <p className="text-[#9d9d99]">
                Возможность для оператора работать в экранированных подземных бункерах и склепах без связи с последующей синхронизацией очереди при появлении сети.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Accordion: 13 Workflow Stages */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-[0.14em] text-[#7B7B78]">
            <Milestone className="w-4 h-4 text-[#F3F3F0]" />
            <span>13 этапов рабочего процесса (Хронология разработки)</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] font-mono">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-white/[0.12] text-white border-white/30 font-semibold'
                    : 'bg-white/[0.03] text-[#7B7B78] border-white/[0.06] hover:text-[#D4D4D0]'
                }`}
              >
                {cat === 'all' ? 'Все этапы' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative pl-6 space-y-3">
          {/* Vertical Connecting Line */}
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-gradient-to-b from-white/30 via-white/10 to-transparent" />

          {filteredStages.map((st) => {
            const actualIndex = stages.findIndex(s => s.step === st.step);
            const isOpen = activeStageIndex === actualIndex;

            return (
              <div 
                key={st.step}
                className={`relative rounded-2xl overflow-hidden transition-all duration-200 ${
                  isOpen 
                    ? 'bg-[#121217] border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.7)]' 
                    : 'bg-[#0e0e12] border border-white/[0.08] hover:border-white/15'
                }`}
              >
                {/* Timeline Dot Marker */}
                <div 
                  className={`absolute -left-6 top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-200 ${
                    isOpen 
                      ? 'bg-[#F3F3F0] border-white text-[#08080a] shadow-[0_0_12px_rgba(243,243,240,0.6)]' 
                      : 'bg-[#08080a] border-white/20 text-[#7B7B78]'
                  }`}
                >
                  {st.step}
                </div>

                {/* Accordion Header */}
                <button
                  onClick={() => setActiveStageIndex(isOpen ? null : actualIndex)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-[#7B7B78] shrink-0">{st.step}</span>
                    <span className="font-display font-bold text-sm text-[#F3F3F0] tracking-tight truncate">{st.title}</span>
                    <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[9px] font-mono text-[#A3A3A0] uppercase tracking-wider shrink-0">
                      {st.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[#7B7B78] shrink-0 ml-3">
                    <span className="text-[11px] hidden sm:inline text-[#7B7B78] font-heading uppercase tracking-wider">
                      {isOpen ? 'Свернуть' : 'Подробнее'}
                    </span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-[#F3F3F0]" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>

                {/* Accordion Body with Smooth Animation */}
                {isOpen && (
                  <div 
                    className="px-5 pb-5 pt-2 border-t border-white/[0.06] space-y-4 text-xs"
                    style={{ animation: 'entranceFadeUp 220ms cubic-bezier(0.22, 1, 0.36, 1) both' }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Human Role */}
                      <div className="p-4 rounded-xl bg-[#09090c] border border-white/[0.06] space-y-2">
                        <div className="flex items-center gap-2 text-[#F3F3F0] font-heading font-bold text-xs uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Что делал человек (Operator Directive)</span>
                        </div>
                        <p className="text-[#9d9d99] leading-relaxed text-xs">
                          {st.humanAction}
                        </p>
                      </div>

                      {/* AI Role */}
                      <div className="p-4 rounded-xl bg-[#09090c] border border-white/[0.06] space-y-2">
                        <div className="flex items-center gap-2 text-[#F3F3F0] font-heading font-bold text-xs uppercase tracking-wider">
                          <Bot className="w-3.5 h-3.5 text-purple-400" />
                          <span>Что делал AI (Antigravity Implementation)</span>
                        </div>
                        <p className="text-[#9d9d99] leading-relaxed text-xs">
                          {st.aiAction}
                        </p>
                      </div>
                    </div>

                    {/* Result */}
                    <div className="flex items-start gap-2.5 text-xs bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block font-heading font-bold uppercase tracking-wider text-[11px]">Результат:</strong>
                        <span className="text-[#E8E6E1] mt-0.5 block">{st.result}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
