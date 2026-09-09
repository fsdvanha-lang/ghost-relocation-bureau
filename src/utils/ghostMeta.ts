/**
 * Human-friendly metadata and dossier numbering for ghost applicants.
 * Replaces raw internal identifiers (#ghost-1, #ghost-10) with rich case numbers and archetypes.
 */

const GHOST_ARCHETYPES: Record<string, { dossierNo: string; archetype: string }> = {
  'ghost-1': { dossierNo: 'Дело № 01', archetype: 'Фантом' },
  'ghost-2': { dossierNo: 'Дело № 02', archetype: 'Теневой дух' },
  'ghost-3': { dossierNo: 'Дело № 03', archetype: 'Мыслитель' },
  'ghost-4': { dossierNo: 'Дело № 04', archetype: 'Полтергейст' },
  'ghost-5': { dossierNo: 'Дело № 05', archetype: 'Хранитель' },
  'ghost-6': { dossierNo: 'Дело № 06', archetype: 'Кибер-дух' },
  'ghost-7': { dossierNo: 'Дело № 07', archetype: 'Эфирный дух' },
  'ghost-8': { dossierNo: 'Дело № 08', archetype: 'Дух предков' },
  'ghost-9': { dossierNo: 'Дело № 09', archetype: 'Аномалия' },
  'ghost-10': { dossierNo: 'Дело № 10', archetype: 'Ночной странник' },
};

export function getGhostDossierNo(id: string): string {
  if (GHOST_ARCHETYPES[id]) {
    return GHOST_ARCHETYPES[id].dossierNo;
  }
  const match = id.match(/\d+/);
  if (match) {
    const num = String(match[0]).padStart(2, '0');
    return `Дело № ${num}`;
  }
  return 'Дело № 00';
}

export function getGhostArchetype(id: string): string {
  return GHOST_ARCHETYPES[id]?.archetype || 'Сущность';
}

export function getGhostFullReference(id: string): string {
  const meta = GHOST_ARCHETYPES[id];
  if (!meta) return getGhostDossierNo(id);
  return `${meta.dossierNo} · ${meta.archetype}`;
}
