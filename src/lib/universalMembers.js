/**
 * Membros universais que aparecem em todas as funções da agência
 * Inclui nome (case-insensitive) e email
 */
export const UNIVERSAL_MEMBERS = ["pamela", "saltiagencia@gmail.com"];

/**
 * Filtra membros incluindo os universais
 * @param {Array} members - Lista de membros
 * @param {string} targetRole - Role que está procurando (ex: "redator", "designer")
 * @returns {Array} Membros filtrados
 */
export const filterMembersWithUniversal = (members, targetRole) => {
  return members.filter((m) => {
    if (m.role === targetRole || m.role === "admin") return true;
    if (UNIVERSAL_MEMBERS.some((name) => m.name?.toLowerCase().includes(name) || m.email === name)) return true;
    return false;
  });
};