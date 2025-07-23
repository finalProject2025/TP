// PLZ-Validierung mit lokaler deutscher PLZ-Liste
import { postalCodes } from '../data/plz-5stellig-clean.json';

/**
 * Validiert eine deutsche Postleitzahl
 * @param postalCode - Die zu validierende PLZ
 * @returns true wenn die PLZ gültig ist, false sonst
 */
export const validatePostalCode = (postalCode: string): boolean => {
  // Format-Validierung: 5-stellige Zahl
  const postalCodeRegex = /^[0-9]{5}$/;
  if (!postalCodeRegex.test(postalCode)) {
    return false;
  }

  // Echtheit-Validierung: PLZ existiert in deutscher Liste
  return postalCode in postalCodes;
};

/**
 * Gibt den Stadtnamen für eine PLZ zurück
 * @param postalCode - Die PLZ
 * @returns Stadtname oder null wenn PLZ nicht gefunden
 */
export const getCityByPostalCode = (postalCode: string): string | null => {
  return postalCodes[postalCode] || null;
};

/**
 * Gibt alle verfügbaren deutschen PLZ zurück
 * @returns Array aller deutschen PLZ
 */
export const getAllGermanPostalCodes = (): string[] => {
  return Object.keys(postalCodes);
};

/**
 * Gibt die Anzahl der verfügbaren deutschen PLZ zurück
 * @returns Anzahl der deutschen PLZ
 */
export const getPostalCodeCount = (): number => {
  return Object.keys(postalCodes).length;
}; 