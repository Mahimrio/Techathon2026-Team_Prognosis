export type Clock = () => Date

export const realClock: Clock = () => new Date()

let currentClock: Clock = realClock

export const getClock = (): Clock => currentClock

export const setClock = (clock: Clock): void => {
  currentClock = clock
}
