const TC_LOT_SIZE = 250

export function goldToTc(gold, goldPerTc) {
  return gold / goldPerTc
}

export function tcToBrl(tc, brlPer250Tc) {
  return (tc / TC_LOT_SIZE) * brlPer250Tc
}

export function goldToBrl(gold, goldPerTc, brlPer250Tc) {
  return tcToBrl(goldToTc(gold, goldPerTc), brlPer250Tc)
}
