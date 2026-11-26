import { possibleSums, waysToMakeSums, expectedProbabilities } from "./stats.js";
import { test, expect } from "vitest";


test("possibleSums returns all possible sums for given dice and sides", () => {
  const result = possibleSums(2, 6);
  const expected = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
  ];
  expect(result).toEqual(expected);
});

test("possibleSums throws an error for non-positive dice or sides", () => {
  expect(() => possibleSums(0, 6)).toThrow("Number of dice must be positive");
  expect(() => possibleSums(2, 0)).toThrow("Number of sides must be positive");
  expect(() => possibleSums(-1, 6)).toThrow("Number of dice must be positive");
  expect(() => possibleSums(2, -6)).toThrow("Number of sides must be positive");
});

test("possibleSums throws an error for non-integer dice or sides", () => {
  expect(() => possibleSums(2.5, 6)).toThrow("Number of dice must be an integer");
  expect(() => possibleSums(2, 6.5)).toThrow("Number of sides must be an integer");
});

test("waysToMakeSums returns correct counts for all possible sums", () => {
  const result = waysToMakeSums(2, 6);
  const expected = new Map([
    [2, 1],
    [3, 2],
    [4, 3],
    [5, 4],
    [6, 5],
    [7, 6],
    [8, 5],
    [9, 4],
    [10, 3],
    [11, 2],
    [12, 1]
  ]);
  expect(result).toEqual(expected);
});

test("waysToMakeSums return sum of counts must give sides^numDice", () => {
  const result = Array.from(waysToMakeSums(3, 6).values()).reduce((a, b) => a + b, 0);
  const expected = Math.pow(6, 3);
  expect(result).toEqual(expected);
});

test("waysToMakeSums throws an error for non-positive dice or sides", () => {
  expect(() => waysToMakeSums(0, 6)).toThrow("Number of dice must be positive");
  expect(() => waysToMakeSums(2, 0)).toThrow("Number of sides must be positive");
  expect(() => waysToMakeSums(-1, 6)).toThrow("Number of dice must be positive");
  expect(() => waysToMakeSums(2, -6)).toThrow("Number of sides must be positive");
});

test("expectedProbabilities returns correct probabilities for all possible sums", () => {
  const result = expectedProbabilities(2, 6);
  const expected = new Map([
    [2, 1 / 36],
    [3, 2 / 36],
    [4, 3 / 36],
    [5, 4 / 36],
    [6, 5 / 36],
    [7, 6 / 36],
    [8, 5 / 36],
    [9, 4 / 36],
    [10, 3 / 36],
    [11, 2 / 36],
    [12, 1 / 36]
  ]);
  expect(result).toEqual(expected);
});

test("expectedProbabilities throws an error for non-positive dice or sides", () => {
  expect(() => expectedProbabilities(0, 6)).toThrow("Number of dice must be positive");
  expect(() => expectedProbabilities(2, 0)).toThrow("Number of sides must be positive");
  expect(() => expectedProbabilities(-1, 6)).toThrow("Number of dice must be positive");
  expect(() => expectedProbabilities(2, -6)).toThrow("Number of sides must be positive");
});