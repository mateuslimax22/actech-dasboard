/** Nomes das collections no Firestore */
export const COLLECTIONS = {
  users: "users",
  clientes: "clientes",
  ordens: "ordens",
  tecnicos: "tecnicos",
  config: "config",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** IDs fixos dentro de `config` */
export const CONFIG_DOCS = {
  loja: "loja",
  counters: "counters",
} as const;
