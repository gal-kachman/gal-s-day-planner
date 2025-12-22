import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import plannerBg from '@/assets/planner-bg-minimal.jpeg';

const timeSlots = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00', '21:00', '22:00'
];

export default function DailyPlannerPage() {
  const [schedule, setSchedule] = useState<string[]>(Array(timeSlots.length).fill(''));
  const [duties, setDuties] = useState<string[]>(Array(6).fill(''));
  const [workTasks, setWorkTasks] = useState<{ text: string; done: boolean }[]>(
    Array(6).fill(null).map(() => ({ text: '', done: false }))
  );
  const [notes, setNotes] = useState('');
  const [water, setWater] = useState<boolean[]>(Array(8).fill(false));
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [dinner, setDinner] = useState('');
  const [exercise, setExercise] = useState('');

  return (
    <>
      <Helmet>
        <title>תכנון יומי | אטלס</title>
        <meta name="description" content="תכנן את היום שלך עם אטלס" />
      </Helmet>

      <div 
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center p-6"
        style={{ backgroundImage: `url(${plannerBg})` }}
      >
        <div className="w-full max-w-4xl p-8 md:p-12">
          {/* Header */}
          <h1 className="text-2xl font-serif text-stone-800 text-center mb-8 tracking-wide">
            תכנון יומי
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Schedule */}
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  לוח זמנים
                </h2>
                <div className="space-y-1">
                  {timeSlots.map((time, i) => (
                    <div key={i} className="flex items-center gap-3 group">
                      <span className="text-xs text-stone-400 w-10 font-mono">{time}</span>
                      <input
                        type="text"
                        value={schedule[i]}
                        onChange={(e) => {
                          const newSchedule = [...schedule];
                          newSchedule[i] = e.target.value;
                          setSchedule(newSchedule);
                        }}
                        className="flex-1 bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-700 py-1 transition-colors"
                        dir="rtl"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Notes */}
              <section>
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  הערות
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-24 bg-transparent border border-stone-200 focus:border-stone-400 outline-none resize-none text-sm text-stone-700 p-3 rounded transition-colors"
                  dir="rtl"
                />
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Duties */}
              <section>
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  חובות
                </h2>
                <div className="space-y-1">
                  {duties.map((duty, i) => (
                    <input
                      key={i}
                      type="text"
                      value={duty}
                      onChange={(e) => {
                        const newDuties = [...duties];
                        newDuties[i] = e.target.value;
                        setDuties(newDuties);
                      }}
                      className="w-full bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-700 py-1 transition-colors"
                      dir="rtl"
                    />
                  ))}
                </div>
              </section>

              {/* Work Tasks */}
              <section>
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  משימות לעבודה
                </h2>
                <div className="space-y-1">
                  {workTasks.map((task, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newTasks = [...workTasks];
                          newTasks[i] = { ...newTasks[i], done: !newTasks[i].done };
                          setWorkTasks(newTasks);
                        }}
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                          task.done ? 'bg-stone-600 border-stone-600' : 'border-stone-300'
                        }`}
                      />
                      <input
                        type="text"
                        value={task.text}
                        onChange={(e) => {
                          const newTasks = [...workTasks];
                          newTasks[i] = { ...newTasks[i], text: e.target.value };
                          setWorkTasks(newTasks);
                        }}
                        className={`flex-1 bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-700 py-1 transition-colors ${
                          task.done ? 'line-through opacity-50' : ''
                        }`}
                        dir="rtl"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Wellness */}
              <section>
                <h2 className="text-sm font-medium text-stone-600 mb-3 tracking-wider uppercase">
                  בריאות
                </h2>
                
                {/* Water */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-stone-500 w-12">מים</span>
                  <div className="flex gap-1.5">
                    {water.map((filled, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const newWater = [...water];
                          newWater[i] = !newWater[i];
                          setWater(newWater);
                        }}
                        className={`w-5 h-5 rounded-full border-2 transition-colors ${
                          filled ? 'bg-sky-400 border-sky-400' : 'border-stone-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 w-12">בוקר</span>
                    <input
                      type="text"
                      value={breakfast}
                      onChange={(e) => setBreakfast(e.target.value)}
                      className="flex-1 bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-700 py-1 transition-colors"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 w-12">צהריים</span>
                    <input
                      type="text"
                      value={lunch}
                      onChange={(e) => setLunch(e.target.value)}
                      className="flex-1 bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-700 py-1 transition-colors"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 w-12">ערב</span>
                    <input
                      type="text"
                      value={dinner}
                      onChange={(e) => setDinner(e.target.value)}
                      className="flex-1 bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-700 py-1 transition-colors"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 w-12">פעילות</span>
                    <input
                      type="text"
                      value={exercise}
                      onChange={(e) => setExercise(e.target.value)}
                      className="flex-1 bg-transparent border-b border-stone-200 focus:border-stone-400 outline-none text-sm text-stone-700 py-1 transition-colors"
                      dir="rtl"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
