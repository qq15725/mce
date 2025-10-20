export const getRandomValues = crypto.getRandomValues.bind(crypto)

export const uint32 = (): number => getRandomValues(new Uint32Array(1))[0]

// @ts-expect-error uuidv4Template
const uuidv4Template = [1e7] + -1e3 + -4e3 + -8e3 + -1e11

export function uuidv4(): string {
  return uuidv4Template.replace(/[018]/g, (c: number) => (c ^ uint32() & 15 >> c / 4).toString(16))
}
