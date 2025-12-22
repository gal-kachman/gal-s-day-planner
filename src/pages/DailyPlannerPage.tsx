import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Droplets, Circle, CheckCircle2 } from 'lucide-react';
import botanicalCorner from '@/assets/botanical-corner.png';
import botanicalFooter from '@/assets/botanical-footer.png';

const timeSlots = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
];

interface ScheduleEntry {
  time: string;
  content: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function DailyPlannerPage() {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(
    timeSlots.map(time => ({ time, content: '' }))
  );
  const [duties, setDuties] = useState<string[]>(Array(8).fill(''));
  const [workTasks, setWorkTasks] = useState<Task[]>(
    Array(7).fill(null).map((_, i) => ({ id: `task-${i}`, text: '', completed: false }))
  );
  const [notes, setNotes] = useState('');
  const [waterCount, setWaterCount] = useState(0);
  const [meals, setMeals] = useState({ breakfast: '', lunch: '', dinner: '' });
  const [exercise, setExercise] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const updateSchedule = (index: number, content: string) => {
    setSchedule(prev => prev.map((entry, i) => 
      i === index ? { ...entry, content } : entry
    ));
  };

  const updateDuty = (index: number, value: string) => {
    setDuties(prev => prev.map((duty, i) => i === index ? value : duty));
  };

  const updateWorkTask = (id: string, updates: Partial<Task>) => {
    setWorkTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  return (
    <>
      <Helmet>
        <title>תכנון יומי | אטלס</title>
        <meta name="description" content="תכנן את היום שלך עם אטלס - ראש המטה האישי שלך" />
      </Helmet>

      <div className="min-h-screen bg-background paper-texture" dir="rtl">
        {/* Navigation */}
        <nav className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              <span className="text-sm">חזרה לדף הראשי</span>
            </Link>
            <span className="font-serif text-lg text-foreground">אטלס</span>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8 relative">
            {/* Decorative corners */}
            <img 
              src={botanicalCorner} 
              alt="" 
              className="absolute -top-4 -right-4 w-32 h-32 opacity-20 pointer-events-none"
            />
            <img 
              src={botanicalCorner} 
              alt="" 
              className="absolute -top-4 -left-4 w-32 h-32 opacity-20 pointer-events-none scale-x-[-1]"
            />
            
            <h1 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-2">
              תכנית היום
            </h1>
            <p className="text-muted-foreground font-serif text-lg">
              {formattedDate}
            </p>
          </header>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Schedule */}
            <div className="space-y-6">
              {/* Time Schedule */}
              <section className="card-botanical p-5">
                <h2 className="font-serif text-xl font-medium text-foreground mb-4 border-b border-border/50 pb-2">
                  לוח הזמנים של מחר
                </h2>
                <div className="space-y-1 max-h-[500px] overflow-y-auto scrollbar-thin">
                  {schedule.map((entry, index) => (
                    <div 
                      key={entry.time}
                      className="flex items-center gap-3 group"
                    >
                      <span className="text-xs text-muted-foreground w-12 font-mono">
                        {entry.time}
                      </span>
                      <input
                        type="text"
                        value={entry.content}
                        onChange={(e) => updateSchedule(index, e.target.value)}
                        placeholder="..."
                        className="flex-1 bg-transparent border-b border-border/30 focus:border-foreground/50 
                                   py-1 text-sm text-foreground placeholder:text-muted-foreground/40
                                   focus:outline-none transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Notes */}
              <section className="card-botanical p-5">
                <h2 className="font-serif text-xl font-medium text-foreground mb-4 border-b border-border/50 pb-2">
                  הערות
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="רשום הערות כאן..."
                  className="w-full h-32 bg-transparent border border-border/30 rounded-md p-3
                             text-sm text-foreground placeholder:text-muted-foreground/50
                             focus:outline-none focus:border-foreground/50 resize-none"
                />
              </section>
            </div>

            {/* Right Column - Tasks & Wellness */}
            <div className="space-y-6">
              {/* Duties */}
              <section className="card-botanical p-5">
                <h2 className="font-serif text-xl font-medium text-foreground mb-4 border-b border-border/50 pb-2">
                  חובות
                </h2>
                <div className="space-y-2">
                  {duties.map((duty, index) => (
                    <input
                      key={index}
                      type="text"
                      value={duty}
                      onChange={(e) => updateDuty(index, e.target.value)}
                      placeholder="..."
                      className="w-full bg-transparent border-b border-border/30 focus:border-foreground/50 
                                 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/40
                                 focus:outline-none transition-colors"
                    />
                  ))}
                </div>
              </section>

              {/* Work Tasks */}
              <section className="card-botanical p-5">
                <h2 className="font-serif text-xl font-medium text-foreground mb-4 border-b border-border/50 pb-2">
                  משימות לעבודה
                </h2>
                <div className="space-y-2">
                  {workTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <button
                        onClick={() => updateWorkTask(task.id, { completed: !task.completed })}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-botanical-green" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={task.text}
                        onChange={(e) => updateWorkTask(task.id, { text: e.target.value })}
                        placeholder="..."
                        className={`flex-1 bg-transparent border-b border-border/30 focus:border-foreground/50 
                                   py-1 text-sm text-foreground placeholder:text-muted-foreground/40
                                   focus:outline-none transition-colors
                                   ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Wellness Tracker */}
              <section className="card-botanical p-5">
                <h2 className="font-serif text-xl font-medium text-foreground mb-4 border-b border-border/50 pb-2">
                  מעקב בריאות
                </h2>

                {/* Water tracker */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-foreground">מים</span>
                  </div>
                  <div className="flex gap-2">
                    {Array(8).fill(null).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setWaterCount(i + 1 === waterCount ? i : i + 1)}
                        className={`w-7 h-7 rounded-full border-2 transition-colors
                          ${i < waterCount 
                            ? 'bg-blue-400 border-blue-400' 
                            : 'border-border hover:border-blue-300'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Meals */}
                <div className="space-y-3">
                  {[
                    { key: 'breakfast', label: 'ארוחת בוקר' },
                    { key: 'lunch', label: 'ארוחת צהריים' },
                    { key: 'dinner', label: 'ארוחת ערב' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-foreground block mb-1">
                        {label}
                      </label>
                      <input
                        type="text"
                        value={meals[key as keyof typeof meals]}
                        onChange={(e) => setMeals(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="..."
                        className="w-full bg-transparent border-b border-border/30 focus:border-foreground/50 
                                   py-1 text-sm text-foreground placeholder:text-muted-foreground/40
                                   focus:outline-none transition-colors"
                      />
                    </div>
                  ))}

                  {/* Exercise */}
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      פעילות גופנית
                    </label>
                    <input
                      type="text"
                      value={exercise}
                      onChange={(e) => setExercise(e.target.value)}
                      placeholder="..."
                      className="w-full bg-transparent border-b border-border/30 focus:border-foreground/50 
                                 py-1 text-sm text-foreground placeholder:text-muted-foreground/40
                                 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer decoration */}
          <div className="mt-12 flex justify-center opacity-20">
            <img src={botanicalFooter} alt="" className="h-16" />
          </div>
        </main>
      </div>
    </>
  );
}
