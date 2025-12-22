import { Helmet } from 'react-helmet-async';
import plannerBg from '@/assets/planner-background.jpeg';

export default function DailyPlannerPage() {
  return (
    <>
      <Helmet>
        <title>תכנון יומי | אטלס</title>
        <meta name="description" content="תכנן את היום שלך עם אטלס" />
      </Helmet>

      <div 
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${plannerBg})` }}
      />
    </>
  );
}
