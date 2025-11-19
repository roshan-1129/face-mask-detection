import { DailyStats, Violation } from "../types";

// Initial Mock Data
let violationsStore: Violation[] = [];
let dailyStatsStore: DailyStats = {
  totalEntries: 145,
  masksDetected: 132,
  violations: 13,
  maskComplianceRate: 91,
  hourlyTraffic: [
    { hour: '08:00', count: 12 },
    { hour: '09:00', count: 45 },
    { hour: '10:00', count: 32 },
    { hour: '11:00', count: 20 },
    { hour: '12:00', count: 36 },
    { hour: '13:00', count: 15 },
  ]
};

export const getDailyStats = (): Promise<DailyStats> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...dailyStatsStore }), 500);
  });
};

export const getViolations = (): Promise<Violation[]> => {
  return new Promise((resolve) => {
    // Sort by newest
    setTimeout(() => resolve([...violationsStore].sort((a, b) => b.timestamp - a.timestamp)), 500);
  });
};

export const logViolation = (image: string, confidence: number) => {
  const newViolation: Violation = {
    id: Math.random().toString(36).substring(7),
    timestamp: Date.now(),
    imageUrl: image,
    location: 'Main Entrance Cam-01',
    status: 'PENDING',
    confidence
  };
  violationsStore.push(newViolation);
  dailyStatsStore.violations += 1;
  dailyStatsStore.totalEntries += 1;
  updateCompliance();
};

export const logEntry = (hasMask: boolean) => {
  dailyStatsStore.totalEntries += 1;
  if (hasMask) dailyStatsStore.masksDetected += 1;
  else dailyStatsStore.violations += 1;
  updateCompliance();
};

const updateCompliance = () => {
  if (dailyStatsStore.totalEntries === 0) {
    dailyStatsStore.maskComplianceRate = 100;
    return;
  }
  dailyStatsStore.maskComplianceRate = Math.round(
    (dailyStatsStore.masksDetected / dailyStatsStore.totalEntries) * 100
  );
};
