export type DeepMaybe<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepMaybe<U>> | undefined
    : T extends object
      ? { [K in keyof T]?: DeepMaybe<T[K]> }
      : T | undefined
