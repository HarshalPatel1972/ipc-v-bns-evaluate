import rawData from './data.json';

export interface BatchData {
  batchId: number;
  questions: string[];
  modelAnswers: Record<string, string[]>;
}

export const ALL_BATCHES: BatchData[] = rawData as BatchData[];

// Verify and extract models from the first batch
export const MODELS = Object.keys(ALL_BATCHES[0]?.modelAnswers || {});
