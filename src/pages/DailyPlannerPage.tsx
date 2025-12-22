import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import plannerBg from '@/assets/planner-background.jpeg';

const timeSlots = [
  '7:00 AM', '7:00 AM', '8:00 AM', '8:00 AM', '9:00 AM', '9:00 AM',
  '10:00 AM', '10:00 AM', '11:00 AM', '12:00 AM', '1:00 AM',
  '1:00 PM', '2:00 PM', '1:00 PM', '3:00 PM', '4:00 PM', '4:00 PM',
  '5:00 PM', '6:00 PM', '6:00 PM', '7:00 PM', '7:00 PM',
  '8:00 PM', '8:00 PM', '9:00 PM', '9:00 PM', '10:00 PM'
];

export default function DailyPlannerPage() {
  const [schedule, setSchedule] = useState<string[]>(Array(timeSlots.length).fill(''));
  const [duties, setDuties] = useState<string[]>(Array(10).fill(''));
  const [workTasks, setWorkTasks] = useState<{ text: string; done: boolean }[]>(
    Array(7).fill(null).map(() => ({ text: '', done: false }))
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
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
        style={{ backgroundImage: `url(${plannerBg})` }}
      >
        {/* Overlay container matching the paper layout */}
        <div className="relative w-full max-w-[850px] aspect-[0.77]">
          
          {/* TODAY'S SCHEDULE - Left column */}
          <div className="absolute" style={{ top: '10%', left: '6.5%', width: '42%', height: '55%' }}>
            <div className="space-y-0">
              {timeSlots.map((time, i) => (
                <div key={i} className="flex items-center h-[3.7%]" style={{ height: '3.7%' }}>
                  <input
                    type="text"
                    value={schedule[i]}
                    onChange={(e) => {
                      const newSchedule = [...schedule];
                      newSchedule[i] = e.target.value;
                      setSchedule(newSchedule);
                    }}
                    className="w-full bg-transparent border-none outline-none text-[11px] text-stone-700 placeholder:text-transparent"
                    style={{ marginLeft: '22%' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* NOTES - Bottom left */}
          <div className="absolute" style={{ top: '67%', left: '6.5%', width: '42%', height: '23%' }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none resize-none text-[11px] text-stone-700 leading-relaxed pt-8"
              style={{ lineHeight: '1.85' }}
            />
          </div>

          {/* חובות (Duties) - Top right */}
          <div className="absolute" style={{ top: '10%', right: '6%', width: '40%', height: '27%' }}>
            <div className="space-y-0 pt-6">
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
                  className="w-full bg-transparent border-none outline-none text-[11px] text-stone-700 h-[10%]"
                  dir="rtl"
                />
              ))}
            </div>
          </div>

          {/* משימות לעבודה (Work Tasks) - Middle right */}
          <div className="absolute" style={{ top: '38.5%', right: '6%', width: '40%', height: '18%' }}>
            <div className="space-y-0 pt-6">
              {workTasks.map((task, i) => (
                <div key={i} className="flex items-center gap-1 h-[14%]">
                  <button
                    onClick={() => {
                      const newTasks = [...workTasks];
                      newTasks[i] = { ...newTasks[i], done: !newTasks[i].done };
                      setWorkTasks(newTasks);
                    }}
                    className="w-3 h-3 rounded-full border border-stone-500 flex-shrink-0"
                    style={{ 
                      backgroundColor: task.done ? '#8B7355' : 'transparent'
                    }}
                  />
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => {
                      const newTasks = [...workTasks];
                      newTasks[i] = { ...newTasks[i], text: e.target.value };
                      setWorkTasks(newTasks);
                    }}
                    className={`flex-1 bg-transparent border-none outline-none text-[11px] text-stone-700 ${task.done ? 'line-through opacity-60' : ''}`}
                    dir="rtl"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* WATER + MEALS + EXERCISE - Bottom right */}
          <div className="absolute" style={{ top: '58%', right: '6%', width: '40%', height: '32%' }}>
            {/* WATER circles */}
            <div className="flex gap-1 pt-6 pr-1">
              {water.map((filled, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const newWater = [...water];
                    newWater[i] = !newWater[i];
                    setWater(newWater);
                  }}
                  className="w-3.5 h-3.5 rounded-full border border-stone-500"
                  style={{ backgroundColor: filled ? '#6B9EBF' : 'transparent' }}
                />
              ))}
            </div>

            {/* BREAKFAST */}
            <div className="mt-3">
              <input
                type="text"
                value={breakfast}
                onChange={(e) => setBreakfast(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[11px] text-stone-700 pt-4"
              />
            </div>

            {/* LUNCH */}
            <div className="mt-2">
              <input
                type="text"
                value={lunch}
                onChange={(e) => setLunch(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[11px] text-stone-700 pt-4"
              />
            </div>

            {/* DINNER */}
            <div className="mt-2">
              <input
                type="text"
                value={dinner}
                onChange={(e) => setDinner(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[11px] text-stone-700 pt-4"
              />
            </div>

            {/* EXERCISE */}
            <div className="mt-2">
              <input
                type="text"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[11px] text-stone-700 pt-4"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
