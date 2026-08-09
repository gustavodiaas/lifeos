// Substitui o toast da sonner.
// success e info: silenciosos (sem banner).
// error: console.error para debug, sem banner visual.
// Os erros devem ser tratados inline pelos componentes.

export const toast = {
  success: (_msg: string) => {},
  error:   (msg: string)  => { console.error("[LifeOS]", msg); },
  info:    (_msg: string) => {},
  warning: (_msg: string) => {},
  loading: (_msg: string) => {},
  dismiss: ()             => {},
  promise: <T>(p: Promise<T>, _opts?: unknown) => p,
};
