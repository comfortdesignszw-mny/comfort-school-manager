import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Student } from '../types';
import { getSettings } from '../db';
import { School } from 'lucide-react';

interface StudentIDCardProps extends React.HTMLAttributes<HTMLDivElement> {
  student: Student;
  className?: string;
  style?: React.CSSProperties;
}

const StudentIDCard = forwardRef<HTMLDivElement, StudentIDCardProps>(({ student, className, style, id, ...props }, ref) => {
  const settings = getSettings();
  const schoolLogo = settings.schoolLogo || null;

  return (
    <div 
      ref={ref}
      id={id}
      className={`relative overflow-hidden flex flex-col items-center text-center box-border ${className || ''}`}
      style={{
        width: '324px',
        height: '516px', // Standard CR80 aspect ratio corresponding to 54mm x 86mm
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        background: '#ffffff',
        ...style
      }}
      {...props}
    >
      {/* Top Header - Dark Blue */}
      <div 
        className="absolute top-0 left-0 w-full h-[180px] z-0" 
        style={{ 
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', // Tailwind's blue-900 to blue-800
          borderBottom: '6px solid #06b6d4' // Tailwind's cyan-500
        }}
      />
      
      {/* Content Layer */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-3 pb-2 w-full h-full box-border">
        
        {/* School Header Section */}
        <div className="flex flex-col items-center w-full mb-1 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center p-1 shadow-md mb-1 overflow-hidden shrink-0" style={{ background: '#ffffff' }}>
            {schoolLogo ? (
              <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
            ) : (
              <School className="w-6 h-6 text-blue-900 shrink-0" />
            )}
          </div>
          <div className="text-white uppercase font-extrabold text-[13px] leading-snug w-full px-1 break-words pb-0.5" style={{ color: '#ffffff' }}>
            {settings.schoolName || 'School Name'}
          </div>
          {settings.schoolMotto && <div className="text-[8px] font-bold tracking-wide italic mt-0.5 w-full break-words px-1 leading-tight" style={{ color: '#a5f3fc' }}>{settings.schoolMotto}</div>}
          
          <div className="flex flex-col items-center w-full mt-1 space-y-0.5">
            {(settings.schoolContact || settings.schoolPhone) && (
              <div className="text-[7px] w-full break-words px-1 leading-tight" style={{ color: '#dbeafe' }}>
                {[settings.schoolPhone, settings.schoolContact].filter(Boolean).join(' • ')}
              </div>
            )}
            {settings.schoolAddress && (
              <div className="text-[6.5px] w-full break-words px-2 leading-tight" style={{ color: '#dbeafe' }}>
                {settings.schoolAddress}
              </div>
            )}
          </div>
        </div>

        {/* Profile Section */}
        <div className="relative mb-2 mt-1 z-20 shrink-0">
          {student.profilePhoto ? (
            <img 
              src={student.profilePhoto} 
              className="w-24 h-24 rounded-full object-cover border-[4px] border-white shadow-md relative"
              style={{ outline: '3px solid #06b6d4', outlineOffset: '-1px', background: '#f8fafc' }} // Cyan subtle border accent
              crossOrigin="anonymous" 
              alt="Student"
            />
          ) : (
            <div 
              className="w-24 h-24 rounded-full border-[4px] border-white shadow-md flex items-center justify-center relative"
              style={{ outline: '3px solid #06b6d4', outlineOffset: '-1px', background: '#f1f5f9' }}
            >
              <span className="text-3xl font-bold" style={{ color: '#94a3b8' }}>{student.fullName.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Student Details Section (Black text on white background) */}
        <div className="flex flex-col items-center w-full rounded-lg px-2 flex-grow justify-center mb-1 shrink-0" style={{ background: '#ffffff' }}>
          <div className="text-[20px] font-black leading-tight mb-1.5 w-full break-words" style={{ color: '#000000' }}>
            {student.fullName}
          </div>
          
          <div className="text-[14px] font-bold uppercase tracking-wider mb-2" style={{ color: '#000000' }}>
            CLASS: {student.schoolData?.assignedClass || 'Unassigned'}
          </div>

          <div className="flex flex-col items-center w-full">
            <span className="text-[10px] uppercase font-black tracking-widest mb-0.5" style={{ color: '#000000' }}>STUDENT ID</span>
            <span className="text-[15px] font-black font-mono tracking-wide" style={{ color: '#000000' }}>
              {student.nationalId || (student.id as string | number === 'preview' ? 'STU-001' : `STU-${String(student.id || 'NEW').padStart(4, '0')}`)}
            </span>
          </div>
        </div>

        {/* Scanning Section (QR Code) - Bottom */}
        <div className="w-full flex justify-center mt-auto mb-1 shrink-0">
          <div className="p-1.5 rounded-lg border-2 border-slate-200" style={{ background: '#ffffff' }}>
            <QRCodeSVG 
              value={student.nationalId || (student.id as string | number === 'preview' ? 'PREVIEW' : String(student.id || 'NEW'))}
              size={70}
              level="M"
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
        </div>

      </div>

      {/* Bottom Trim */}
      <div 
        className="absolute bottom-0 left-0 w-full h-2 z-0" 
        style={{ background: 'linear-gradient(90deg, #1e3a8a, #1e40af)' }}
      />
    </div>
  );
});

StudentIDCard.displayName = 'StudentIDCard';
export default StudentIDCard;
