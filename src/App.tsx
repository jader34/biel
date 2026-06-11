/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Shield, 
  Zap, 
  RotateCcw, 
  Compass, 
  Swords, 
  Sparkles, 
  Award, 
  Plus, 
  Minus, 
  Flame, 
  Eye, 
  Check, 
  Search, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Sliders,
  Maximize2,
  ShieldAlert,
  HeartCrack
} from 'lucide-react';

// Types definition
interface Weapon {
  id: string;
  name: string;
  type: 'melee' | 'ranged';
  atkBonus: number;
  atkCalculation: string;
  damageFormula: string;
  damageType: string;
  range?: string;
  properties?: string[];
  notes?: string;
}

interface Spell {
  id: string;
  name: string;
  originalName: string;
  level: number;
  castingTime: string;
  range: string;
  duration: string;
  concentration: boolean;
  description: string;
  mechanics: string;
  prepared: boolean;
  category: 'Combate' | 'Suporte' | 'Utilitária';
}

interface Skill {
  name: string;
  translatedName: string;
  attribute: string;
  bonus: number;
  proficient: boolean;
}

export default function App() {
  // --------------------------------------------------
  // STATE MANAGEMENT WITH LOCAL PERSISTENCE
  // --------------------------------------------------
  const [hp, setHp] = useState<number>(() => {
    const saved = localStorage.getItem('brehem_hp');
    return saved !== null ? Math.max(0, Math.min(33, parseInt(saved, 10))) : 33;
  });

  const [tempHp, setTempHp] = useState<number>(() => {
    const saved = localStorage.getItem('brehem_temp_hp');
    return saved !== null ? Math.max(0, parseInt(saved, 10)) : 0;
  });

  const [spellSlots, setSpellSlots] = useState<boolean[]>(() => {
    const saved = localStorage.getItem('brehem_spell_slots');
    return saved !== null ? JSON.parse(saved) : [true, true, true]; // true = active slot, false = expended
  });

  const [activeTab, setActiveTab] = useState<'status' | 'combat' | 'spells' | 'features'>(() => {
    const saved = localStorage.getItem('brehem_active_tab');
    return (saved as any) || 'status';
  });

  const [spellFilter, setSpellFilter] = useState<'all' | 'prepared'>('all');
  const [spellSearch, setSpellSearch] = useState<string>('');
  const [expandedSpell, setExpandedSpell] = useState<string | null>(null);

  // Active spells & condition trackers
  const [conditions, setConditions] = useState<{ mark: boolean; invisible: boolean; ambush: boolean }>({
    mark: false,
    invisible: false,
    ambush: false
  });

  // Active HP Dialog/Tab adjustment State
  const [isHpAdjustOpen, setIsHpAdjustOpen] = useState<boolean>(false);
  const [isRestConfirmOpen, setIsRestConfirmOpen] = useState<boolean>(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState<boolean>(false);
  const [hpInputValue, setHpInputValue] = useState<string>('');
  const [hpActionSelected, setHpActionSelected] = useState<'damage' | 'heal' | 'temp'>('damage');

  const applyHpAdjustment = () => {
    const val = parseInt(hpInputValue, 10);
    if (isNaN(val) || val <= 0) {
      return;
    }
    
    if (hpActionSelected === 'damage') {
      adjustHp(-val);
    } else if (hpActionSelected === 'heal') {
      adjustHp(val);
    } else if (hpActionSelected === 'temp') {
      setTempHp(prev => Math.min(50, prev + val));
      triggerFlash('heal');
    }
    setHpInputValue('');
    setIsHpAdjustOpen(false);
  };

  const [screenFlash, setScreenFlash] = useState<'heal' | 'damage' | null>(null);

  // --------------------------------------------------
  // PERSISTENCE EFFECTS
  // --------------------------------------------------
  useEffect(() => {
    localStorage.setItem('brehem_hp', hp.toString());
  }, [hp]);

  useEffect(() => {
    localStorage.setItem('brehem_temp_hp', tempHp.toString());
  }, [tempHp]);

  useEffect(() => {
    localStorage.setItem('brehem_spell_slots', JSON.stringify(spellSlots));
  }, [spellSlots]);

  useEffect(() => {
    localStorage.setItem('brehem_active_tab', activeTab);
  }, [activeTab]);

  // --------------------------------------------------
  // HP AND TRACKER ACTIONS
  // --------------------------------------------------
  const adjustHp = (amount: number) => {
    if (amount > 0) {
      // Healing
      setHp(prev => {
        const next = Math.min(33, prev + amount);
        triggerFlash('heal');
        return next;
      });
    } else {
      // Damage - cuts into Temp HP first
      const damageAbs = Math.abs(amount);
      triggerFlash('damage');
      
      if (tempHp > 0) {
        if (tempHp >= damageAbs) {
          setTempHp(prev => prev - damageAbs);
        } else {
          const remainder = damageAbs - tempHp;
          setTempHp(0);
          setHp(prev => Math.max(0, prev - remainder));
        }
      } else {
        setHp(prev => Math.max(0, prev - damageAbs));
      }
    }
  };

  const triggerFlash = (type: 'heal' | 'damage') => {
    setScreenFlash(type);
    setTimeout(() => {
      setScreenFlash(null);
    }, 450);
  };

  const resetAllTrackers = () => {
    setIsRestConfirmOpen(true);
  };

  const triggerLongRest = () => {
    setHp(33);
    setTempHp(0);
    setSpellSlots([true, true, true]);
    setConditions({ mark: false, invisible: false, ambush: false });
    triggerFlash('heal');
    setIsRestConfirmOpen(false);
  };

  const toggleSpellSlot = (index: number) => {
    setSpellSlots(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  // --------------------------------------------------
  // CORE MECHANICAL DATA
  // --------------------------------------------------
  const attributes = [
    { label: 'FOR', name: 'Força', score: 16, mod: '+3', modColor: 'text-violet-400' },
    { label: 'DES', name: 'Destreza', score: 15, mod: '+2', modColor: 'text-violet-400' },
    { label: 'CON', name: 'Constituição', score: 13, mod: '+1', modColor: 'text-violet-400' },
    { label: 'INT', name: 'Inteligência', score: 13, mod: '+1', modColor: 'text-slate-400' },
    { label: 'SAB', name: 'Sabedoria', score: 15, mod: '+2', modColor: 'text-violet-400' },
    { label: 'CAR', name: 'Carisma', score: 12, mod: '+1', modColor: 'text-slate-400' },
  ];

  const skills: Skill[] = [
    { name: 'Athletics', translatedName: 'Atletismo (FOR)', attribute: 'FOR', bonus: 5, proficient: true },
    { name: 'Animal Handling', translatedName: 'Lidar com Animais (SAB)', attribute: 'SAB', bonus: 4, proficient: true },
    { name: 'Nature', translatedName: 'Natureza (INT)', attribute: 'INT', bonus: 3, proficient: true },
    { name: 'Perception', translatedName: 'Percepção (SAB)', attribute: 'SAB', bonus: 4, proficient: true },
    { name: 'Survival', translatedName: 'Sobrevivência (SAB)', attribute: 'SAB', bonus: 4, proficient: true },
  ];

  const allSkills: Skill[] = [
    { name: 'Acrobatics', translatedName: 'Acrobacia (DES)', attribute: 'DES', bonus: 2, proficient: false },
    { name: 'Animal Handling', translatedName: 'Lidar com Animais (SAB)', attribute: 'SAB', bonus: 4, proficient: true },
    { name: 'Arcana', translatedName: 'Arcanismo (INT)', attribute: 'INT', bonus: 1, proficient: false },
    { name: 'Athletics', translatedName: 'Atletismo (FOR)', attribute: 'FOR', bonus: 5, proficient: true },
    { name: 'Performance', translatedName: 'Atuação (CAR)', attribute: 'CAR', bonus: 1, proficient: false },
    { name: 'Deception', translatedName: 'Enganação (CAR)', attribute: 'CAR', bonus: 1, proficient: false },
    { name: 'Stealth', translatedName: 'Furtividade (DES)', attribute: 'DES', bonus: 2, proficient: false },
    { name: 'History', translatedName: 'História (INT)', attribute: 'INT', bonus: 1, proficient: false },
    { name: 'Insight', translatedName: 'Intuição (SAB)', attribute: 'SAB', bonus: 2, proficient: false },
    { name: 'Intimidation', translatedName: 'Intimidação (CAR)', attribute: 'CAR', bonus: 1, proficient: false },
    { name: 'Investigation', translatedName: 'Investigação (INT)', attribute: 'INT', bonus: 1, proficient: false },
    { name: 'Medicine', translatedName: 'Medicina (SAB)', attribute: 'SAB', bonus: 2, proficient: false },
    { name: 'Nature', translatedName: 'Natureza (INT)', attribute: 'INT', bonus: 3, proficient: true },
    { name: 'Perception', translatedName: 'Percepção (SAB)', attribute: 'SAB', bonus: 4, proficient: true },
    { name: 'Persuasion', translatedName: 'Persuasão (CAR)', attribute: 'CAR', bonus: 1, proficient: false },
    { name: 'Slight of Hand', translatedName: 'Prestidigitação (DES)', attribute: 'DES', bonus: 2, proficient: false },
    { name: 'Religion', translatedName: 'Religião (INT)', attribute: 'INT', bonus: 1, proficient: false },
    { name: 'Survival', translatedName: 'Sobrevivência (SAB)', attribute: 'SAB', bonus: 4, proficient: true },
  ];

  const weapons: Weapon[] = [
    {
      id: 'longsword_main',
      name: 'Espada Longa (Mão Principal)',
      type: 'melee',
      atkBonus: 5,
      atkCalculation: '+5 para acertar (Bônus de Proficiência +2, Modificador de Força +3)',
      damageFormula: '1d8 + 3',
      damageType: 'Cortante',
      notes: 'Wielded with Dual Wielder feat. Adds raw power + style.'
    },
    {
      id: 'longsword_off',
      name: 'Espada Longa (Ação Bônus)',
      type: 'melee',
      atkBonus: 5,
      atkCalculation: '+5 para acertar (Bônus de Proficiência +2, Modificador de Força +3)',
      damageFormula: '1d8 + 3',
      damageType: 'Cortante',
      notes: 'Possui bônus total de Força no dano devido ao Estilo de Combate com Duas Armas.'
    },
    {
      id: 'longbow',
      name: 'Arco Longo (Ranged)',
      type: 'ranged',
      atkBonus: 4,
      atkCalculation: '+4 para acertar (Bônus de Proficiência +2, Modificador de Destreza +2)',
      damageFormula: '1d8 + 2',
      damageType: 'Perfurante',
      range: '45m / 180m (150/600 ft)',
      notes: 'Excelente para ataques à distância antes de fechar o combate.'
    },
    {
      id: 'heavy_crossbow',
      name: 'Besta Pesada (Ranged)',
      type: 'ranged',
      atkBonus: 4,
      atkCalculation: '+4 para acertar (Bônus de Proficiência +2, Modificador de Destreza +2)',
      damageFormula: '1d10 + 2',
      damageType: 'Perfurante',
      range: '30m / 120m (100/400 ft)',
      properties: ['Pesada', 'Recarga'],
      notes: 'Impacto absurdo, consome recarga a cada disparo.'
    }
  ];

  const spells: Spell[] = [
    {
      id: 'hunters_mark',
      name: 'Marca do Caçador',
      originalName: "Hunter's Mark",
      level: 1,
      castingTime: '1 Ação Bônus',
      range: '27 metros',
      duration: 'Concentração, até 1 hora',
      concentration: true,
      prepared: true,
      category: 'Combate',
      description: 'Você escolhe uma criatura visível dentro do alcance para marcar como sua presa. Até o fim da magia, você causa 1d6 de dano de arma extra toda vez que acertar um ataque nela, e tem vantagem em testes de Sabedoria (Percepção ou Sobrevivência) para localizá-la.',
      mechanics: '+1d6 de dano cortante/perfurante em cada acerto. Despesa de folego ou de rastreio facilitada.'
    },
    {
      id: 'cure_wounds',
      name: 'Curar Ferimentos',
      originalName: 'Cure Wounds',
      level: 1,
      castingTime: '1 Ação',
      range: 'Toque',
      duration: 'Instantâneo',
      concentration: false,
      prepared: true,
      category: 'Suporte',
      description: 'Uma criatura que você toca recupera uma quantidade de pontos de vida igual a 1d8 + seu modificador de habilidade de conjuração (Sabedoria +2 para Brehem).',
      mechanics: 'Cura 1d8 + 2 PV diretamente no alvo.'
    },
    {
      id: 'disguise_self',
      name: 'Disfarçar-se',
      originalName: 'Disguise Self',
      level: 1,
      castingTime: '1 Ação',
      range: 'Pessoal',
      duration: '1 hora',
      concentration: false,
      prepared: true, // Automatically prepared for Gloom Stalker
      category: 'Utilitária',
      description: 'Você altera sua aparência visual (incluindo roupas e equipamentos) para parecer uma pessoa diferente por 1 hora. Não altera a estrutura física nem peso físico.',
      mechanics: 'Magia de Truque e furtividade social. Concedida automaticamente pelo arquétipo Rastreador Subterrâneo no Nível 3.'
    },
    {
      id: 'detect_magic',
      name: 'Detectar Magia',
      originalName: 'Detect Magic',
      level: 1,
      castingTime: '1 Ação',
      range: 'Pessoal (raio de 9m)',
      duration: 'Concentração, até 10 min',
      concentration: true,
      prepared: true,
      category: 'Utilitária',
      description: 'Pela duração, você sente a presença de magia a até 9 metros de você. Se sentir magia, você pode usar sua ação para ver uma aura tênue ao redor de qualquer criatura ou objeto visível que contenha magia, e aprende sua escola.',
      mechanics: 'Alinha as emanações mágicas nos olhos do Ranger para exploração tática.'
    }
  ];

  const features = [
    {
      title: 'Batedor do Subterrâneo: Emboscador Temível',
      source: 'Patrulheiro (Nível 3)',
      desc: 'No 3° nível, você domina a arte da emboscada. No seu primeiro turno durante o combate, você ganha +3 metros de bônus no seu deslocamento e, se você usar a ação de Ataque nesse turno, você pode realizar um ataque adicional (que se atingir, causa 1d8 de dano extra). Você também adiciona seu modificador de Sabedoria (+2) nas rolagens de iniciativa.'
    },
    {
      title: 'Batedor do Subterrâneo: Visão Umbral',
      source: 'Patrulheiro (Nível 3)',
      desc: 'Você ganha visão no escuro com alcance de 18 metros (se já possuía, aumenta em 9m). Você também é especialista em evitar criaturas que contam com visão no escuro: tais criaturas não ganham qualquer benefício ao tentarem detectar você em condições de escuridão ou penumbra (sendo considerado invisível para elas). Além disso, quando o Mestre determina se você pode se esconder de uma criatura, ela não ganha benefício devido à visão no escuro dela.'
    },
    {
      title: 'Talento: Ambidestro (Dual Wielder)',
      source: 'Humano Variante (Nível 1)',
      desc: 'Você ganha +1 de bônus na CA enquanto estiver empunhando duas armas brancas diferentes em cada mão (já computado na CA: 16). Você pode usar o combate com duas armas mesmo se as armas não forem leves (permitindo empunhar duas Espadas Longas). Além disso, você pode sacar ou guardar duas armas de uma vez simultaneamente.'
    },
    {
      title: 'Combate com Duas Armas (Fighting Style)',
      source: 'Classe: Patrulheiro (Nível 2)',
      desc: 'Quando você engaja em combate com duas armas, você pode adicionar seu modificador de habilidade principal (+3 de Força) ao dano do seu segundo ataque da mão secundária (Ação Bônus), potencializando drasticamente seu dano constante.'
    },
    {
      title: 'Inimigo Favorito',
      source: 'Classe: Patrulheiro (Nível 1)',
      desc: 'Você tem experiência significativa estudando, rastreando e caçando tipos de criaturas (bestas, fadas, humanoides, monstruosidades ou mortos-vivos). Você recebe +2 de bônus nas jogadas de dano com armas contra elas. Possui vantagem em testes de Sabedoria (Sobrevivência) para rastreá-las e testes de Inteligência para lembrar informações úteis. Concede um idioma falado por este tipo de inimigo.'
    },
    {
      title: 'Explorador Natural',
      source: 'Classe: Patrulheiro (Nível 1)',
      desc: 'Mestre da navegação natural e sobrevivência rápida:\n• Combate: Você ignora terreno difícil e tem vantagem em rolagens de iniciativa. No primeiro turno, tem vantagem de ataque contra criaturas que ainda não agiram.\n• Viagem (1h+): Terreno difícil não atrasa o grupo; não podem se perder; permanece alerta mesmo realizando tarefas; move-se rápido e furtivamente se estiver só; encontra o dobro de ração/comida; revela número exato, tamanhos e há quanto tempo rastros de criaturas passaram pela área.'
    }
  ];

  // Filtered Spells list
  const filteredSpells = spells.filter(spell => {
    const matchesSearch = spell.name.toLowerCase().includes(spellSearch.toLowerCase()) || 
                          spell.originalName.toLowerCase().includes(spellSearch.toLowerCase());
    const matchesFilter = spellFilter === 'all' || spell.prepared;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-neutral-950 font-sans text-stone-100 flex justify-center selection:bg-purple-900 selection:text-white relative">
      
      {/* SCREEN PULSE FLASH FOR DAMAGE AND HEAL */}
      {screenFlash === 'damage' && (
        <div className="fixed inset-0 bg-red-900/15 pointer-events-none z-50 transition-opacity duration-300 animate-pulse border-4 border-red-700/30" />
      )}
      {screenFlash === 'heal' && (
        <div className="fixed inset-0 bg-emerald-900/15 pointer-events-none z-50 transition-opacity duration-300 animate-pulse border-4 border-emerald-700/30" />
      )}

      {/* FULL RESPONSIVE CONTAINER WITH DESKTOP CONSOLE FRAMEWORK */}
      <div className="w-full max-w-md bg-gloom-obsidian border-x border-gloom-border h-screen flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* --- STICKY HEADER PART --- */}
        <header id="sticky-header" className="sticky top-0 z-40 bg-gloom-obsidian/95 backdrop-blur-md border-b border-gloom-border pt-3 px-4 pb-3 shadow-md">
          {/* Identity Metadata Bar */}
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gloom-violet animate-pulse shadow-neon"></span>
                <h1 className="font-serif text-2xl font-extrabold tracking-wide text-stone-100 uppercase">
                  Brehem
                </h1>
              </div>
              <p className="text-xs text-gloom-violet font-medium font-mono uppercase tracking-widest mt-0.5">
                Viadâo do Subterrâneo 4
              </p>
            </div>
            
            {/* Quick Actions (Reset to Full Recovery) */}
            <button 
              id="btn-rest"
              onClick={resetAllTrackers}
              title="Descanso Longo"
              className="p-1 px-2.5 rounded-md bg-gloom-panel hover:bg-gloom-border active:scale-95 text-xs text-stone-400 font-mono flex items-center gap-1 inline-flex transition-transform duration-100 border border-neutral-800"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gloom-violet" />
              <span>DESCANSO L.</span>
            </button>
          </div>

          {/* Fast stats slider metrics */}
          <div className="grid grid-cols-4 gap-1 px-1.5 mb-2.5 py-1 rounded-lg bg-gloom-panel/75 border border-neutral-900">
            {/* AC / CA */}
            <div id="stat-ca" className="flex flex-col items-center">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">CA</span>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-gloom-violet-bright" />
                <span className="font-mono font-bold text-sm tracking-tighter">16</span>
              </div>
            </div>

            {/* Initiative */}
            <div id="stat-initiative" className="flex flex-col items-center border-l border-neutral-900">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Iniciativa</span>
              <div className="flex items-center gap-1 text-stone-100 font-mono font-bold text-sm tracking-tighter">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                <span>+4</span>
              </div>
            </div>

            {/* Prof Bonus */}
            <div id="stat-proficiency" className="flex flex-col items-center border-l border-neutral-900">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Proficiên.</span>
              <div className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-gloom-green" />
                <span className="font-mono font-bold text-sm tracking-tighter">+2</span>
              </div>
            </div>

            {/* Speed */}
            <div id="stat-speed" className="flex flex-col items-center border-l border-neutral-900">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Deslocam.</span>
              <span className="font-mono font-bold text-sm text-gloom-green tracking-tighter">9m / 12m*</span>
            </div>
          </div>

          {/* Compact Clickable HP Tracker */}
          <button 
            id="hp-compact-trigger"
            onClick={() => setIsHpAdjustOpen(true)}
            className="w-full text-left p-2.5 rounded-lg bg-gloom-panel border border-gloom-border/90 hover:border-gloom-violet-bright/50 transition-all flex items-center justify-between shadow-neon group cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Heart className="w-4 h-4 text-red-500 fill-red-500 group-hover:scale-110 transition-transform shrink-0" />
              <span className="text-xs font-bold text-stone-300 font-sans tracking-wide uppercase shrink-0">HP</span>
              
              {/* Slim interactive health indicator bar */}
              <div className="w-16 sm:w-28 h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900 flex relative shrink-0">
                {tempHp > 0 && (
                  <div 
                    className="h-full bg-gloom-violet-bright transition-all duration-300"
                    style={{ width: `${Math.min(100, (tempHp / 33) * 100)}%` }}
                  />
                )}
                <div 
                  className={`h-full transition-all duration-300 ${
                    hp <= 10 ? 'bg-gradient-to-r from-red-650 to-red-500' : 'bg-gradient-to-r from-gloom-green-dark to-gloom-green'
                  }`}
                  style={{ width: `${(hp / 33) * 100}%` }}
                />
              </div>
              <span className="text-[9.5px] font-mono text-stone-500 shrink-0">
                {Math.round((hp / 33) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {tempHp > 0 && (
                <span className="text-[9px] bg-gloom-violet-bright/20 border border-gloom-violet-bright/40 text-gloom-violet-bright px-1 py-0.2 rounded font-bold font-mono">
                  +{tempHp} TP
                </span>
              )}
              <div className="font-mono text-sm font-extrabold text-stone-100 flex items-center">
                <span className={`${hp <= 10 ? 'text-red-500 font-black animate-pulse' : 'text-stone-100'}`}>
                  {hp}
                </span>
                <span className="text-stone-500 text-xs px-0.5">/</span>
                <span className="text-stone-400">33</span>
              </div>
              <Sliders className="w-3.5 h-3.5 text-gloom-violet-bright stroke-[2.5px] opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </header>

        {/* --- MAIN TAB CONTENTS AREA --- */}
        <main className="flex-1 p-4 pb-28 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-900">
          
          {/* ==================================================================== */}
          {/* TAB 1: [STATUS] */}
          {/* ==================================================================== */}
          {activeTab === 'status' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Grid 2-column de Atributos */}
              <div>
                <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-2 font-mono">ATRIBUTOS & MODIFICADORES</h3>
                <div className="grid grid-cols-2 gap-2">
                  {attributes.map(attr => (
                    <div 
                      key={attr.label}
                      className="p-2.5 rounded-lg bg-gloom-panel/90 border border-gloom-border flex justify-between items-center"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-stone-500 font-bold font-mono uppercase tracking-wider">{attr.label}</span>
                        <span className="text-xs text-zinc-300 mt-0.5">{attr.name}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`font-mono text-2xl font-black ${attr.modColor}`}>
                          {attr.mod}
                        </span>
                        <span className="text-sm font-semibold text-stone-500 bg-zinc-950 p-1 px-1.5 rounded-md min-w-[28px] text-center font-mono text-xs">
                          {attr.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perícias Treinadas e D&D 5e */}
              <div id="skills-section" className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider font-mono">
                    {isSkillsExpanded ? 'TODAS AS PERÍCIAS (D&D 5E)' : 'PERÍCIAS TREINADAS (PROFICIENTES)'}
                  </span>
                  <span className="text-[10px] text-gloom-violet font-mono uppercase">Proficiência: +2</span>
                </div>
                
                <div 
                  id="skills-list-container"
                  onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                  className="p-3 rounded-lg bg-gloom-panel border border-gloom-border divide-y divide-zinc-900 hover:border-gloom-violet-bright/35 hover:bg-gloom-panel/95 cursor-pointer transition-all duration-200 select-none group"
                >
                  <div className="divide-y divide-zinc-900">
                    {(isSkillsExpanded ? allSkills : skills).map(skill => (
                      <div 
                        key={skill.name}
                        className="flex justify-between items-center py-2.5 first:pt-0 last:pb-2 font-sans transition-colors duration-150"
                      >
                        <div className="flex items-center gap-2">
                          {skill.proficient ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-gloom-violet shadow-neon shrink-0 animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-850 shrink-0" />
                          )}
                          <div>
                            <span className={`text-sm ${skill.proficient ? 'font-semibold text-stone-200 group-hover:text-stone-100' : 'text-stone-400/80 font-normal'}`}>
                              {skill.translatedName}
                            </span>
                            {skill.name === 'Perception' && (
                              <span className="text-[11px] text-stone-500 block font-mono">Percepção Passiva: 14</span>
                            )}
                          </div>
                        </div>
                        <span className={`py-1 px-3 text-sm font-mono font-bold rounded border transition-all duration-150 ${
                          skill.proficient 
                            ? 'bg-zinc-950 text-gloom-violet-bright border-purple-900/30 shadow-sm' 
                            : 'bg-zinc-950/40 text-stone-550 border-neutral-900/40'
                        }`}>
                          {skill.bonus >= 0 ? `+${skill.bonus}` : skill.bonus}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-center text-[10px] text-zinc-600 font-mono group-hover:text-gloom-violet-bright transition-colors uppercase tracking-widest flex items-center justify-center gap-1 border-t border-zinc-900/50">
                    {isSkillsExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-gloom-violet-bright" />
                        <span>Clique para recolher perícias</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-gloom-violet-bright" />
                        <span>Ver todas as perícias (D&D 5e)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Spell Slots Tracker (1º Círculo) */}
              <div className="p-3.5 rounded-lg bg-gloom-panel border border-gloom-border">
                <div className="flex justify-between items-center mb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-stone-200 font-serif">Espaços de Magia (1º Círculo)</h3>
                    <p className="text-xs text-stone-400">Patrulheiros de nível 4 têm 3 slots disponíveis de primeiro círculo.</p>
                  </div>
                  <button 
                    onClick={() => setSpellSlots([true, true, true])}
                    className="p-1 px-1.5 text-[10px] font-mono border border-zinc-800 hover:border-gloom-violet bg-zinc-950 text-stone-400 rounded transition-all active:scale-95"
                    title="Restaurar Espaços"
                  >
                    Restaurar
                  </button>
                </div>

                <div className="flex justify-around items-center py-1 mt-1 bg-zinc-950 p-3 rounded-lg border border-neutral-900">
                  {spellSlots.map((active, idx) => (
                    <button 
                      key={idx}
                      onClick={() => toggleSpellSlot(idx)}
                      className={`relative flex flex-col items-center gap-1.5 active:scale-90 transition-transform ${active ? 'text-gloom-violet-bright' : 'text-zinc-650'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        active 
                          ? 'bg-purple-950/40 border-gloom-violet-glow shadow-neon' 
                          : 'bg-neutral-950 border-stone-800'
                      }`}>
                        {active ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-gloom-violet-bright animate-ping absolute pointer-events-none opacity-40" />
                        ) : null}
                        <div className={`w-3.5 h-3.5 rounded-full transition-colors ${active ? 'bg-gloom-violet-bright' : 'bg-neutral-800'}`} />
                      </div>
                      <span className="font-mono text-[10px] text-stone-400 font-bold uppercase">
                        Slot {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 2: [COMBAT] */}
          {/* ==================================================================== */}
          {activeTab === 'combat' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Tactical Note and Combat State flags */}
              <div className="p-3 rounded-lg bg-gloom-panel/90 border border-gloom-border/90 flex flex-col gap-2 shadow-neon">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gloom-violet-bright font-mono uppercase tracking-wider font-bold">Modo de Combate Ativo</span>
                  <span className="text-[10px] bg-gloom-green-dark/30 border border-gloom-green/30 text-gloom-green px-2 rounded font-bold font-mono">
                    Combate de Duas Armas
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Brehem empunha <span className="text-bold text-stone-200">duas espadas longas</span> simultaneamente graças ao seu talento de combate. Seus ataques extras de ação bônus recebem o modificador total de dano (+3 de Força).
                </p>

                {/* Quick Interactive Combat Buff Switches */}
                <div className="grid grid-cols-1 gap-2 mt-1">
                  <button 
                    onClick={() => setConditions(prev => ({ ...prev, mark: !prev.mark }))}
                    className={`p-2 rounded border text-xs font-bold transition-all flex items-center justify-between font-mono ${
                      conditions.mark 
                        ? 'bg-gloom-violet-glow/20 border-gloom-violet-bright text-white shadow-neon' 
                        : 'bg-zinc-950 border-neutral-900 text-stone-400 hover:border-neutral-800'
                    }`}
                  >
                    <span>Marca do Caçador</span>
                    <span className={`w-2 h-2 rounded-full ${conditions.mark ? 'bg-gloom-violet-bright' : 'bg-stone-600'}`}></span>
                  </button>
                </div>
              </div>

              {/* Weapons Grid list */}
              <div className="space-y-3">
                <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider font-mono">CARTAS DE ARMAS E ATAQUES</h3>
                
                {weapons.map(weapon => {
                  return (
                    <div 
                      key={weapon.id}
                      className="p-3.5 rounded-lg bg-gloom-panel border border-gloom-border/95 hover:border-gloom-border transition-all flex flex-col gap-2 relative overflow-hidden"
                    >
                      {/* Active Buff Glowing indicator on card border if applicable */}
                      {weapon.type === 'melee' && conditions.mark && (
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gloom-violet-bright animate-pulse" />
                      )}

                      {/* Header block of card */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif text-base font-bold text-stone-100 flex items-center gap-1.5">
                            {weapon.type === 'melee' ? (
                              <Swords className="w-4 h-4 text-gloom-violet-bright" />
                            ) : (
                              <Compass className="w-4 h-4 text-gloom-green" />
                            )}
                            {weapon.name}
                          </h4>
                          {weapon.range && (
                            <span className="text-[11px] text-stone-400 font-mono">Alcance: {weapon.range}</span>
                          )}
                          {weapon.properties && (
                            <div className="flex gap-1.5 mt-1 font-mono">
                              {weapon.properties.map(p => (
                                <span key={p} className="text-[9px] bg-zinc-950 border border-stone-850 px-1 py-0.2 rounded text-stone-500">
                                  {p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 font-mono uppercase tracking-widest">
                          {weapon.type === 'melee' ? 'C. Corpo' : 'À Distância'}
                        </span>
                      </div>

                      {/* Mechanical Action Details */}
                      <p className="text-xs text-stone-400 font-sans border-b border-zinc-900 pb-2.5">
                        {weapon.notes}
                        {weapon.type === 'melee' && conditions.mark && (
                          <span className="text-gloom-violet-bright block font-bold mt-1">
                            🔥 Marca ativa: +1d6 de dano incluso!
                          </span>
                        )}
                      </p>

                      {/* Weapon Stats Panel (Static displays for physical dice) */}
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {/* ATAQUE INFO BADGE */}
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-stone-500 font-mono uppercase tracking-widest pl-1 mb-1">PROGRAMAÇÃO ACERTO</span>
                          <div className="bg-zinc-950 text-stone-200 border border-neutral-850 p-2 rounded flex items-center justify-center gap-1.5 font-bold font-mono text-sm shadow-sm">
                            <Swords className="w-4 h-4 text-gloom-violet-bright" />
                            <span>+{weapon.atkBonus} Acerto</span>
                          </div>
                        </div>

                        {/* DAMAGE INFO BADGE */}
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-stone-500 font-mono uppercase tracking-widest pl-1 mb-1">DANO BASE</span>
                          <div className="bg-gloom-green-dark/20 text-gloom-green border border-gloom-green/15 p-2 rounded flex items-center justify-center gap-1.5 font-bold font-mono text-sm">
                            <Flame className="w-4 h-4 text-gloom-green" />
                            <span className="font-extrabold">{weapon.damageFormula} {weapon.type === 'melee' && conditions.mark ? '+ 1d6' : ''}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Combat Feature checklist */}
              <div className="p-3.5 rounded-lg bg-gloom-panel border border-gloom-border">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest font-mono mb-2">LEMBRETES DE SEU PRIMEIRO ROUND COGNITIVOS</h4>
                <ul className="space-y-1.5 text-xs text-stone-400">
                  <li className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <span>Se você utilizar Ataque no 1º turno, desfira um ataque extra (Subclasse Emboscador Temível) que causa adicionais <span className="text-gloom-violet font-bold font-mono">1d8</span> de dano!</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <span>Seu deslocamento no primeiro turno aumenta em <span className="font-bold font-mono text-gloom-green">+3 metros</span>.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gloom-violet-bright mt-1.5 shrink-0" />
                    <span>Você possui <span className="text-gloom-violet-bright font-bold">vantagem</span> em jogadas de ataque contra criaturas que ainda não agiram no combate (Explorador Natural).</span>
                  </li>
                </ul>
              </div>

            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 3: [SPELLS] */}
          {/* ==================================================================== */}
          {activeTab === 'spells' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Quick Spells Summary Info */}
              <div className="p-3.5 rounded-lg bg-gloom-panel border border-gloom-border flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-stone-200 font-serif">Aptidão de Conjuração (WIS)</h4>
                  <p className="text-xs text-stone-400 mt-0.5">Sua CD para resistir magias é 12. Seu ataque de magia é +4.</p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-gloom-violet font-extrabold uppercase text-[10px] tracking-wider">CD Resolução</div>
                  <div className="text-2xl font-black text-gloom-violet-bright">12</div>
                </div>
              </div>

              {/* Spotify-style pill filters for rapid categorization selection */}
              <div className="flex gap-2 items-center">
                <button 
                  id="tab-spell-all"
                  onClick={() => setSpellFilter('all')}
                  className={`p-2 px-4 rounded-full text-xs font-bold transition-all ${
                    spellFilter === 'all' 
                      ? 'bg-gloom-violet-glow text-white shadow-neon' 
                      : 'bg-gloom-panel border border-neutral-900 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  Todas ({spells.length})
                </button>
                <button 
                  id="tab-spell-prepared"
                  onClick={() => setSpellFilter('prepared')}
                  className={`p-2 px-4 rounded-full text-xs font-bold transition-all ${
                    spellFilter === 'prepared' 
                      ? 'bg-gloom-violet-glow text-white shadow-neon' 
                      : 'bg-gloom-panel border border-neutral-900 text-stone-400 hover:text-stone-300'
                  }`}
                >
                  Preparadas / Conhecidas ({spells.filter(s => s.prepared).length})
                </button>
              </div>

              {/* Search bar inside Spells tab */}
              <div className="relative bg-gloom-panel rounded-lg border border-gloom-border p-0.5 flex items-center">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Pesquisar magia..."
                  value={spellSearch}
                  onChange={(e) => setSpellSearch(e.target.value)}
                  className="w-full bg-transparent pl-9 pr-4 py-2.5 outline-none font-sans text-sm text-stone-200 placeholder-stone-500 rounded-lg focus-within:border-glow"
                />
                {spellSearch && (
                  <button 
                    onClick={() => setSpellSearch('')}
                    className="p-1 px-2.5 text-xs text-stone-500 hover:text-stone-300 font-mono"
                  >
                    X
                  </button>
                )}
              </div>

              {/* Spells Accordion List */}
              <div className="space-y-2.5">
                {filteredSpells.length === 0 ? (
                  <p className="text-center py-6 text-stone-500 text-xs font-mono">Nenhuma magia encontrada neste filtro.</p>
                ) : (
                  filteredSpells.map(spell => {
                    const isOpen = expandedSpell === spell.id;
                    return (
                      <div 
                        key={spell.id}
                        className={`rounded-lg bg-gloom-panel border ${
                          isOpen ? 'border-gloom-violet-bright/50 shadow-neon' : 'border-gloom-border'
                        } transition-all`}
                      >
                        {/* Clickable Header portion of the Accordion */}
                        <button 
                          onClick={() => setExpandedSpell(isOpen ? null : spell.id)}
                          className="w-full p-3.5 text-left flex justify-between items-center active:bg-gloom-obsidian rounded-t-lg transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              spell.category === 'Combate' ? 'bg-red-950/40 text-red-400' :
                              spell.category === 'Suporte' ? 'bg-emerald-950/40 text-emerald-400' :
                              'bg-zinc-900 text-stone-400'
                            }`}>
                              {spell.name[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif font-bold text-stone-100 text-sm">{spell.name}</span>
                                {spell.concentration && (
                                  <span className="text-[8px] bg-purple-950 border border-purple-800 text-gloom-violet-bright font-bold px-1 py-0.2 rounded font-mono uppercase">
                                    Conc.
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-stone-400 italic font-mono mt-0.5 block">{spell.originalName}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-950 p-1 px-1.5 rounded">
                              {spell.category}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-stone-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                        </button>

                        {/* Collapsible Content */}
                        {isOpen && (
                          <div className="p-3.5 border-t border-zinc-900 bg-zinc-950/40 text-xs text-stone-300 space-y-2.5 leading-relaxed rounded-b-lg">
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono uppercase bg-neutral-950 p-2 rounded border border-neutral-900/60 text-stone-400">
                              <div>Conjuração: <span className="text-stone-200 block font-sans font-bold">{spell.castingTime}</span></div>
                              <div>Alcance: <span className="text-stone-200 block font-sans font-bold">{spell.range}</span></div>
                              <div>Duração: <span className="text-stone-200 block font-sans font-bold">{spell.duration}</span></div>
                              <div>Espaço: <span className="text-stone-200 block font-sans font-bold">1º Círculo</span></div>
                            </div>
                            
                            {/* Mechanics Bullet */}
                            <div className="p-2 border-l-2 border-gloom-violet bg-gloom-panel/30">
                              <span className="font-bold text-stone-200 text-[11px] block text-gloom-violet-bright font-mono uppercase">Resumo Mecânico:</span>
                              <p className="mt-0.5 text-stone-300 font-sans">{spell.mechanics}</p>
                            </div>

                            {/* Full text */}
                            <p className="text-zinc-400 font-sans">{spell.description}</p>
                            
                            {/* Static helper within individual spell card if damage/healing is possible */}
                            {spell.id === 'cure_wounds' && (
                              <div className="w-full mt-2 bg-emerald-950/10 border border-emerald-900/30 text-emerald-400 py-2.5 rounded font-mono font-bold flex items-center justify-center gap-1.5 text-xs text-center">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Valor de Cura: 1d8 + 2 PV</span>
                              </div>
                            )}

                            {spell.id === 'hunters_mark' && (
                              <div className="w-full mt-2 bg-purple-950/10 border border-purple-900/30 text-gloom-violet-bright py-2.5 rounded font-mono font-bold flex items-center justify-center gap-1.5 text-xs text-center">
                                <Flame className="w-3.5 h-3.5" />
                                <span>Dano Extra: +1d6 por acerto</span>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Spell slots warning helper */}
              <div className="p-3 bg-gloom-panel border border-gloom-border text-xs rounded-lg text-stone-400">
                <span className="font-bold text-zinc-300 block font-mono mb-1">Nota de Magias de Patrulheiro:</span>
                Diferente de Magos ou Clérigos, Rangers conhecem um número fixo de magias conhecidas e sempre as têm preparadas na mente. Não há necessidade de alternar preparações ao acordar.
              </div>

            </div>
          )}

          {/* ==================================================================== */}
          {/* TAB 4: [FEATURES] */}
          {/* ==================================================================== */}
          {activeTab === 'features' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs text-zinc-500 font-bold uppercase tracking-wider font-mono">HABILIDADES & TALENTOS DO L.4</h3>
                <span className="text-[10px] text-gloom-violet uppercase font-mono">Rastreador Subterrâneo</span>
              </div>

              <div className="space-y-3">
                {features.map((feat, index) => {
                  return (
                    <div 
                      key={index}
                      className="p-4 rounded-lg bg-gloom-panel border border-gloom-border hover:border-glow/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-serif font-extrabold text-stone-100/95 leading-tight tracking-wide text-sm flex items-center gap-2">
                          {feat.title.includes('Emboscador') && <Zap className="w-4 h-4 text-yellow-500" />}
                          {feat.title.includes('Visão') && <Eye className="w-4 h-4 text-gloom-violet-bright" />}
                          {feat.title.includes('Ambidestro') && <Swords className="w-4 h-4 text-stone-200" />}
                          {feat.title.includes('Duas') && <Award className="w-4 h-4 text-gloom-green" />}
                          {(feat.title.includes('Inimigo') || feat.title.includes('Explorador')) && <Compass className="w-4 h-4 text-amber-500" />}
                          {feat.title}
                        </h4>
                        <span className="text-[9px] font-mono text-zinc-500 bg-zinc-950 p-1 px-1.5 rounded shrink-0 ml-1">
                          {feat.source}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 leading-relaxed font-sans whitespace-pre-line">
                        {feat.desc}
                      </p>
                      
                      {/* Special fast info block for Dread Ambusher */}
                      {feat.title.includes('Emboscador') && (
                        <div className="mt-3 pt-3 border-t border-zinc-900 grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
                          <div className="bg-zinc-950/50 p-2 rounded border border-neutral-900 text-stone-300">
                            <span className="text-stone-500 block text-[9px] uppercase">Ataque Extra</span>
                            <span className="font-bold text-stone-200">+5 para Acerto</span>
                          </div>
                          <div className="bg-purple-950/10 p-2 rounded border border-purple-900/20 text-gloom-violet-bright">
                            <span className="text-purple-500 block text-[9px] uppercase">Dano Extra</span>
                            <span className="font-bold">+1d8 de Arma</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </main>



        {/* --- INTERACTIVE HP ADJUSTMENT MODAL (ABA/MODAL DE HP) --- */}
        {isHpAdjustOpen && (
          <div className="absolute inset-0 bg-neutral-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm bg-gloom-panel border border-gloom-border/95 rounded-xl p-5 shadow-neon border-gloom-violet-bright/30 flex flex-col gap-4">
              
              <div className="text-center">
                <h3 className="font-mono text-xs uppercase text-gloom-violet-bright font-bold tracking-widest">
                  Gestão de Vitalidade
                </h3>
                <span className="text-[10px] text-stone-500 block font-mono mt-0.5">
                  Ajuste seus Pontos de Vida (HP) com precisão
                </span>
              </div>

              {/* Status Header displaying current HP and TEMP */}
              <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-2.5 rounded-lg border border-neutral-900 text-center">
                <div>
                  <span className="text-[9px] font-mono text-stone-500 block uppercase">HP Atual</span>
                  <span className="text-lg font-mono font-black text-stone-100">{hp} / 33</span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-stone-500 block uppercase">PV Temp</span>
                  <span className="text-lg font-mono font-black text-gloom-violet-bright">+{tempHp} TP</span>
                </div>
              </div>

              {/* Number Input Box with visual indicator */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-mono uppercase block text-left">Valor a Ajustar:</label>
                <div className="relative">
                  <input 
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Digite o valor..."
                    value={hpInputValue}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '');
                      setHpInputValue(v);
                    }}
                    className="w-full bg-zinc-950 hover:bg-neutral-900 focus:bg-neutral-900 border border-gloom-border/80 focus:border-gloom-violet-bright/75 rounded-lg py-3 px-4 font-mono font-bold text-center text-xl text-stone-100 outline-none transition-colors"
                  />
                  {hpInputValue && (
                    <button 
                      onClick={() => setHpInputValue('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] bg-neutral-900 border border-neutral-800 text-stone-500 hover:text-stone-300 font-mono uppercase p-1 px-1.5 rounded transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-1.5">
                {[1, 5, 10, 15].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setHpInputValue(preset.toString())}
                    className="flex-1 bg-zinc-950 hover:bg-neutral-900 active:scale-95 text-[10px] font-mono border border-neutral-850 p-1.5 rounded-md text-stone-400 hover:text-stone-200 transition-all font-bold"
                  >
                    +{preset}
                  </button>
                ))}
              </div>

              {/* Segmented Type Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-stone-400 font-mono uppercase block text-left">Ação:</label>
                <div className="grid grid-cols-3 gap-1.5 bg-zinc-950/80 p-1 rounded-lg border border-zinc-900/85">
                  <button
                    onClick={() => setHpActionSelected('damage')}
                    className={`p-2 py-2.5 rounded-md font-mono font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
                      hpActionSelected === 'damage'
                        ? 'bg-red-950/30 border border-red-800/80 text-red-400 font-black shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    <HeartCrack className="w-4 h-4" />
                    Dano
                  </button>
                  <button
                    onClick={() => setHpActionSelected('heal')}
                    className={`p-2 py-2.5 rounded-md font-mono font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
                      hpActionSelected === 'heal'
                        ? 'bg-emerald-950/30 border border-emerald-800/80 text-emerald-400 font-black shadow-[0_0_8px_rgba(16,185,129,0.1)]'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                    Cura
                  </button>
                  <button
                    onClick={() => setHpActionSelected('temp')}
                    className={`p-2 py-2.5 rounded-md font-mono font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 ${
                      hpActionSelected === 'temp'
                        ? 'bg-purple-950/30 border border-purple-800/80 text-gloom-violet-bright font-black shadow-[0_0_8px_rgba(168,85,247,0.1)]'
                        : 'text-stone-400 hover:text-stone-200 border border-transparent'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    PV Temp
                  </button>
                </div>
              </div>

              {/* Confirm / Apply buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-zinc-900/60 font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setIsHpAdjustOpen(false);
                    setHpInputValue('');
                  }}
                  className="bg-zinc-950 hover:bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg text-xs font-bold text-stone-400 hover:text-stone-200 uppercase transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={applyHpAdjustment}
                  disabled={!hpInputValue || parseInt(hpInputValue, 10) <= 0}
                  className={`p-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    !hpInputValue || parseInt(hpInputValue, 10) <= 0
                      ? 'opacity-40 cursor-not-allowed bg-zinc-950 border border-neutral-900 text-stone-600'
                      : hpActionSelected === 'damage'
                      ? 'bg-red-950 hover:bg-red-900 text-red-100 border border-red-800'
                      : hpActionSelected === 'heal'
                      ? 'bg-emerald-950 hover:bg-emerald-950 text-emerald-100 border border-emerald-800'
                      : 'bg-purple-950 hover:bg-purple-900 text-purple-100 border border-purple-800'
                  }`}
                >
                  Ajustar
                </button>
              </div>

              {/* Tiny Clear Temp option */}
              {tempHp > 0 && (
                <button
                  onClick={() => {
                    setTempHp(0);
                    triggerFlash('damage');
                    setIsHpAdjustOpen(false);
                  }}
                  className="w-full text-center hover:underline text-[9.5px] font-mono text-stone-500 hover:text-stone-400 uppercase mt-0.5"
                >
                  Zerar PV Temporário ({tempHp})
                </button>
              )}

            </div>
          </div>
        )}

        {/* --- CUSTOM LONG REST CONFIRMATION MODAL --- */}
        {isRestConfirmOpen && (
          <div className="absolute inset-0 bg-neutral-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-[280px] bg-gloom-panel border border-gloom-border/60 rounded-xl p-4 shadow-neon flex flex-col gap-3 text-center">
              <h3 className="font-mono text-xs uppercase text-gloom-violet-bright font-bold tracking-widest">
                Confirmar Descanso?
              </h3>
              <p className="text-[11px] text-stone-400 leading-snug">
                Isso recuperará totalmente seus PVs (33/33) e espaços de magia.
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1 pt-2 border-t border-zinc-900 font-mono">
                <button
                  type="button"
                  onClick={() => setIsRestConfirmOpen(false)}
                  className="bg-zinc-950 hover:bg-neutral-900 p-1.5 rounded text-[11px] font-bold text-stone-400 uppercase transition-colors"
                >
                  Não
                </button>
                <button
                  type="button"
                  onClick={triggerLongRest}
                  className="bg-gloom-violet-bright/10 border border-gloom-violet-bright/40 text-gloom-violet-bright hover:bg-gloom-violet-bright/20 p-1.5 rounded text-[11px] font-bold uppercase transition-colors"
                >
                  Sim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- BOTTOM TAB NAVIGATION BAR --- */}
        <nav className="absolute bottom-0 right-0 left-0 bg-gloom-obsidian/95 backdrop-blur-md border-t border-gloom-border py-2 px-1 grid grid-cols-4 gap-1 z-35 shadow-md">
          
          {/* TAB SPELLS BUTTON */}
          <button 
            id="tab-btn-status"
            onClick={() => setActiveTab('status')}
            className={`flex flex-col items-center justify-center p-1.5 py-2 rounded-lg transition-all ${
              activeTab === 'status' 
                ? 'bg-gloom-panel border border-gloom-violet-bright/35 text-gloom-violet-bright font-black shadow-neon' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-5 h-5 mb-1" />
            <span className="text-[9.5px] font-mono tracking-wider">Status</span>
          </button>

          {/* TAB COMBAT BUTTON */}
          <button 
            id="tab-btn-combat"
            onClick={() => setActiveTab('combat')}
            className={`flex flex-col items-center justify-center p-1.5 py-2 rounded-lg transition-all ${
              activeTab === 'combat' 
                ? 'bg-gloom-panel border border-gloom-violet-bright/35 text-gloom-violet-bright font-black shadow-neon' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Swords className="w-5 h-5 mb-1" />
            <span className="text-[9.5px] font-mono tracking-wider">Combate</span>
          </button>

          {/* TAB SPELLS BUTTON */}
          <button 
            id="tab-btn-spells"
            onClick={() => setActiveTab('spells')}
            className={`flex flex-col items-center justify-center p-1.5 py-2 rounded-lg transition-all ${
              activeTab === 'spells' 
                ? 'bg-gloom-panel border border-gloom-violet-bright/35 text-gloom-violet-bright font-black shadow-neon' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-1" />
            <span className="text-[9.5px] font-mono tracking-wider">Magias</span>
          </button>

          {/* TAB FEATURES BUTTON */}
          <button 
            id="tab-btn-features"
            onClick={() => setActiveTab('features')}
            className={`flex flex-col items-center justify-center p-1.5 py-2 rounded-lg transition-all ${
              activeTab === 'features' 
                ? 'bg-gloom-panel border border-gloom-violet-bright/35 text-gloom-violet-bright font-black shadow-neon' 
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Award className="w-5 h-5 mb-1" />
            <span className="text-[9.5px] font-mono tracking-wider">Habilidades</span>
          </button>

        </nav>

      </div>
    </div>
  );
}
