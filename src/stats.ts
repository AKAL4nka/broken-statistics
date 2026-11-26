

export type DiceConfig = {
  numDice: number;
  sides: number;
};

function validateDiceConfig(config: DiceConfig) {
  if (!Number.isInteger(config.numDice)) {
    throw new Error("Number of dice must be an integer");
  }
  if (!Number.isInteger(config.sides)) {
    throw new Error("Number of sides must be an integer");
  }
  if (config.numDice <= 0) {
    throw new Error("Number of dice must be positive");
  }
  if (config.sides <= 0) {
    throw new Error("Number of sides must be positive");
  }
}

export function possibleSums(numDice: number, sides: number): number[] {
  validateDiceConfig({ numDice, sides });
  const results: number[] = [];
  for (let i = numDice; i <= numDice * sides; i++) {
    results.push(i);
  }
  return results;
}

export function waysToMakeSums(numDice: number, sides: number): Map<number, number> {
  validateDiceConfig({ numDice, sides });
  let results: Map<number, number> = new Map([[0, 1]]);
  for (let i = 0; i < numDice; i++) {
    const newResults: Map<number, number> = new Map();
    for (const [sum, count] of results.entries()) {
        for (let j = 1; j <= sides; j++) {
            const newSum = sum + j;
            newResults.set(newSum, (newResults.get(newSum) ?? 0) + count);
        }
    }
    results = newResults;
  }
  return results;
}

export function expectedProbabilities(numDice: number, sides: number): Map<number, number> {
  validateDiceConfig({ numDice, sides });
  const ways = waysToMakeSums(numDice, sides);
  const total = Math.pow(sides, numDice);
  const probabilities: Map<number, number> = new Map();
  for (const [sum, count] of ways.entries()) {
    probabilities.set(sum, count / total);
  }
  return probabilities;
}