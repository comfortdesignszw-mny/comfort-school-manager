export interface Guardian {
  name: string;
  relation: string;
  contact: string;
  address: string;
}

export interface Student {
  id?: number;
  profilePhoto?: string;
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  nationalId: string;
  physicalAddress: string;
  guardianData: Guardian[];
  schoolData: {
    classId?: number;
    assignedTeachers?: string[];
    assignedSubjects?: string[];
    marks?: { [subjectName: string]: number };
  };
}

export interface Class {
  id?: number;
  name: string;
  teacherId?: number;
  // Based on primary/secondary/tertiary mode
  assignedTeacherName?: string;
  subjectTeachers?: { subject: string; teacherName: string }[];
  courses?: { code: string; title: string; lecturer: string; credits: number }[];
}

export interface FeeTransaction {
  id?: number;
  studentId: number;
  studentName: string;
  termOrMonth: string;
  amount: number;
  receiptNumber: string;
  date: string;
  status: 'Paid' | 'Unpaid' | 'Partial';
}

export interface Notice {
  id?: number;
  date: string;
  author: string;
  title: string;
  content: string;
  audience: 'All' | 'Parents' | 'Teachers' | 'Students';
}

export interface AppSettings {
  schoolName: string;
  schoolLogo: string;
  schoolMotto: string;
  schoolContact: string;
  schoolAddress: string;
  systemMode: 'Primary' | 'Secondary' | 'Tertiary';
  themeColor: string;
}

export interface Staff {
  id?: number;
  fullName: string;
  title: string; // e.g. 'Teacher', 'Lecturer', 'Principal', etc.
  contact?: string;
  email?: string;
  status: 'Active' | 'Inactive';
}

export interface Attendance {
  id?: number;
  date: string; // YYYY-MM-DD
  studentId: number;
  status: 'Present' | 'Absent' | 'Late';
}

export interface CalendarEvent {
  id?: number;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'exam' | 'event' | 'deadline';
}

