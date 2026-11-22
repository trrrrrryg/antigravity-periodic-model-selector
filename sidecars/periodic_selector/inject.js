(() => {
  const VER = 12;
  const PTABLE_HOST_ID = 'agy-ptable-host';
  const SUB_HOST_ID = 'agy-ptable-sub-host';
  const FX_HOST_ID = 'agy-ptable-fx-host';
  const MENU_CSS_ID = 'agy-ptable-menu-override-css';

  if (window.__AGY_PTABLE && window.__AGY_PTABLE.ver === VER) return;
  try {
    if (window.__AGY_PTABLE && typeof window.__AGY_PTABLE.unmount === 'function') {
      window.__AGY_PTABLE.unmount();
    }
  } catch {}

  // Compact 118-element registry: [num, symbol, enName, zhName, row(1..10), col(1..18), cat]
  // Row 8 is a subtle spacer, rows 9..10 hold Lanthanides (57-71) & Actinides (89-103).
  // Any present or future Gemini element model automatically resolves here via enName/zhName/symbol/alias.
  const RAW_ELEMENTS = [
    [1,'H','Hydrogen','氢',1,1,'nonmetal'],[2,'He','Helium','氦',1,18,'noble'],
    [3,'Li','Lithium','锂',2,1,'alkali'],[4,'Be','Beryllium','铍',2,2,'alkaline'],
    [5,'B','Boron','硼',2,13,'metalloid'],[6,'C','Carbon','碳',2,14,'nonmetal'],
    [7,'N','Nitrogen','氮',2,15,'nonmetal'],[8,'O','Oxygen','氧',2,16,'nonmetal'],
    [9,'F','Fluorine','氟',2,17,'halogen'],[10,'Ne','Neon','氖',2,18,'noble'],
    [11,'Na','Sodium','钠',3,1,'alkali'],[12,'Mg','Magnesium','镁',3,2,'alkaline'],
    [13,'Al','Aluminum','铝',3,13,'post'],[14,'Si','Silicon','硅',3,14,'metalloid'],
    [15,'P','Phosphorus','磷',3,15,'nonmetal'],[16,'S','Sulfur','硫',3,16,'nonmetal'],
    [17,'Cl','Chlorine','氯',3,17,'halogen'],[18,'Ar','Argon','氩',3,18,'noble'],
    [19,'K','Potassium','钾',4,1,'alkali'],[20,'Ca','Calcium','钙',4,2,'alkaline'],
    [21,'Sc','Scandium','钪',4,3,'trans'],[22,'Ti','Titanium','钛',4,4,'trans'],
    [23,'V','Vanadium','钒',4,5,'trans'],[24,'Cr','Chromium','铬',4,6,'trans'],
    [25,'Mn','Manganese','锰',4,7,'trans'],[26,'Fe','Iron','铁',4,8,'trans'],
    [27,'Co','Cobalt','钴',4,9,'trans'],[28,'Ni','Nickel','镍',4,10,'trans'],
    [29,'Cu','Copper','铜',4,11,'trans'],[30,'Zn','Zinc','锌',4,12,'trans'],
    [31,'Ga','Gallium','镓',4,13,'post'],[32,'Ge','Germanium','锗',4,14,'metalloid'],
    [33,'As','Arsenic','砷',4,15,'metalloid'],[34,'Se','Selenium','硒',4,16,'nonmetal'],
    [35,'Br','Bromine','溴',4,17,'halogen'],[36,'Kr','Krypton','氪',4,18,'noble'],
    [37,'Rb','Rubidium','铷',5,1,'alkali'],[38,'Sr','Strontium','锶',5,2,'alkaline'],
    [39,'Y','Yttrium','钇',5,3,'trans'],[40,'Zr','Zirconium','锆',5,4,'trans'],
    [41,'Nb','Niobium','铌',5,5,'trans'],[42,'Mo','Molybdenum','钼',5,6,'trans'],
    [43,'Tc','Technetium','锝',5,7,'trans'],[44,'Ru','Ruthenium','钌',5,8,'trans'],
    [45,'Rh','Rhodium','铑',5,9,'trans'],[46,'Pd','Palladium','钯',5,10,'trans'],
    [47,'Ag','Silver','银',5,11,'trans'],[48,'Cd','Cadmium','镉',5,12,'trans'],
    [49,'In','Indium','铟',5,13,'post'],[50,'Sn','Tin','锡',5,14,'post'],
    [51,'Sb','Antimony','锑',5,15,'metalloid'],[52,'Te','Tellurium','碲',5,16,'metalloid'],
    [53,'I','Iodine','碘',5,17,'halogen'],[54,'Xe','Xenon','氙',5,18,'noble'],
    [55,'Cs','Cesium','铯',6,1,'alkali'],[56,'Ba','Barium','钡',6,2,'alkaline'],
    [57,'La','Lanthanum','镧',9,4,'lanth'],[58,'Ce','Cerium','铈',9,5,'lanth'],
    [59,'Pr','Praseodymium','镨',9,6,'lanth'],[60,'Nd','Neodymium','钕',9,7,'lanth'],
    [61,'Pm','Promethium','钷',9,8,'lanth'],[62,'Sm','Samarium','钐',9,9,'lanth'],
    [63,'Eu','Europium','铕',9,10,'lanth'],[64,'Gd','Gadolinium','钆',9,11,'lanth'],
    [65,'Tb','Terbium','铽',9,12,'lanth'],[66,'Dy','Dysprosium','镝',9,13,'lanth'],
    [67,'Ho','Holmium','钬',9,14,'lanth'],[68,'Er','Erbium','铒',9,15,'lanth'],
    [69,'Tm','Thulium','铥',9,16,'lanth'],[70,'Yb','Ytterbium','镱',9,17,'lanth'],
    [71,'Lu','Lutetium','镥',9,18,'lanth'],
    [72,'Hf','Hafnium','铪',6,4,'trans'],[73,'Ta','Tantalum','钽',6,5,'trans'],
    [74,'W','Tungsten','钨',6,6,'trans'],[75,'Re','Rhenium','铼',6,7,'trans'],
    [76,'Os','Osmium','锇',6,8,'trans'],[77,'Ir','Iridium','铱',6,9,'trans'],
    [78,'Pt','Platinum','铂',6,10,'trans'],[79,'Au','Gold','金',6,11,'trans'],
    [80,'Hg','Mercury','汞',6,12,'trans'],[81,'Tl','Thallium','铊',6,13,'post'],
    [82,'Pb','Lead','铅',6,14,'post'],[83,'Bi','Bismuth','铋',6,15,'post'],
    [84,'Po','Polonium','钋',6,16,'metalloid'],[85,'At','Astatine','砹',6,17,'halogen'],
    [86,'Rn','Radon','氡',6,18,'noble'],
    [87,'Fr','Francium','钫',7,1,'alkali'],[88,'Ra','Radium','镭',7,2,'alkaline'],
    [89,'Ac','Actinium','锕',10,4,'actin'],[90,'Th','Thorium','钍',10,5,'actin'],
    [91,'Pa','Protactinium','镤',10,6,'actin'],[92,'U','Uranium','铀',10,7,'actin'],
    [93,'Np','Neptunium','镎',10,8,'actin'],[94,'Pu','Plutonium','钚',10,9,'actin'],
    [95,'Am','Americium','镅',10,10,'actin'],[96,'Cm','Curium','锔',10,11,'actin'],
    [97,'Bk','Berkelium','锫',10,12,'actin'],[98,'Cf','Californium','锎',10,13,'actin'],
    [99,'Es','Einsteinium','锿',10,14,'actin'],[100,'Fm','Fermium','镄',10,15,'actin'],
    [101,'Md','Mendelevium','钔',10,16,'actin'],[102,'No','Nobelium','锘',10,17,'actin'],
    [103,'Lr','Lawrencium','铹',10,18,'actin'],
    [104,'Rf','Rutherfordium','𬬻',7,4,'trans'],[105,'Db','Dubnium','𬭊',7,5,'trans'],
    [106,'Sg','Seaborgium','𬭳',7,6,'trans'],[107,'Bh','Bohrium','𬭛',7,7,'trans'],
    [108,'Hs','Hassium','𬭶',7,8,'trans'],[109,'Mt','Meitnerium','鿏',7,9,'trans'],
    [110,'Ds','Darmstadtium','𫟼',7,10,'trans'],[111,'Rg','Roentgenium','𬬭',7,11,'trans'],
    [112,'Cn','Copernicium','鿔',7,12,'trans'],[113,'Nh','Nihonium','鿭',7,13,'post'],
    [114,'Fl','Flerovium','𫓧',7,14,'post'],[115,'Mc','Moscovium','镆',7,15,'post'],
    [116,'Lv','Livermorium','𫟷',7,16,'post'],[117,'Ts','Tennessine','鿬',7,17,'halogen'],
    [118,'Og','Oganesson','鿫',7,18,'noble'],
  ];

  const ELEMENTS = RAW_ELEMENTS.map(([num, symbol, en, zh, row, col, cat]) => ({
    num, symbol, en, zh, row, col, cat,
  }));

  const ELEMENT_BY_TOKEN = new Map();
  const ELEMENT_BY_SYMBOL = new Map();
  for (const el of ELEMENTS) {
    ELEMENT_BY_TOKEN.set(el.en.toLowerCase(), el);
    ELEMENT_BY_TOKEN.set(el.zh, el);
    ELEMENT_BY_SYMBOL.set(el.symbol.toLowerCase(), el);
  }
  // British spelling alias safeguard (e.g. Aluminium)
  ELEMENT_BY_TOKEN.set('aluminium', ELEMENT_BY_TOKEN.get('aluminum'));
  ELEMENT_BY_TOKEN.set('caesium', ELEMENT_BY_TOKEN.get('cesium'));

  // Distinct fixed highlight palettes for active elements (extensible across all categories)
  const SPECIFIC_ACCENTS = {
    H:  { rgb: '56, 189, 248',  hex: '#38BDF8', label: '#BAE6FD', bgAlpha: 0.22 },
    C:  { rgb: '16, 185, 129',  hex: '#34D399', label: '#A7F3D0', bgAlpha: 0.20 },
    Ne: { rgb: '249, 115, 22',  hex: '#FB923C', label: '#FED7AA', bgAlpha: 0.22 },
    Ar: { rgb: '139, 92, 246',  hex: '#A78BFA', label: '#DDD6FE', bgAlpha: 0.22 },
  };
  const CAT_ACCENTS = {
    nonmetal:  { rgb: '56, 189, 248',  hex: '#38BDF8', label: '#BAE6FD', bgAlpha: 0.20 },
    noble:     { rgb: '168, 85, 247',  hex: '#C084FC', label: '#E9D5FF', bgAlpha: 0.20 },
    alkali:    { rgb: '244, 63, 94',   hex: '#FB7185', label: '#FECDD3', bgAlpha: 0.20 },
    alkaline:  { rgb: '245, 158, 11',  hex: '#FBBF24', label: '#FDE68A', bgAlpha: 0.20 },
    metalloid: { rgb: '20, 184, 166',  hex: '#2DD4BF', label: '#99F6E4', bgAlpha: 0.20 },
    halogen:   { rgb: '234, 179, 8',   hex: '#FACC15', label: '#FEF08A', bgAlpha: 0.20 },
    trans:     { rgb: '59, 130, 246',  hex: '#60A5FA', label: '#BFDBFE', bgAlpha: 0.20 },
    post:      { rgb: '6, 182, 212',   hex: '#22D3EE', label: '#A5F3FC', bgAlpha: 0.20 },
    lanth:     { rgb: '236, 72, 153',  hex: '#F472B6', label: '#FBCFE8', bgAlpha: 0.20 },
    actin:     { rgb: '239, 68, 68',   hex: '#F87171', label: '#FECACA', bgAlpha: 0.20 },
  };

  function mixSolidRgb(rgbStr, ratio, base = [20, 21, 27]) {
    const parts = rgbStr.split(',').map((s) => Number(s.trim()));
    const r = Math.round(base[0] * (1 - ratio) + parts[0] * ratio);
    const g = Math.round(base[1] * (1 - ratio) + parts[1] * ratio);
    const b = Math.round(base[2] * (1 - ratio) + parts[2] * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }

  function accentForElement(el) {
    const a = SPECIFIC_ACCENTS[el.symbol] || CAT_ACCENTS[el.cat] || CAT_ACCENTS.nonmetal;
    return {
      ...a,
      solidBg: mixSolidRgb(a.rgb, 0.30, [20, 21, 27]),
      solidHover: mixSolidRgb(a.rgb, 0.44, [22, 23, 30]),
      solidLocked: mixSolidRgb(a.rgb, 0.17, [22, 23, 29]),
    };
  }

  let runtimeConfig = { tierOverride: 'auto', particleScale: 1 };
  let pendingConfigPatch = null;
  let updateInfo = null;
  let pendingUpdateAction = null;
  let activeUpdBtn = null;
  let activeUpdPop = null;
  let updDocClickHandler = null;
  let updKeyHandler = null;
  let lastTelemetry = null;
  let customAliasMap = new Map();
  let activeToastTimer = null;

  // Inject light page CSS override ONLY for the widened model selector popup & bottom-list separator
  function ensureMenuOverrideCss() {
    let style = document.getElementById(MENU_CSS_ID);
    if (style) return style;
    style = document.createElement('style');
    style.id = MENU_CSS_ID;
    style.textContent = `
      div[role="menu"].agy-ptable-expanded {
        max-width: calc(100vw - 24px) !important;
        width: max-content !important;
        max-height: calc(100dvh - 84px) !important;
        overflow-y: auto !important;
      }
      div[role="menu"].agy-ptable-expanded [data-testid="model-selector-panel"] {
        width: max-content !important;
        min-width: 100% !important;
      }
      .agy-ptable-hidden-row {
        display: none !important;
      }
      .agy-ptable-section-label {
        font-size: 11px;
        color: var(--muted-foreground, #8E909A);
        padding: 4px 8px 3px;
        margin-top: 2px;
        border-top: 1px solid var(--border, rgba(255, 255, 255, 0.09));
        display: flex;
        align-items: center;
        justify-content: space-between;
        user-select: none;
      }
    `;
    document.head.appendChild(style);
    return style;
  }

  function getModelContext() {
    const trig = document.querySelector('[data-testid="model-selector-trigger"]');
    if (!trig) return null;
    const fk = Object.keys(trig).find((k) => k.startsWith('__reactFiber$'));
    let cur = fk ? trig[fk] : null;
    for (let i = 0; i < 50 && cur; i++) {
      const v = cur.memoizedProps && cur.memoizedProps.value;
      if (v && Array.isArray(v.modelOptions)) return v;
      cur = cur.return;
    }
    return null;
  }

  function detectTier(ctx) {
    const ut = ctx?.userStatus?.userTier;
    const id = String(ut?.id || '').toLowerCase();
    const name = String(ut?.name || ut?.description || '').toLowerCase();
    let detectedKind = 'pro';
    if (/ultra/.test(id) || /ultra/.test(name)) detectedKind = 'ultra';
    else if (/free|starter|basic/.test(id) || /\bfree\b/.test(name)) detectedKind = 'free';
    else if (/pro/.test(id) || /\bpro\b/.test(name)) detectedKind = 'pro';

    const effectiveKind =
      runtimeConfig?.tierOverride && runtimeConfig.tierOverride !== 'auto'
        ? runtimeConfig.tierOverride
        : detectedKind;

    return {
      detectedKind,
      detectedName: ut?.name || (detectedKind === 'ultra' ? 'Google AI Ultra' : detectedKind === 'free' ? 'Free Tier' : 'Google AI Pro'),
      effectiveKind,
      isSimulated: runtimeConfig?.tierOverride && runtimeConfig.tierOverride !== 'auto',
    };
  }

  function stripEffortSuffix(label) {
    return String(label || '')
      .replace(/\s*\((Low|Medium|High|XHigh|Minimal)\)\s*$/i, '')
      .trim();
  }

  function extractEffortName(label, modelId) {
    const m = String(label || '').match(/\((Low|Medium|High|XHigh|Minimal)\)\s*$/i);
    if (m) return m[1];
    const idm = String(modelId || '').match(/-(low|medium|high|xhigh|minimal)$/i);
    if (idm) {
      const s = idm[1].toLowerCase();
      return s === 'xhigh' ? 'XHigh' : s.charAt(0).toUpperCase() + s.slice(1);
    }
    return 'Default';
  }

  function resolveElementFromFamily(familyName, sampleOpt) {
    if (!familyName) return null;
    // Composite orchestrators / 3P / older non-periodic series stay in the normal menu below
    if (/orchestrator|编排器|claude|gpt|flash/i.test(familyName)) return null;

    // 1. User-registered runtime alias if any
    for (const [alias, sym] of customAliasMap.entries()) {
      if (familyName.toLowerCase().includes(alias.toLowerCase())) {
        return ELEMENT_BY_SYMBOL.get(sym.toLowerCase()) || null;
      }
    }

    // 2. Match any IUPAC element full English name or Chinese name anywhere in tokens
    const cleanTokens = familyName
      .replace(/[^A-Za-z0-9\u4e00-\u9fff]+/g, ' ')
      .trim()
      .split(/\s+/);
    for (const tok of cleanTokens) {
      const low = tok.toLowerCase();
      if (ELEMENT_BY_TOKEN.has(low)) return ELEMENT_BY_TOKEN.get(low);
      if (ELEMENT_BY_TOKEN.has(tok)) return ELEMENT_BY_TOKEN.get(tok);
    }

    // 3. Match Gemini 4+ <Symbol> shorthand if future model omits full name
    const symMatch = familyName.match(/gemini\s+[4-9]\d*(?:\.\d+)?\s+([A-Z][a-z]?)\b/);
    if (symMatch && ELEMENT_BY_SYMBOL.has(symMatch[1].toLowerCase())) {
      return ELEMENT_BY_SYMBOL.get(symMatch[1].toLowerCase());
    }

    // 4. Fallback on modelId slug segments (e.g. gemini-4-argon-medium)
    const idParts = String(sampleOpt?.modelId || '').toLowerCase().split(/[-_]+/);
    for (const part of idParts) {
      if (ELEMENT_BY_TOKEN.has(part)) return ELEMENT_BY_TOKEN.get(part);
    }
    return null;
  }

  function evaluateAvailability(entry, tierInfo) {
    const isSeries4Plus = /gemini\s+[4-9]/i.test(entry.familyName) || /gemini-[4-9]/i.test(entry.sampleOpt?.modelId || '');
    const elSym = entry.element.symbol;
    const isCarbon = elSym === 'C';
    const rawDisabled = entry.variants.every((v) => !!v.disabled);
    const serverReason = entry.sampleOpt?.tagDescription || '';

    // Tier policy requested by user:
    // - Free: 4-series models unavailable
    // - Pro: Carbon unavailable, other 4-series available (unless backend disabled)
    // - Ultra: No tier restriction
    if (tierInfo.effectiveKind === 'free' && isSeries4Plus) {
      return {
        available: false,
        tierLocked: true,
        requiredTier: 'Pro / Ultra',
        reason: 'Free 免费订阅暂无法使用 Gemini 4 系列模型，升级至 Google AI Pro 或 Ultra 后可用。',
      };
    }

    if (tierInfo.effectiveKind === 'pro') {
      if (isCarbon || rawDisabled) {
        return {
          available: false,
          tierLocked: true,
          requiredTier: 'Ultra',
          reason: isCarbon
            ? (serverReason || 'Google AI Pro 订阅暂不支持 Gemini 4 Carbon，仅限 Ultra 订阅用户使用。')
            : (serverReason || '当前订阅档位暂不可用此模型。'),
        };
      }
    }

    if (tierInfo.effectiveKind === 'ultra') {
      // Ultra has zero tier restrictions; if simulating Ultra on a Pro account whose backend returned disabled:true,
      // unlock UI interaction visually and flag preview-only notice on click.
      return {
        available: true,
        tierLocked: false,
        backendDisabledOnly: rawDisabled && tierInfo.isSimulated,
        requiredTier: null,
        reason: rawDisabled && tierInfo.isSimulated
          ? 'Ultra 预览已解锁（注：当前登录账户后端为 Pro，真实切换 Carbon 需 Ultra 账户）'
          : '',
      };
    }

    if (rawDisabled) {
      return {
        available: false,
        tierLocked: true,
        requiredTier: 'Ultra',
        reason: serverReason || '当前不可用',
      };
    }

    return { available: true, tierLocked: false, backendDisabledOnly: false, requiredTier: null, reason: '' };
  }

  function buildPeriodicState(ctx) {
    const tierInfo = detectTier(ctx);
    const allSortOpts = ctx?.modelSorts?.[0]?.groups?.[0]?.options || ctx?.modelOptions || [];
    const defaultReps = ctx?.groups?.[0]?.options || [];

    const defaultByFamily = new Map();
    for (const rep of defaultReps) {
      const fam = stripEffortSuffix(rep.label);
      if (!defaultByFamily.has(fam)) defaultByFamily.set(fam, rep);
    }

    const families = new Map();
    for (const opt of allSortOpts) {
      const fam = stripEffortSuffix(opt.label);
      const el = resolveElementFromFamily(fam, opt);
      if (!el) continue;
      if (!families.has(el.num)) {
        families.set(el.num, {
          element: el,
          familyName: fam,
          sampleOpt: opt,
          variants: [],
          defaultOpt: defaultByFamily.get(fam) || null,
        });
      }
      const entry = families.get(el.num);
      const duplicate = entry.variants.some((v) => v.label === opt.label && v.modelId === opt.modelId);
      if (!duplicate) entry.variants.push(opt);
    }

    const matchedByNum = new Map();
    const matchedFamilyNames = new Set();
    const matchedTelemetry = [];

    for (const [num, entry] of families.entries()) {
      // Pick best default option: ctx.groups representative -> Medium -> High -> first enabled -> first
      if (!entry.defaultOpt || !entry.variants.some((v) => v.modelId === entry.defaultOpt.modelId)) {
        entry.defaultOpt =
          entry.variants.find((v) => !v.disabled && /\bmedium\b/i.test(v.label)) ||
          entry.variants.find((v) => !v.disabled && /\bhigh\b/i.test(v.label)) ||
          entry.variants.find((v) => !v.disabled) ||
          entry.variants[0];
      }

      const effortOrder = { Low: 1, Medium: 2, High: 3, XHigh: 4, Minimal: 0, Default: 5 };
      entry.variants.sort(
        (a, b) =>
          (effortOrder[extractEffortName(a.label, a.modelId)] ?? 9) -
          (effortOrder[extractEffortName(b.label, b.modelId)] ?? 9)
      );

      const avail = evaluateAvailability(entry, tierInfo);
      const isSelected = entry.variants.some(
        (v) =>
          (ctx?.selectedModel?.modelId && v.modelId === ctx.selectedModel.modelId) ||
          (ctx?.selectedModel?.label && v.label === ctx.selectedModel.label)
      );

      const qi = entry.defaultOpt?.quotaInfo || entry.sampleOpt?.quotaInfo;
      let pct = null;
      let resetMs = NaN;
      if (qi) {
        const rs = qi.resetTime?.seconds ? Number(qi.resetTime.seconds) * 1000 : NaN;
        if (Number.isFinite(rs) && rs > 0) resetMs = rs;
        if (typeof qi.remainingFraction === 'number') {
          pct = Math.max(0, Math.min(100, Math.round(qi.remainingFraction * 100)));
        } else if (Number.isFinite(rs) && rs > Date.now()) {
          pct = 0;
        }
      }

      // Cross-check with Quota Bar's captured RetrieveUserQuotaSummary in case modelOptions is stale in the same reset window
      try {
        const sumPools = window.__AGY_QUOTA_BAR?.getSummary?.()?.pools;
        const poolKey = el.symbol === 'Ar' ? 'argon' : 'gemini';
        const sbGroup = sumPools?.[poolKey];
        const sb = poolKey === 'argon'
          ? sbGroup?.weekly
          : (Number.isFinite(resetMs) && resetMs - Date.now() > 5.5 * 3_600_000 ? sbGroup?.weekly : sbGroup?.fiveHour);
        if (sb && Number.isFinite(sb.resetMs)) {
          const sbActive = sb.resetMs > Date.now();
          const optActive = Number.isFinite(resetMs) && resetMs > Date.now();
          const sbPct = sbActive ? sb.pct : 100;
          if (pct === null || (!optActive && sbActive) || sb.resetMs - (resetMs || 0) > 120_000) {
            pct = sbPct;
          } else if (Math.abs(sb.resetMs - resetMs) <= 120_000) {
            pct = Math.min(pct, sbPct);
          }
        }
      } catch {}

      const record = {
        ...entry,
        ...avail,
        pct,
        isSelected,
        accent: accentForElement(entry.element),
      };
      matchedByNum.set(num, record);
      matchedFamilyNames.add(entry.familyName.toLowerCase());
      matchedTelemetry.push({
        num: entry.element.num,
        symbol: entry.element.symbol,
        zh: entry.element.zh,
        family: entry.familyName,
        variants: entry.variants.length,
        available: avail.available,
        reason: avail.reason,
      });
    }

    lastTelemetry = {
      detectedTierName: tierInfo.detectedName,
      detectedTierKind: tierInfo.detectedKind,
      effectiveTierKind: tierInfo.effectiveKind,
      matchedElements: matchedTelemetry.sort((a, b) => a.num - b.num),
      selectedLabel: ctx?.selectedModel?.label || '',
    };

    return { tierInfo, matchedByNum, matchedFamilyNames };
  }

  // Particle dissolve + text formation animation overlay
  function getTriggerTextElement() {
    const trig = document.querySelector('[data-testid="model-selector-trigger"]');
    if (!trig) return { trig: null, span: null };
    const span = trig.querySelector('span') || trig;
    return { trig, span };
  }

  function runMorphAnimation(sourceRect, accent, elementMeta, targetOption, ctx) {
    // Cleanup any prior interrupted FX
    const oldFx = document.getElementById(FX_HOST_ID);
    if (oldFx) oldFx.remove();

    const fxHost = document.createElement('div');
    fxHost.id = FX_HOST_ID;
    fxHost.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:2147483647;overflow:hidden;';

    const canvas = document.createElement('canvas');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    fxHost.appendChild(canvas);

    // Floating cloned element card that lingers while the menu closes cleanly
    const lingerCard = document.createElement('div');
    lingerCard.style.cssText = `
      position:fixed;
      left:${sourceRect.left}px;
      top:${sourceRect.top}px;
      width:${sourceRect.width}px;
      height:${sourceRect.height}px;
      border-radius:8px;
      border:1.5px solid ${accent.hex};
      background:linear-gradient(155deg, ${accent.solidHover}, ${accent.solidBg});
      box-shadow:0 0 24px rgba(${accent.rgb},0.5), inset 0 1px 0 rgba(255,255,255,0.22);
      color:#F8FAFC;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      font-family:"Google Sans Flex", system-ui, "Microsoft YaHei", sans-serif;
      transform:scale(1.18);
      transition:transform 200ms cubic-bezier(0.22,1,0.36,1), opacity 130ms ease;
    `;
    lingerCard.innerHTML = `
      <span style="position:absolute;top:2px;left:4px;font-size:8.5px;opacity:.85;font-weight:600;">${elementMeta.num}</span>
      <span style="font-size:15px;font-weight:800;line-height:1.05;color:${accent.label};">${elementMeta.symbol}</span>
      <span style="font-size:9px;opacity:.92;margin-top:1px;">${elementMeta.zh}</span>
    `;
    fxHost.appendChild(lingerCard);
    document.body.appendChild(fxHost);

    let restored = false;
    const restoreTrigger = () => {
      if (restored) return;
      restored = true;
      const { span } = getTriggerTextElement();
      if (span) {
        span.style.transition = 'opacity 140ms ease, filter 220ms ease';
        span.style.opacity = '1';
        span.style.filter = `drop-shadow(0 0 8px rgba(${accent.rgb},0.55))`;
        setTimeout(() => {
          try {
            span.style.filter = '';
            span.style.transition = '';
          } catch {}
        }, 280);
      }
      setTimeout(() => {
        try { fxHost.remove(); } catch {}
      }, 240);
    };

    // Fail-safe so the trigger label is never stuck invisible
    const failSafeTimer = setTimeout(restoreTrigger, 1800);

    // Phase 1 (~25ms): Switch model & close native selector while lingerCard stays hovering in place
    setTimeout(() => {
      const { span } = getTriggerTextElement();
      if (span) {
        span.style.transition = 'none';
        span.style.opacity = '0';
      }
      try {
        ctx.setSelectedModel(targetOption);
      } catch {}
    }, 24);

    // Phase 2 (~220ms): Menu has retracted; dissolve lingering element card into glowing particles toward the trigger text
    setTimeout(() => {
      const { trig, span } = getTriggerTextElement();
      const targetEl = span || trig;
      if (!targetEl) {
        clearTimeout(failSafeTimer);
        restoreTrigger();
        return;
      }

      const tr = targetEl.getBoundingClientRect();
      const cs = getComputedStyle(targetEl);
      const fontSpec = `${cs.fontWeight || '500'} ${cs.fontSize || '14px'} ${cs.fontFamily || 'system-ui, sans-serif'}`;
      const newText = (targetEl.textContent || targetOption.label || '').trim();

      // Sample glyph pixels from offscreen canvas matching exact trigger position & font
      const off = document.createElement('canvas');
      const pad = 6;
      const ow = Math.max(40, Math.ceil(tr.width + pad * 2));
      const oh = Math.max(20, Math.ceil(tr.height + pad * 2));
      off.width = ow;
      off.height = oh;
      const octx = off.getContext('2d');
      octx.clearRect(0, 0, ow, oh);
      octx.font = fontSpec;
      octx.textBaseline = 'middle';
      octx.textAlign = 'left';
      octx.fillStyle = '#FFFFFF';
      octx.fillText(newText, pad, oh / 2 + 0.5);

      const img = octx.getImageData(0, 0, ow, oh).data;
      const targets = [];
      for (let py = 0; py < oh; py++) {
        for (let px = 0; px < ow; px++) {
          const alpha = img[(py * ow + px) * 4 + 3];
          if (alpha > 85) {
            targets.push({
              x: tr.left - pad + px,
              y: tr.top - pad + py,
              a: alpha / 255,
            });
          }
        }
      }

      const maxParticles = Math.round(620 * (runtimeConfig?.particleScale || 1));
      const chosenTargets = [];
      if (targets.length === 0) {
        for (let i = 0; i < 240; i++) {
          chosenTargets.push({
            x: tr.left + (i / 240) * tr.width,
            y: tr.top + tr.height / 2 + (Math.random() - 0.5) * 4,
            a: 1,
          });
        }
      } else {
        const step = Math.max(1, targets.length / maxParticles);
        for (let f = 0; f < targets.length; f += step) {
          chosenTargets.push(targets[Math.floor(f)]);
        }
      }

      // Fade out DOM linger card just as Canvas particles burst from its exact bounds
      lingerCard.style.opacity = '0';
      lingerCard.style.transform = 'scale(1.32)';

      const cardCenterX = sourceRect.left + sourceRect.width / 2;
      const cardCenterY = sourceRect.top + sourceRect.height / 2;
      const particles = chosenTargets.map((dst, idx) => {
        // Seed particles across card surface & glowing perimeter
        const edgeBias = idx % 3 === 0;
        let sx, sy;
        if (edgeBias) {
          const side = idx % 4;
          const t = Math.random();
          sx = side === 0 ? sourceRect.left + t * sourceRect.width
             : side === 1 ? sourceRect.right
             : side === 2 ? sourceRect.left + t * sourceRect.width
             : sourceRect.left;
          sy = side === 0 ? sourceRect.top
             : side === 1 ? sourceRect.top + t * sourceRect.height
             : side === 2 ? sourceRect.bottom
             : sourceRect.top + t * sourceRect.height;
        } else {
          sx = sourceRect.left + 4 + Math.random() * Math.max(4, sourceRect.width - 8);
          sy = sourceRect.top + 4 + Math.random() * Math.max(4, sourceRect.height - 8);
        }
        const angle = Math.atan2(sy - cardCenterY, sx - cardCenterX) + (Math.random() - 0.5) * 0.9;
        const speed = 26 + Math.random() * 68;
        const midX = (sx + dst.x) / 2 + (Math.random() - 0.5) * 90;
        const midY = Math.min(sy, dst.y) - 25 - Math.random() * 60;
        return {
          sx,
          sy,
          bx: sx + Math.cos(angle) * speed,
          by: sy + Math.sin(angle) * speed,
          cx: midX,
          cy: midY,
          dx: dst.x,
          dy: dst.y,
          size: 1.35 + Math.random() * 1.45,
          delay: (idx % 12) * 0.012,
          bright: Math.random() > 0.35,
          a: dst.a,
        };
      });

      const c2d = canvas.getContext('2d');
      c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const startTs = performance.now();
      const burstDur = 190; // outward dissolve
      const flyDur = 640;   // curve into text glyphs
      const settleDur = 140;
      const totalDur = burstDur + flyDur + settleDur;

      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

      function frame(now) {
        const elapsed = now - startTs;
        c2d.clearRect(0, 0, vw, vh);

        // Reveal crisp text seamlessly as particles settle
        if (elapsed >= burstDur + flyDur - 40) {
          const settleP = Math.min(1, (elapsed - (burstDur + flyDur - 40)) / (settleDur + 40));
          const { span: curSpan } = getTriggerTextElement();
          if (curSpan && !restored) {
            curSpan.style.opacity = String(settleP.toFixed(3));
          }
        }

        for (const p of particles) {
          let x, y, alpha, r;
          if (elapsed < burstDur) {
            const u = easeOut(Math.min(1, elapsed / burstDur));
            x = p.sx + (p.bx - p.sx) * u;
            y = p.sy + (p.by - p.sy) * u;
            alpha = 0.95;
            r = p.size;
          } else {
            const flyT = Math.max(0, Math.min(1, (elapsed - burstDur - p.delay * 500) / flyDur));
            const u = easeInOut(flyT);
            const omt = 1 - u;
            // Quadratic Bezier from burst coordinate to target glyph pixel
            x = omt * omt * p.bx + 2 * omt * u * p.cx + u * u * p.dx;
            y = omt * omt * p.by + 2 * omt * u * p.cy + u * u * p.dy;
            const settleFade = elapsed > burstDur + flyDur
              ? Math.max(0, 1 - (elapsed - burstDur - flyDur) / settleDur)
              : 1;
            alpha = (0.78 + 0.22 * p.a) * settleFade;
            r = p.size * (1 - 0.35 * u);
          }

          if (alpha <= 0.01) continue;
          c2d.fillStyle = p.bright
            ? `rgba(${accent.rgb}, ${alpha})`
            : `rgba(234, 235, 241, ${alpha})`;
          c2d.beginPath();
          c2d.arc(x, y, r, 0, Math.PI * 2);
          c2d.fill();
        }

        if (elapsed < totalDur) {
          requestAnimationFrame(frame);
        } else {
          clearTimeout(failSafeTimer);
          restoreTrigger();
        }
      }
      requestAnimationFrame(frame);
    }, 210);
  }

  const PTABLE_CSS = `
    :host {
      all: initial;
      display: block;
      width: 100%;
      box-sizing: border-box;
      font-family: "Google Sans Flex", "Google Sans", system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
    }
    * { box-sizing: border-box; }
    .pt-wrap {
      padding: 6px 8px 8px;
      position: relative;
      color: #EAEBF1;
      user-select: none;
    }
    .pt-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 11px;
      color: #9CA0AC;
    }
    .pt-title-group {
      display: flex;
      align-items: center;
      gap: 7px;
      min-width: 0;
    }
    .pt-badge {
      padding: 1px 6px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 600;
      background: rgba(47, 113, 227, 0.16);
      color: #84B2FF;
      white-space: nowrap;
    }
    .pt-badge.free { background: rgba(148, 163, 184, 0.16); color: #CBD5E1; }
    .pt-badge.ultra { background: rgba(168, 85, 247, 0.22); color: #E9D5FF; }
    .pt-topbar-right {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .pt-legend {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10.5px;
      color: #8E909A;
      white-space: nowrap;
    }
    .pt-upd-btn {
      display: none;
      align-items: center;
      gap: 5px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid rgba(56, 189, 248, 0.58);
      background: rgba(56, 189, 248, 0.16);
      color: #BAE6FD;
      font-family: inherit;
      font-size: 10.5px;
      font-weight: 600;
      line-height: 1.35;
      cursor: pointer;
      white-space: nowrap;
      transition: background-color 140ms ease, border-color 140ms ease, transform 120ms ease, box-shadow 140ms ease;
    }
    .pt-upd-btn.visible {
      display: inline-flex;
    }
    .pt-upd-btn:hover {
      background: rgba(56, 189, 248, 0.26);
      border-color: rgba(125, 211, 252, 0.9);
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.28);
      transform: translateY(-0.5px);
    }
    .pt-upd-btn.updating {
      border-color: rgba(249, 115, 22, 0.65);
      background: rgba(249, 115, 22, 0.18);
      color: #FED7AA;
    }
    .pt-upd-btn.updated {
      border-color: rgba(16, 185, 129, 0.65);
      background: rgba(16, 185, 129, 0.18);
      color: #A7F3D0;
    }
    .pt-upd-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38BDF8;
      box-shadow: 0 0 8px #38BDF8;
      animation: pt-upd-pulse 1.8s ease-in-out infinite;
    }
    @keyframes pt-upd-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.75); }
    }
    .pt-upd-spin {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1.5px solid rgba(254, 215, 170, 0.35);
      border-top-color: #FB923C;
      animation: pt-upd-rot 700ms linear infinite;
    }
    @keyframes pt-upd-rot {
      to { transform: rotate(360deg); }
    }
    .pt-upd-pop {
      position: absolute;
      top: 30px;
      right: 8px;
      z-index: 80;
      width: 296px;
      background: #17181E;
      border: 1px solid rgba(56, 189, 248, 0.52);
      border-radius: 12px;
      padding: 12px;
      color: #EAEBF1;
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.82), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
      display: none;
      flex-direction: column;
      gap: 9px;
      animation: pt-upd-in 150ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes pt-upd-in {
      from { opacity: 0; transform: translateY(-4px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .pt-upd-pop.open { display: flex; }
    .pt-upd-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .pt-upd-title {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 700;
      color: #F4F6FA;
    }
    .pt-upd-tag {
      padding: 1px 6px;
      border-radius: 5px;
      font-size: 10.5px;
      font-weight: 700;
      background: rgba(56, 189, 248, 0.20);
      border: 1px solid rgba(56, 189, 248, 0.45);
      color: #BAE6FD;
    }
    .pt-upd-tag.ok {
      background: rgba(16, 185, 129, 0.20);
      border-color: rgba(16, 185, 129, 0.48);
      color: #A7F3D0;
    }
    .pt-upd-close {
      background: transparent;
      border: none;
      color: #8E909A;
      font-size: 14px;
      line-height: 1;
      padding: 2px 5px;
      border-radius: 5px;
      cursor: pointer;
    }
    .pt-upd-close:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #EAEBF1;
    }
    .pt-upd-ver {
      font-size: 11px;
      color: #9CA0AC;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .pt-upd-notes {
      background: #111217;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 8px 9px;
      font-size: 11px;
      line-height: 1.48;
      color: #C7CAD4;
      white-space: pre-wrap;
      max-height: 118px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
    }
    .pt-upd-notes::-webkit-scrollbar { width: 5px; }
    .pt-upd-notes::-webkit-scrollbar-track { background: transparent; }
    .pt-upd-notes::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.18); border-radius: 99px; }
    .pt-upd-notes::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.30); }
    .pt-upd-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(249, 115, 22, 0.14);
      border: 1px solid rgba(249, 115, 22, 0.42);
      color: #FED7AA;
      font-size: 11.5px;
      line-height: 1.4;
    }
    .pt-upd-progress.ok {
      background: rgba(16, 185, 129, 0.15);
      border-color: rgba(16, 185, 129, 0.45);
      color: #A7F3D0;
    }
    .pt-upd-err {
      padding: 7px 9px;
      border-radius: 8px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.42);
      color: #FECACA;
      font-size: 11px;
      line-height: 1.4;
    }
    .pt-upd-spinner {
      width: 12px;
      height: 12px;
      flex: 0 0 12px;
      border-radius: 50%;
      border: 2px solid rgba(254, 215, 170, 0.3);
      border-top-color: #FB923C;
      animation: pt-upd-rot 700ms linear infinite;
    }
    .pt-upd-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 7px;
      margin-top: 2px;
    }
    .pt-upd-act {
      border-radius: 7px;
      padding: 6px 11px;
      font-size: 11.5px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.11);
      background: rgba(255, 255, 255, 0.05);
      color: #D2D5DF;
      transition: background-color 130ms ease, border-color 130ms ease, transform 100ms ease;
    }
    .pt-upd-act:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.11);
      color: #FFFFFF;
    }
    .pt-upd-act.primary {
      background: linear-gradient(135deg, #2563EB, #0284C7);
      border-color: rgba(125, 211, 252, 0.65);
      color: #FFFFFF;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    }
    .pt-upd-act.primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #3B82F6, #0EA5E9);
    }
    .pt-upd-act:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .pt-grid {
      display: grid;
      grid-template-columns: repeat(18, 35px);
      grid-template-rows: repeat(7, 35px) 4px repeat(2, 33px);
      gap: 3px;
      position: relative;
      width: max-content;
    }
    .pt-cell {
      position: relative;
      border-radius: 5px;
      background: #1D1E25;
      border: 1px solid #2D2F3A;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2px 1px;
      color: #8C91A0;
      cursor: default;
      transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 160ms ease, border-color 140ms ease, background-color 140ms ease;
    }
    .pt-cell.inert:hover {
      background: #262832;
      border-color: #3B3E4C;
      color: #C2C6D2;
    }
    .pt-num {
      position: absolute;
      top: 1.5px;
      left: 3px;
      font-size: 7.5px;
      line-height: 1;
      opacity: 0.8;
      font-variant-numeric: tabular-nums;
    }
    .pt-sym {
      font-size: 12.5px;
      font-weight: 700;
      line-height: 1.06;
      letter-spacing: -0.02em;
      margin-top: 3px;
    }
    .pt-zh {
      font-size: 8.5px;
      line-height: 1.05;
      opacity: 0.85;
      white-space: nowrap;
    }
    .pt-series-marker {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 5px;
      background: #181920;
      border: 1px dashed #2E303B;
      font-size: 8px;
      color: #7D818E;
      letter-spacing: -0.03em;
    }
    .pt-cell.active {
      cursor: pointer;
      color: #F4F6FA;
      background: var(--el-solid-bg);
      border-color: rgba(var(--el-rgb), 0.72);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 10px rgba(var(--el-rgb), 0.18);
      z-index: 2;
    }
    .pt-cell.active .pt-num { opacity: 0.92; color: var(--el-label); }
    .pt-cell.active .pt-sym { color: #FFFFFF; font-size: 12.5px; }
    .pt-cell.active .pt-zh { opacity: 0.96; color: var(--el-label); font-weight: 600; }
    .pt-cell.active.locked {
      cursor: not-allowed;
      background: var(--el-solid-locked);
      border-color: rgba(var(--el-rgb), 0.45);
      border-style: dashed;
      filter: saturate(0.78);
    }
    .pt-cell.active.selected::after {
      content: '';
      position: absolute;
      top: 3px;
      right: 3px;
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #FFFFFF;
      box-shadow: 0 0 6px #FFFFFF;
    }
    .pt-cell.active.locked::after {
      content: '🔒';
      position: absolute;
      top: 1px;
      right: 2px;
      font-size: 7.5px;
      line-height: 1;
      opacity: 0.9;
    }
    .pt-cell.active:hover, .pt-cell.active.hover-open {
      transform: scale(1.28) translateY(-2px);
      z-index: 30;
      background: var(--el-solid-hover);
      border-color: rgba(var(--el-rgb), 0.98);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.65), 0 0 16px rgba(var(--el-rgb), 0.48);
    }
    .pt-cell.shake {
      animation: pt-shake 340ms ease;
    }
    @keyframes pt-shake {
      0%, 100% { transform: scale(1.2) translateX(0); }
      25% { transform: scale(1.2) translateX(-4px); }
      55% { transform: scale(1.2) translateX(4px); }
      80% { transform: scale(1.2) translateX(-2px); }
    }
    .pt-sub {
      position: fixed;
      z-index: 2147483640;
      width: 224px;
      background: rgba(22, 22, 27, 0.97);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      padding: 9px;
      color: #EAEBF1;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.65);
      display: none;
      flex-direction: column;
      gap: 6px;
      animation: pt-pop 120ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes pt-pop {
      from { opacity: 0; transform: translateY(3px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .pt-sub.open { display: flex; }
    .pt-sub-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .pt-sub-el {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 12.5px;
    }
    .pt-sub-chip {
      padding: 2px 6px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(var(--el-rgb), 0.22);
      color: var(--el-label);
      border: 1px solid rgba(var(--el-rgb), 0.55);
    }
    .pt-sub-quota {
      font-size: 10.5px;
      color: #9CA0AC;
      font-variant-numeric: tabular-nums;
    }
    .pt-sub-desc {
      font-size: 10.5px;
      line-height: 1.38;
      color: #9CA0AC;
    }
    .pt-efforts {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .pt-eff-btn {
      width: 100%;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 6px;
      color: #EAEBF1;
      padding: 5px 8px;
      font-size: 11.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      font-family: inherit;
      transition: background-color 120ms ease, border-color 120ms ease;
    }
    .pt-eff-btn:hover:not(:disabled) {
      background: rgba(var(--el-rgb), 0.20);
      border-color: rgba(var(--el-rgb), 0.65);
    }
    .pt-eff-btn.selected {
      background: rgba(var(--el-rgb), 0.24);
      border-color: rgba(var(--el-rgb), 0.85);
      font-weight: 600;
    }
    .pt-eff-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .pt-eff-tags {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      color: #9CA0AC;
    }
    .pt-lock-box {
      padding: 7px 8px;
      border-radius: 7px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.32);
      color: #FDE68A;
      font-size: 11px;
      line-height: 1.4;
    }
    .pt-toast {
      margin-top: 6px;
      padding: 6px 9px;
      border-radius: 7px;
      background: rgba(239, 68, 68, 0.16);
      border: 1px solid rgba(239, 68, 68, 0.42);
      color: #FECACA;
      font-size: 11px;
      display: none;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .pt-toast.open { display: flex; }
  `;

  const SUB_CSS = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483645;
      pointer-events: none;
      inset: 0;
      font-family: "Google Sans Flex", "Google Sans", system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
    }
    * { box-sizing: border-box; }
    .pt-sub {
      position: fixed;
      pointer-events: auto;
      width: 232px;
      background: #17181E;
      border: 1px solid rgba(var(--el-rgb, 255, 255, 255), 0.52);
      border-radius: 10px;
      padding: 10px;
      color: #EAEBF1;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.72);
      display: none;
      flex-direction: column;
      gap: 7px;
      animation: pt-sub-zoom 155ms cubic-bezier(0.22, 1, 0.36, 1);
    }
    @keyframes pt-sub-zoom {
      from { opacity: 0; transform: scale(0.86); }
      to { opacity: 1; transform: scale(1); }
    }
    .pt-sub.open { display: flex; }
    .pt-sub-hdr {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .pt-sub-el {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 12.5px;
    }
    .pt-sub-chip {
      padding: 2px 6px;
      border-radius: 5px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(var(--el-rgb), 0.22);
      color: var(--el-label);
      border: 1px solid rgba(var(--el-rgb), 0.55);
    }
    .pt-sub-quota {
      font-size: 10.5px;
      color: #9CA0AC;
      font-variant-numeric: tabular-nums;
    }
    .pt-sub-desc {
      font-size: 10.5px;
      line-height: 1.38;
      color: #9CA0AC;
    }
    .pt-efforts {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .pt-eff-btn {
      width: 100%;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      color: #EAEBF1;
      padding: 5px 8px;
      font-size: 11.5px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      font-family: inherit;
      transition: background-color 120ms ease, border-color 120ms ease;
    }
    .pt-eff-btn:hover:not(:disabled) {
      background: rgba(var(--el-rgb), 0.22);
      border-color: rgba(var(--el-rgb), 0.72);
    }
    .pt-eff-btn.selected {
      background: rgba(var(--el-rgb), 0.24);
      border-color: rgba(var(--el-rgb), 0.88);
      font-weight: 600;
    }
    .pt-eff-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .pt-eff-tags {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      color: #9CA0AC;
    }
    .pt-lock-box {
      padding: 7px 8px;
      border-radius: 7px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.32);
      color: #FDE68A;
      font-size: 11px;
      line-height: 1.4;
    }
  `;

  function getSubPortal() {
    let subHost = document.getElementById(SUB_HOST_ID);
    if (!subHost) {
      subHost = document.createElement('div');
      subHost.id = SUB_HOST_ID;
      document.body.appendChild(subHost);
    }
    const ssr = subHost.shadowRoot || subHost.attachShadow({ mode: 'open' });
    let subPopover = ssr.querySelector('.pt-sub');
    if (!subPopover || ssr.querySelector('.pt-mitosis-svg')) {
      ssr.innerHTML = '';
      const st = document.createElement('style');
      st.textContent = SUB_CSS;
      ssr.appendChild(st);
      subPopover = document.createElement('div');
      subPopover.className = 'pt-sub';
      ssr.appendChild(subPopover);
    }
    return { subHost, subPopover };
  }

  function hideSubPortal() {
    const subHost = document.getElementById(SUB_HOST_ID);
    const subPopover = subHost?.shadowRoot?.querySelector('.pt-sub');
    if (subPopover) {
      subPopover.classList.remove('open');
      subPopover.dataset.activeElNum = '';
    }
  }

  function isUpdatePopoverOpen() {
    return !!(activeUpdPop && activeUpdPop.isConnected && activeUpdPop.classList.contains('open'));
  }

  function hideUpdatePortal() {
    if (activeUpdPop) activeUpdPop.classList.remove('open');
  }

  function renderUpdatePopover(pop) {
    if (!pop) return;
    const u = updateInfo || {};
    const isUpdating = u.status === 'updating';
    const isUpdated = u.status === 'updated' || (!!u.justUpdatedTo && !u.hasUpdate);
    const isError = u.status === 'error';

    pop.innerHTML = '';

    const hdr = document.createElement('div');
    hdr.className = 'pt-upd-hdr';
    const title = document.createElement('div');
    title.className = 'pt-upd-title';
    const tagCls = isUpdated ? 'pt-upd-tag ok' : 'pt-upd-tag';
    const tagTxt = isUpdated
      ? `v${u.currentVersion || u.justUpdatedTo}`
      : `v${u.latestVersion || ''}`;
    title.innerHTML = `<span>${isUpdated ? '插件更新完成' : '发现新版本'}</span><span class="${tagCls}">${tagTxt}</span>`;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pt-upd-close';
    closeBtn.textContent = '×';
    closeBtn.title = '关闭';
    closeBtn.onclick = (ev) => {
      ev.stopPropagation();
      hideUpdatePortal();
    };
    hdr.appendChild(title);
    hdr.appendChild(closeBtn);
    pop.appendChild(hdr);

    const verRow = document.createElement('div');
    verRow.className = 'pt-upd-ver';
    verRow.innerHTML = isUpdated
      ? `<span>已从 v${u.justUpdatedFrom || '?'} 升级至 v${u.currentVersion || u.justUpdatedTo}</span><span>GitHub</span>`
      : `<span>当前 v${u.currentVersion || '1.0.0'} → 最新 v${u.latestVersion || '?'}</span><span>GitHub</span>`;
    pop.appendChild(verRow);

    if (isUpdating) {
      const prog = document.createElement('div');
      prog.className = 'pt-upd-progress';
      prog.innerHTML = `<span class="pt-upd-spinner"></span><span>${u.progressText || '正在下载并应用更新...'}</span>`;
      pop.appendChild(prog);
    } else if (isUpdated) {
      const okBox = document.createElement('div');
      okBox.className = 'pt-upd-progress ok';
      okBox.textContent = u.progressText || `✓ 已更新至 v${u.currentVersion || u.justUpdatedTo}，新版本已就绪`;
      pop.appendChild(okBox);
    } else {
      if (u.releaseNotes) {
        const notes = document.createElement('div');
        notes.className = 'pt-upd-notes';
        notes.textContent = u.releaseNotes;
        pop.appendChild(notes);
      }
      if (isError && u.error) {
        const errBox = document.createElement('div');
        errBox.className = 'pt-upd-err';
        errBox.textContent = `更新失败：${u.error}`;
        pop.appendChild(errBox);
      }
    }

    const actions = document.createElement('div');
    actions.className = 'pt-upd-actions';

    if (isUpdated) {
      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = 'pt-upd-act primary';
      doneBtn.textContent = '知道了';
      doneBtn.onclick = (ev) => {
        ev.stopPropagation();
        hideUpdatePortal();
      };
      actions.appendChild(doneBtn);
    } else {
      const laterBtn = document.createElement('button');
      laterBtn.type = 'button';
      laterBtn.className = 'pt-upd-act';
      laterBtn.textContent = '后续再更新';
      laterBtn.disabled = isUpdating;
      laterBtn.onclick = (ev) => {
        ev.stopPropagation();
        pendingUpdateAction = 'defer';
        if (updateInfo) updateInfo = { ...updateInfo, deferred: true };
        hideUpdatePortal();
        syncUpdateUi();
      };

      const nowBtn = document.createElement('button');
      nowBtn.type = 'button';
      nowBtn.className = 'pt-upd-act primary';
      nowBtn.textContent = isUpdating ? '更新中...' : (isError ? '重试更新' : '直接更新');
      nowBtn.disabled = isUpdating;
      nowBtn.onclick = (ev) => {
        ev.stopPropagation();
        pendingUpdateAction = 'apply';
        updateInfo = {
          ...(updateInfo || {}),
          status: 'updating',
          error: null,
          progressText: '正在启动更新任务...',
        };
        syncUpdateUi();
      };

      actions.appendChild(laterBtn);
      actions.appendChild(nowBtn);
    }
    pop.appendChild(actions);
  }

  function openUpdatePopover() {
    hideSubPortal();
    if (!activeUpdPop || !activeUpdPop.isConnected) return;
    renderUpdatePopover(activeUpdPop);
    activeUpdPop.classList.remove('open');
    void activeUpdPop.offsetWidth;
    activeUpdPop.classList.add('open');
  }

  function syncUpdateUi() {
    const u = updateInfo || {};
    const btn = activeUpdBtn;
    if (btn && btn.isConnected) {
      const isUpdating = u.status === 'updating';
      const isUpdated = u.status === 'updated' || (!!u.justUpdatedTo && !u.hasUpdate);
      const showAvailable = !!u.hasUpdate && !u.deferred;

      btn.classList.remove('visible', 'updating', 'updated');
      if (isUpdating) {
        btn.classList.add('visible', 'updating');
        btn.innerHTML = `<span class="pt-upd-spin"></span><span>更新中...</span>`;
        btn.title = u.progressText || '正在下载并应用新版本';
      } else if (isUpdated) {
        btn.classList.add('visible', 'updated');
        btn.innerHTML = `<span>✓ 已更新 v${u.currentVersion || u.justUpdatedTo}</span>`;
        btn.title = '插件已更新至最新版本';
      } else if (showAvailable) {
        btn.classList.add('visible');
        btn.innerHTML = `<span class="pt-upd-dot"></span><span>新版本 v${u.latestVersion}</span>`;
        btn.title = `发现新版本 v${u.latestVersion}，点击选择直接更新或后续再更新`;
      }
    }

    if (isUpdatePopoverOpen()) {
      if (!u.hasUpdate && u.status !== 'updating' && u.status !== 'updated' && !u.justUpdatedTo) {
        hideUpdatePortal();
      } else {
        renderUpdatePopover(activeUpdPop);
      }
    }
  }

  function clampMenuPosition(menuEl) {
    try {
      const positioner = menuEl?.parentElement;
      const trig = document.querySelector('[data-testid="model-selector-trigger"]');
      if (!positioner || !trig || !menuEl.isConnected) return;
      const mr = menuEl.getBoundingClientRect();
      const tr = trig.getBoundingClientRect();
      if (!mr.width || !mr.height) return;
      const left = Math.max(10, Math.min(window.innerWidth - mr.width - 10, tr.left));
      const top = Math.max(8, tr.top - mr.height - 8);
      const next = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      if (positioner.style.transform !== next) {
        positioner.style.transform = next;
      }
    } catch {}
  }

  function buildPeriodicUi(panelEl, menuEl, ctx) {
    ensureMenuOverrideCss();
    menuEl.classList.add('agy-ptable-expanded');

    const { tierInfo, matchedByNum, matchedFamilyNames } = buildPeriodicState(ctx);

    // Watch positioner transform changes so widened menu always sits cleanly above chat trigger bar
    const positioner = menuEl.parentElement;
    if (positioner && positioner.dataset.agyPosGuard !== '1') {
      positioner.dataset.agyPosGuard = '1';
      let guarding = false;
      const posObs = new MutationObserver(() => {
        if (guarding || !menuEl.isConnected) {
          if (!menuEl.isConnected) posObs.disconnect();
          return;
        }
        guarding = true;
        clampMenuPosition(menuEl);
        guarding = false;
      });
      posObs.observe(positioner, { attributes: true, attributeFilter: ['style'] });
    }
    requestAnimationFrame(() => clampMenuPosition(menuEl));
    setTimeout(() => clampMenuPosition(menuEl), 45);
    setTimeout(() => clampMenuPosition(menuEl), 120);

    // Hide ONLY the matched element rows from the lower native list so Orchestrator / Flash / Claude / GPT / Usage stay intact
    const menuItems = Array.from(panelEl.querySelectorAll('[role="menuitem"]'));
    let firstVisibleItem = null;
    for (const item of menuItems) {
      const txt = (item.textContent || '').trim().toLowerCase();
      let isMatchedElementRow = false;
      if (!/orchestrator|编排器|查看用量|usage/.test(txt)) {
        for (const famLower of matchedFamilyNames) {
          if (txt.startsWith(famLower)) {
            isMatchedElementRow = true;
            break;
          }
        }
      }
      item.classList.toggle('agy-ptable-hidden-row', isMatchedElementRow);
      if (!isMatchedElementRow && !firstVisibleItem) firstVisibleItem = item;
    }

    // Add subtle divider above remaining models if not already added
    let secLbl = panelEl.querySelector('.agy-ptable-section-label');
    if (!secLbl && firstVisibleItem && firstVisibleItem.parentElement) {
      secLbl = document.createElement('div');
      secLbl.className = 'agy-ptable-section-label';
      secLbl.innerHTML = '<span>其余模型（保持默认样式）</span>';
      firstVisibleItem.parentElement.insertBefore(secLbl, firstVisibleItem);
    }

    // Mount or reuse Shadow DOM Periodic Table slot right below header
    let host = panelEl.querySelector('#' + PTABLE_HOST_ID);
    if (!host) {
      host = document.createElement('div');
      host.id = PTABLE_HOST_ID;
      const hdr = panelEl.querySelector('[data-testid="model-selector-header"]');
      if (hdr && hdr.parentElement) {
        hdr.insertAdjacentElement('afterend', host);
      } else {
        panelEl.prepend(host);
      }
    }

    const sr = host.shadowRoot || host.attachShadow({ mode: 'open' });
    sr.innerHTML = '';
    const styleEl = document.createElement('style');
    styleEl.textContent = PTABLE_CSS;
    sr.appendChild(styleEl);

    const wrap = document.createElement('div');
    wrap.className = 'pt-wrap';

    // Header info bar
    const topbar = document.createElement('div');
    topbar.className = 'pt-topbar';
    const titleGroup = document.createElement('div');
    titleGroup.className = 'pt-title-group';
    const subBadge = document.createElement('span');
    subBadge.className = `pt-badge ${tierInfo.effectiveKind}`;
    subBadge.textContent =
      (tierInfo.effectiveKind === 'free' ? 'Free 免费版' : tierInfo.effectiveKind === 'ultra' ? 'Google AI Ultra' : 'Google AI Pro') +
      (tierInfo.isSimulated ? ' (模拟)' : '');
    const hint = document.createElement('span');
    hint.textContent = `已激活 ${matchedByNum.size} 个元素模型 · 悬停选思考强度 · 直击选默认`;
    titleGroup.appendChild(subBadge);
    titleGroup.appendChild(hint);

    const topbarRight = document.createElement('div');
    topbarRight.className = 'pt-topbar-right';

    const legend = document.createElement('div');
    legend.className = 'pt-legend';
    legend.textContent =
      tierInfo.effectiveKind === 'free'
        ? 'Free 订阅：4系禁用'
        : tierInfo.effectiveKind === 'pro'
        ? 'Pro 订阅：Carbon 需 Ultra'
        : 'Ultra 订阅：全系无限制';

    const updBtn = document.createElement('button');
    updBtn.type = 'button';
    updBtn.className = 'pt-upd-btn';
    updBtn.dataset.agyUpdTrigger = '1';
    for (const evt of ['pointerdown', 'mousedown', 'mouseup']) {
      updBtn.addEventListener(evt, (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      });
    }
    updBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      if (isUpdatePopoverOpen()) {
        hideUpdatePortal();
      } else {
        openUpdatePopover();
      }
    });
    activeUpdBtn = updBtn;

    const updPop = document.createElement('div');
    updPop.className = 'pt-upd-pop';
    for (const evt of ['pointerdown', 'mousedown', 'mouseup', 'click']) {
      updPop.addEventListener(evt, (ev) => ev.stopPropagation());
    }
    activeUpdPop = updPop;

    topbarRight.appendChild(legend);
    topbarRight.appendChild(updBtn);
    topbar.appendChild(titleGroup);
    topbar.appendChild(topbarRight);
    wrap.appendChild(topbar);
    wrap.appendChild(updPop);
    syncUpdateUi();

    // 18-col Periodic Table grid
    const grid = document.createElement('div');
    grid.className = 'pt-grid';

    // f-block series placeholders at Row 6 Col 3 (57-71) and Row 7 Col 3 (89-103)
    for (const [r, label] of [[6, '57-71'], [7, '89-103']]) {
      const m = document.createElement('div');
      m.className = 'pt-series-marker';
      m.style.gridRow = String(r);
      m.style.gridColumn = '3';
      m.textContent = label;
      grid.appendChild(m);
    }

    const { subPopover } = getSubPortal();
    let hideSubTimer = null;
    let currentHoverCell = null;

    const toast = document.createElement('div');
    toast.className = 'pt-toast';
    const showToast = (msg) => {
      toast.textContent = `⚠️ ${msg}`;
      toast.classList.add('open');
      if (activeToastTimer) clearTimeout(activeToastTimer);
      activeToastTimer = setTimeout(() => toast.classList.remove('open'), 3200);
    };

    const scheduleCloseSub = () => {
      if (hideSubTimer) clearTimeout(hideSubTimer);
      hideSubTimer = setTimeout(() => {
        subPopover.classList.remove('open');
        subPopover.dataset.activeElNum = '';
        if (currentHoverCell) {
          currentHoverCell.classList.remove('hover-open');
          currentHoverCell = null;
        }
      }, 170);
    };
    const cancelCloseSub = () => {
      if (hideSubTimer) {
        clearTimeout(hideSubTimer);
        hideSubTimer = null;
      }
    };
    subPopover.onmouseenter = cancelCloseSub;
    subPopover.onmouseleave = scheduleCloseSub;

    // Prevent Base UI menu item highlight / submenu triggers when moving mouse over periodic table
    if (!host.dataset.agyStopMove) {
      host.dataset.agyStopMove = '1';
      for (const evtName of ['mousemove', 'pointermove', 'mouseover']) {
        host.addEventListener(evtName, (ev) => ev.stopPropagation());
      }
    }

    const openSubForRecord = (cellEl, rec) => {
      cancelCloseSub();
      if (isUpdatePopoverOpen() && updateInfo?.status !== 'updating') {
        hideUpdatePortal();
      }
      const sameOpen =
        subPopover.classList.contains('open') &&
        subPopover.dataset.activeElNum === String(rec.element.num);
      if (currentHoverCell && currentHoverCell !== cellEl) {
        currentHoverCell.classList.remove('hover-open');
      }
      currentHoverCell = cellEl;
      cellEl.classList.add('hover-open');
      if (sameOpen) return;
      subPopover.dataset.activeElNum = String(rec.element.num);

      subPopover.style.setProperty('--el-rgb', rec.accent.rgb);
      subPopover.style.setProperty('--el-label', rec.accent.label);
      subPopover.innerHTML = '';

      const hdr = document.createElement('div');
      hdr.className = 'pt-sub-hdr';
      const elBadge = document.createElement('div');
      elBadge.className = 'pt-sub-el';
      elBadge.innerHTML = `<span class="pt-sub-chip">${rec.element.num} ${rec.element.symbol}</span><span>${rec.familyName}</span>`;
      const qSpan = document.createElement('span');
      qSpan.className = 'pt-sub-quota';
      qSpan.textContent = !rec.available ? `需 ${rec.requiredTier}` : (rec.pct !== null ? `余 ${rec.pct}%` : '可用');
      hdr.appendChild(elBadge);
      hdr.appendChild(qSpan);
      subPopover.appendChild(hdr);

      const desc = document.createElement('div');
      desc.className = 'pt-sub-desc';
      desc.textContent = rec.sampleOpt?.tagDescription || `${rec.element.en} (${rec.element.zh})`;
      subPopover.appendChild(desc);

      if (!rec.available) {
        const lockBox = document.createElement('div');
        lockBox.className = 'pt-lock-box';
        lockBox.textContent = rec.reason;
        subPopover.appendChild(lockBox);
      } else {
        if (rec.reason) {
          const note = document.createElement('div');
          note.className = 'pt-lock-box';
          note.textContent = rec.reason;
          subPopover.appendChild(note);
        }
        const effWrap = document.createElement('div');
        effWrap.className = 'pt-efforts';
        for (const opt of rec.variants) {
          const effName = extractEffortName(opt.label, opt.modelId);
          const isDef = rec.defaultOpt && opt.modelId === rec.defaultOpt.modelId;
          const isCur = ctx?.selectedModel?.modelId === opt.modelId || ctx?.selectedModel?.label === opt.label;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pt-eff-btn' + (isCur ? ' selected' : '');
          btn.innerHTML = `<span>${effName}</span><span class="pt-eff-tags">${isDef ? '<span>默认</span>' : ''}${isCur ? '<span>✓</span>' : ''}</span>`;
          btn.onclick = (ev) => {
            ev.stopPropagation();
            if (rec.backendDisabledOnly) {
              cellEl.classList.remove('shake');
              void cellEl.offsetWidth;
              cellEl.classList.add('shake');
              showToast(rec.reason);
              return;
            }
            const rect = cellEl.getBoundingClientRect();
            subPopover.classList.remove('open');
            subPopover.dataset.activeElNum = '';
            runMorphAnimation(rect, rec.accent, rec.element, opt, ctx);
          };
          effWrap.appendChild(btn);
        }
        subPopover.appendChild(effWrap);
      }

      subPopover.classList.remove('open');
      void subPopover.offsetWidth;
      subPopover.classList.add('open');
      // Anchor neatly beside hovered element card without leaving viewport
      const cr = cellEl.getBoundingClientRect();
      const sw = 232;
      const sh = subPopover.offsetHeight || 160;
      let left = cr.right + 14;
      let openRight = true;
      if (left + sw > window.innerWidth - 10) {
        left = Math.max(10, cr.left - sw - 14);
        openRight = false;
      }
      const top = Math.max(10, Math.min(window.innerHeight - sh - 10, cr.top - 8));
      subPopover.style.transformOrigin = openRight ? 'left center' : 'right center';
      subPopover.style.left = `${Math.round(left)}px`;
      subPopover.style.top = `${Math.round(top)}px`;
    };

    for (const el of ELEMENTS) {
      const rec = matchedByNum.get(el.num);
      const cell = document.createElement('div');
      cell.style.gridRow = String(el.row);
      cell.style.gridColumn = String(el.col);

      if (!rec) {
        cell.className = 'pt-cell inert';
        cell.title = `${el.num} ${el.symbol} · ${el.en} (${el.zh})`;
        cell.innerHTML = `<span class="pt-num">${el.num}</span><span class="pt-sym">${el.symbol}</span><span class="pt-zh">${el.zh}</span>`;
        grid.appendChild(cell);
        continue;
      }

      cell.className =
        'pt-cell active' +
        (!rec.available ? ' locked' : '') +
        (rec.isSelected ? ' selected' : '');
      cell.style.setProperty('--el-rgb', rec.accent.rgb);
      cell.style.setProperty('--el-label', rec.accent.label);
      cell.style.setProperty('--el-solid-bg', rec.accent.solidBg);
      cell.style.setProperty('--el-solid-hover', rec.accent.solidHover);
      cell.style.setProperty('--el-solid-locked', rec.accent.solidLocked);
      cell.dataset.elementSymbol = el.symbol;
      cell.dataset.elementNum = String(el.num);
      cell.innerHTML = `<span class="pt-num">${el.num}</span><span class="pt-sym">${el.symbol}</span><span class="pt-zh">${el.zh}</span>`;

      cell.addEventListener('mouseenter', () => openSubForRecord(cell, rec));
      cell.addEventListener('mouseleave', scheduleCloseSub);
      cell.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (!rec.available || rec.backendDisabledOnly) {
          cell.classList.remove('shake');
          void cell.offsetWidth;
          cell.classList.add('shake');
          showToast(rec.reason);
          return;
        }
        const targetOpt = rec.defaultOpt || rec.variants[0];
        if (!targetOpt) return;
        const rect = cell.getBoundingClientRect();
        subPopover.classList.remove('open');
        subPopover.dataset.activeElNum = '';
        runMorphAnimation(rect, rec.accent, rec.element, targetOpt, ctx);
      });
      grid.appendChild(cell);
    }

    wrap.appendChild(grid);
    wrap.appendChild(toast);
    sr.appendChild(wrap);
  }

  let lastPanelRefreshAt = 0;

  function enhanceVisiblePanel() {
    const panel = document.querySelector('[data-testid="model-selector-panel"]');
    if (!panel) return false;
    if (panel.dataset.agyPtableBound === '1') return true;
    const menu = panel.closest('[role="menu"]');
    const ctx = getModelContext();
    if (!menu || !ctx) return false;
    panel.dataset.agyPtableBound = '1';
    buildPeriodicUi(panel, menu, ctx);
    const now = Date.now();
    if (typeof ctx.refreshModels === 'function' && now - lastPanelRefreshAt >= 5_000) {
      lastPanelRefreshAt = now;
      try {
        Promise.resolve(ctx.refreshModels()).finally(() => {
          setTimeout(() => {
            const curPanel = document.querySelector('[data-testid="model-selector-panel"]');
            const subOpen = document.getElementById(SUB_HOST_ID)?.shadowRoot?.querySelector('.pt-sub.open');
            if (curPanel && !subOpen) {
              const curCtx = getModelContext();
              const curMenu = curPanel.closest('[role="menu"]');
              if (curCtx && curMenu) buildPeriodicUi(curPanel, curMenu, curCtx);
            }
          }, 450);
        });
      } catch {}
    }
    return true;
  }

  let observer = null;
  function startObserver() {
    if (observer || !document.body) return;
    if (!updDocClickHandler) {
      updDocClickHandler = (ev) => {
        if (!isUpdatePopoverOpen() || updateInfo?.status === 'updating') return;
        const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
        if (activeUpdPop && path.includes(activeUpdPop)) return;
        if (activeUpdBtn && path.includes(activeUpdBtn)) return;
        hideUpdatePortal();
      };
      document.addEventListener('pointerdown', updDocClickHandler, true);
    }
    if (!updKeyHandler) {
      updKeyHandler = (ev) => {
        if (ev.key === 'Escape' && isUpdatePopoverOpen() && updateInfo?.status !== 'updating') {
          ev.stopPropagation();
          hideUpdatePortal();
        }
      };
      document.addEventListener('keydown', updKeyHandler, true);
    }
    observer = new MutationObserver(() => {
      const panel = document.querySelector('[data-testid="model-selector-panel"]');
      if (!panel) {
        hideSubPortal();
        hideUpdatePortal();
      } else if (panel.dataset.agyPtableBound !== '1') {
        enhanceVisiblePanel();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    enhanceVisiblePanel();
  }

  if (document.body) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

  window.__AGY_PTABLE = {
    ver: VER,
    update(payload) {
      if (payload?.config) {
        const prevTier = runtimeConfig.tierOverride;
        runtimeConfig = { ...runtimeConfig, ...payload.config };
        if (prevTier !== runtimeConfig.tierOverride) {
          const panel = document.querySelector('[data-testid="model-selector-panel"]');
          if (panel) {
            delete panel.dataset.agyPtableBound;
            enhanceVisiblePanel();
          }
        }
      }
      if (payload?.update && typeof payload.update === 'object') {
        updateInfo = payload.update;
        syncUpdateUi();
      }
      const ctx = getModelContext();
      if (ctx) buildPeriodicState(ctx);
      return { ok: true, telemetry: lastTelemetry };
    },
    setTierOverride(mode) {
      pendingConfigPatch = { ...(pendingConfigPatch || {}), tierOverride: mode };
      runtimeConfig.tierOverride = mode;
      const panel = document.querySelector('[data-testid="model-selector-panel"]');
      if (panel) {
        delete panel.dataset.agyPtableBound;
        enhanceVisiblePanel();
      }
      const ctx = getModelContext();
      if (ctx) buildPeriodicState(ctx);
      return lastTelemetry;
    },
    registerAlias(alias, symbol) {
      customAliasMap.set(alias, symbol);
      const panel = document.querySelector('[data-testid="model-selector-panel"]');
      if (panel) {
        delete panel.dataset.agyPtableBound;
        enhanceVisiblePanel();
      }
    },
    consumePendingConfig() {
      const out = pendingConfigPatch;
      pendingConfigPatch = null;
      return out;
    },
    consumePendingUpdateAction() {
      const out = pendingUpdateAction;
      pendingUpdateAction = null;
      return out;
    },
    unmount() {
      try { if (observer) observer.disconnect(); } catch {}
      observer = null;
      if (updDocClickHandler) {
        document.removeEventListener('pointerdown', updDocClickHandler, true);
        updDocClickHandler = null;
      }
      if (updKeyHandler) {
        document.removeEventListener('keydown', updKeyHandler, true);
        updKeyHandler = null;
      }
      activeUpdBtn = null;
      activeUpdPop = null;
      document.querySelectorAll('#' + PTABLE_HOST_ID).forEach((el) => el.remove());
      document.querySelectorAll('.agy-ptable-section-label').forEach((el) => el.remove());
      document.querySelectorAll('.agy-ptable-hidden-row').forEach((el) => el.classList.remove('agy-ptable-hidden-row'));
      document.querySelectorAll('[role="menu"].agy-ptable-expanded').forEach((el) => el.classList.remove('agy-ptable-expanded'));
      document.querySelectorAll('[data-testid="model-selector-panel"]').forEach((el) => delete el.dataset.agyPtableBound);
      const css = document.getElementById(MENU_CSS_ID);
      if (css) css.remove();
      const sub = document.getElementById(SUB_HOST_ID);
      if (sub) sub.remove();
      const fx = document.getElementById(FX_HOST_ID);
      if (fx) fx.remove();
    },
  };
})();
