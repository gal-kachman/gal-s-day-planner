import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import plannerBg from '@/assets/planner-bg-minimal.jpeg';
const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
export default function DailyPlannerPage() {
  const [schedule, setSchedule] = useState<string[]>(Array(timeSlots.length).fill(''));
  const [duties, setDuties] = useState<string[]>(Array(8).fill(''));
  const [workTasks, setWorkTasks] = useState<{
    text: string;
    done: boolean;
  }[]>(Array(8).fill(null).map(() => ({
    text: '',
    done: false
  })));
  return <>
      <Helmet>
        <title>תכנון יומי | אטלס</title>
        <meta name="description" content="תכנן את היום שלך עם אטלס" />
      </Helmet>

      <div className="min-h-screen w-screen bg-no-repeat bg-cover bg-center px-12 py-8 overflow-hidden" style={{
      backgroundImage: `url(${plannerBg})`,
      backgroundSize: '100% 100%'
    }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif text-stone-800 tracking-wide">
            תכנון יומי
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {format(new Date(), 'EEEE, d בMMMM yyyy', {
            locale: he
          })}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12 h-[calc(100vh-12rem)]">
            {/* Left Column - Schedule */}
            <div>
              <section className="h-full flex-col flex items-center justify-start gap-0 my-0 mx-[60px]">
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  לוח זמנים
                </h2>
                <div className="flex-1 flex-col pl-4 px-[10px] flex items-start justify-between">
                  {timeSlots.map((time, i) => <div key={i} className="flex items-center gap-3 group">
                      <span className="text-xs text-stone-400 w-10 font-mono">{time}</span>
                      <input type="text" value={schedule[i]} onChange={e => {
                  const newSchedule = [...schedule];
                  newSchedule[i] = e.target.value;
                  setSchedule(newSchedule);
                }} className="flex-1 bg-transparent border-b border-stone-300/50 focus:border-stone-400 outline-none text-xs text-stone-700 py-1 transition-colors" dir="rtl" />
                    </div>)}
                </div>
              </section>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Duties */}
              <section className="flex-1">
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  חובות
                </h2>
                <div className="flex flex-col justify-between h-[calc(100%-2rem)]">
                  {duties.map((duty, i) => <input key={i} type="text" value={duty} onChange={e => {
                const newDuties = [...duties];
                newDuties[i] = e.target.value;
                setDuties(newDuties);
              }} className="w-full bg-transparent border-b border-stone-300/50 focus:border-stone-400 outline-none text-xs text-stone-700 py-1 transition-colors" dir="rtl" />)}
                </div>
              </section>

              {/* Work Tasks */}
              <section className="flex-1">
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  משימות לעבודה
                </h2>
                <div className="flex flex-col justify-between h-[calc(100%-2rem)]">
                  {workTasks.map((task, i) => <div key={i} className="flex items-center gap-2">
                      <button onClick={() => {
                  const newTasks = [...workTasks];
                  newTasks[i] = {
                    ...newTasks[i],
                    done: !newTasks[i].done
                  };
                  setWorkTasks(newTasks);
                }} className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-colors ${task.done ? 'bg-stone-600 border-stone-600' : 'border-stone-300'}`} />
                      <input type="text" value={task.text} onChange={e => {
                  const newTasks = [...workTasks];
                  newTasks[i] = {
                    ...newTasks[i],
                    text: e.target.value
                  };
                  setWorkTasks(newTasks);
                }} className={`flex-1 bg-transparent border-b border-stone-300/50 focus:border-stone-400 outline-none text-xs text-stone-700 py-1 transition-colors ${task.done ? 'line-through opacity-50' : ''}`} dir="rtl" />
                    </div>)}
                </div>
              </section>
          </div>
        </div>
      </div>
    </>;
}