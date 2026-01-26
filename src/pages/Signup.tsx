import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/dashboard`,
                },
            });

            if (error) throw error;

            // Ideally show a verification message here, but for MVP we might auto-login 
            // or just redirect to login if email confirmation is required.
            // Supabase default is "confirm email", so let's tell them to check email.
            alert('Check your email for the confirmation link!');
            navigate('/login');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-noise relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[100px] animate-pulse-glow" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-full max-w-md z-10"
            >
                <Card className="border-white/10 bg-surface/60 backdrop-blur-xl shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 bg-secondary/10 w-12 h-12 rounded-2xl flex items-center justify-center">
                            <span className="text-2xl">✨</span>
                        </div>
                        <CardTitle className="text-2xl font-bold font-display bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                            Create an account
                        </CardTitle>
                        <CardDescription>
                            Enter your email below to create your account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignup}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-background/50 border-white/10 rounded-xl focus:ring-secondary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-background/50 border-white/10 rounded-xl focus:ring-secondary/50"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button className="w-full font-bold h-11 rounded-xl shadow-lg shadow-secondary/20 bg-secondary hover:bg-secondary/90 text-white" type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Up
                            </Button>
                            <div className="text-center text-sm text-muted">
                                Already have an account?{' '}
                                <Link to="/login" className="font-semibold text-primary hover:underline">
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
}
