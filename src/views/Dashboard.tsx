import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Users, GraduationCap, BookOpen, Banknote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const studentsCount = useLiveQuery(() => db.students.count(), []) || 0;
  const classesCount = useLiveQuery(() => db.classes.count(), []) || 0;
  const fees = useLiveQuery(() => db.fees.toArray(), []) || [];
  const recentNotices = useLiveQuery(() => db.notices.orderBy('date').reverse().limit(5).toArray(), []) || [];

  const paidFeesCount = fees.filter(f => f.status === 'Paid').length;
  const financialProgress = fees.length > 0 ? Math.round((paidFeesCount / fees.length) * 100) : 0;

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
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
        <p className="text-gray-500 mt-1">Overview of your school's activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={studentsCount} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard title="Classes" value={classesCount} icon={GraduationCap} color="bg-green-100 text-green-600" />
        <StatCard title="Active Subjects" value={0} icon={BookOpen} color="bg-purple-100 text-purple-600" />
        <StatCard title="Fee Collection" value={`${financialProgress}%`} icon={Banknote} color="bg-amber-100 text-amber-600" />
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
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="glass-card flex items-center gap-4">
      <div className={`p-4 rounded-lg bg-opacity-20 dark:bg-opacity-10 backdrop-blur-sm ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-500">{title}</h4>
        <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      </div>
    </div>
  );
}
