export interface DictionaryEntry {
  char: string;
  phrase: string;
}

export type Dictionary = Map<string, string>;

export function createDictionary(): Dictionary {
  return new Map();
}
