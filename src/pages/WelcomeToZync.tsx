import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, LayoutDashboard } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { markWelcomeComplete } from '@/lib/postLoginRedirect';

/**
 * First-time user landing (after OAuth / sign-up). Shown when account is new and welcome not completed.
 */
const WelcomeToZync = () => {
    const navigate = useNavigate();

    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            if (!u) {
                navigate('/login', { replace: true });
            }
        });
    }, [navigate]);

    const goDashboard = () => {
        const u = auth.currentUser;
        if (u) {
            markWelcomeComplete(u.uid);
        }
        navigate('/dashboard', { replace: true });
    };

    const goCreateProject = () => {
        const u = auth.currentUser;
        if (u) {
            markWelcomeComplete(u.uid);
        }
        navigate('/new-project', { replace: true });
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="max-w-lg w-full text-center space-y-8 animate-fade-in">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
                    <Sparkles className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to Zync</h1>
                    <p className="text-muted-foreground text-lg">
                        Let&apos;s turn your idea into a fully planned software project — or explore the dashboard when
                        you&apos;re ready.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" className="gap-2" onClick={goCreateProject}>
                        Create your first project
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2" onClick={goDashboard}>
                        <LayoutDashboard className="h-4 w-4" />
                        Go to dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeToZync;
