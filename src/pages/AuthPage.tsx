import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import botanicalCorner from '@/assets/botanical-corner.png';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background paper-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign In | Chief of Staff</title>
        <meta name="description" content="Sign in to Chief of Staff to connect your Google Calendar and Sheets for AI-powered daily planning." />
      </Helmet>

      <div className="min-h-screen bg-background paper-texture flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Botanical decorations */}
        <img
          src={botanicalCorner}
          alt=""
          className="absolute top-0 left-0 w-48 opacity-20 pointer-events-none"
        />
        <img
          src={botanicalCorner}
          alt=""
          className="absolute bottom-0 right-0 w-48 opacity-20 pointer-events-none rotate-180"
        />

        <div className="w-full max-w-md animate-fade-in">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-serif-display text-4xl md:text-5xl font-light text-foreground mb-3 tracking-wide">
              Chief of Staff
            </h1>
            <p className="text-muted-foreground font-sans text-base">
              Your AI-powered daily planning companion
            </p>
          </div>

          {/* Card */}
          <div className="card-botanical p-8 md:p-10">
            <div className="text-center mb-8">
              <h2 className="font-serif-display text-2xl font-normal text-foreground mb-2">
                Welcome, Gal
              </h2>
              <p className="text-muted-foreground text-sm font-sans">
                Connect your Google account to sync your calendar and tasks
              </p>
            </div>

            <Button
              onClick={handleGoogleSignIn}
              className="w-full h-12 text-base font-sans bg-foreground text-background hover:bg-foreground/90 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-6 font-sans leading-relaxed">
              We'll request access to your Google Calendar (read-only) and Google Sheets to sync your tasks and events.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground mt-8 font-serif-display italic">
            "East wind melts the ice"
          </p>
        </div>
      </div>
    </>
  );
}
