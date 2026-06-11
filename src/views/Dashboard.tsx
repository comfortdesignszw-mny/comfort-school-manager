import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Users, GraduationCap, BookOpen, Banknote, CheckCircle2, AlertCircle, Percent, Contact } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardCalendar from '../components/DashboardCalendar';
import SystemHealth from '../components/SystemHealth';

export default function Dashboard() {
  const studentsCount = useLiveQuery(() => db.students.count(), []) || 0;
  const classesCount = useLiveQuery(() => db.classes.count(), []) || 0;
  const staffCount = useLiveQuery(() => db.staff.count(), []) || 0;
  const fees = useLiveQuery(() => db.fees.toArray(), []) || [];
  const studentsList = useLiveQuery(() => db.students.toArray(), []) || [];
  const recentNotices = useLiveQuery(() => db.notices.orderBy('date').reverse().limit(5).toArray(), []) || [];

  const paidTransactions = fees.filter(f => f.status === 'Paid');
  const unpaidTransactions = fees.filter(f => f.status === 'Unpaid');

  const totalPaidSum = paidTransactions.reduce((sum, f) => sum + f.amount, 0);
  const totalUnpaidSum = unpaidTransactions.reduce((sum, f) => sum + f.amount, 0);

  // percentage paid against total students
  const actualPaidStudentsCount = studentsList.filter(s => {
    return fees.some(f => f.status === 'Paid' && (f.studentId === s.id || f.studentName.toLowerCase() === s.fullName.toLowerCase()));
  }).length;

  const percentagePaidCoverage = studentsCount > 0 ? Math.round((actualPaidStudentsCount / studentsCount) * 100) : 0;
  const financialProgress = fees.length > 0 ? Math.round((paidTransactions.length / fees.length) * 100) : 0;

  // Process data for chart
  const processChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data = months.map(month => ({ name: month, intake: 0 }));

    fees.forEach(fee => {
      const date = new Date(fee.date);
      if (date.getFullYear() === currentYear && fee.status !== 'Unpaid') {
        const monthIndex = date.getMonth();
        data[monthIndex].intake += fee.amount;
      }
    });

    // Option to show only recent 6 months to make it look better
    const currentMonth = new Date().getMonth();
    const startIndex = Math.max(0, currentMonth - 5);
    return data.slice(startIndex, startIndex + 6);
  };

  const chartData = fees.length > 0 ? processChartData() : [
    { name: 'Jan', intake: 0 },
    { name: 'Feb', intake: 0 },
    { name: 'Mar', intake: 0 },
    { name: 'Apr', intake: 0 },
    { name: 'May', intake: 0 },
    { name: 'Jun', intake: 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h2>
        <p className="text-gray-500 mt-1">Real-time stats hub and admin verification panels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard title="Enrolled Students" value={studentsCount} icon={Users} color="bg-blue-100/80 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <StatCard title="Active Classes" value={classesCount} icon={GraduationCap} color="bg-purple-100/80 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" />
        <StatCard title="School Staff" value={staffCount} icon={Contact} color="bg-pink-100/80 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400" />
        <StatCard title="Total Paid Fees" value={`$${totalPaidSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={CheckCircle2} color="bg-emerald-100/80 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
        <StatCard title="Total Unpaid Fees" value={`$${totalUnpaidSum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={AlertCircle} color="bg-rose-100/80 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" />
        <StatCard title="Paid Coverage" value={`${percentagePaidCoverage}%`} icon={Percent} color="bg-amber-100/80 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Widget */}
        <div className="glass-card">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Financial Progress</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Current Term Collection</span>
            <span className="text-sm font-medium text-gray-900">{financialProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 mb-6">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500" 
              style={{ width: `${financialProgress}%` }}
            ></div>
          </div>
          
          <h3 className="font-semibold text-sm text-gray-900 mb-4">Monthly Financial Intake</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="intake" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Noticeboard Feed */}
        <div className="glass-card">
          <h3 className="font-semibold text-lg text-gray-900 mb-4">Recent Notices</h3>
          {recentNotices.length > 0 ? (
            <div className="space-y-4">
              {recentNotices.map(notice => (
                <div key={notice.id} className="pb-4 border-b border-gray-100 dark:border-cyan-900/30 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900">{notice.title}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {new Date(notice.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No recent notices available.</p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <SystemHealth />
      </div>

      <div className="mt-6">
        <DashboardCalendar />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="glass-card flex items-center gap-4 p-5 hover:scale-[1.01] transition-transform">
      <div className={`p-3.5 rounded-xl bg-opacity-20 dark:bg-opacity-10 backdrop-blur-sm shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-cyan-200/50 uppercase tracking-wider leading-tight" title={title}>{title}</h4>
        <div className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-950 dark:text-white mt-1 leading-snug break-words" title={String(value)}>{value}</div>
      </div>
    </div>
  );
}
