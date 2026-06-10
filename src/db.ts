import Dexie, { type Table } from 'dexie';
import type { Student, Class, FeeTransaction, Notice, Staff } from './types';

export class SchoolDatabase extends Dexie {
  students!: Table<Student, number>;
  classes!: Table<Class, number>;
  fees!: Table<FeeTransaction, number>;
  notices!: Table<Notice, number>;
  staff!: Table<Staff, number>;

  constructor() {
    super('SchoolManagerProDB');
    this.version(1).stores({
      students: '++id, fullName, nationalId, schoolData.classId',
      classes: '++id, name',
      fees: '++id, studentId, termOrMonth, status, date',
      notices: '++id, date, audience',
    });
    this.version(2).stores({
      students: '++id, fullName, nationalId, schoolData.classId',
      classes: '++id, name',
      fees: '++id, studentId, termOrMonth, status, date',
      notices: '++id, date, audience',
      staff: '++id, fullName, title',
    });
  }
}

export const db = new SchoolDatabase();

// Default Settings logic
export const defaultSettings = {
  schoolName: 'My School',
  schoolLogo: '/icon.png',
  schoolMotto: 'Excellence in Education',
  schoolContact: 'contact@school.edu',
  schoolAddress: '123 Education Lane',
  systemMode: 'Primary',
  themeColor: '#0056b3',
};

export function getSettings() {
  const stored = localStorage.getItem('school_settings');
  if (stored) {
    try {
      return { ...defaultSettings, ...JSON.parse(stored) };
    } catch {
      return defaultSettings;
    }
  }
  return defaultSettings;
}

export function saveSettings(settings: any) {
  localStorage.setItem('school_settings', JSON.stringify(settings));
  applyTheme(settings.themeColor);
}

export function applyTheme(color: string) {
  document.documentElement.style.setProperty('--primary-color', color);
}

// Initial theme application
applyTheme(getSettings().themeColor);
