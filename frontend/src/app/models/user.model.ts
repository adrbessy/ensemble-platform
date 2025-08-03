export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  birthdate: string; // au format ISO (ex: "1997-01-02")
  gender: string;
  photoFilename?: string;      // optionnel
  friendCode?: string;         // optionnel
  contacts?: User[];           // liste d’amis
  // Tu peux ajouter d'autres propriétés si besoin (ex: roles, stats, etc.)
}
