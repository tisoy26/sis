import { Link, router, usePage } from '@inertiajs/react';
import { Bot, ChevronDown, GraduationCap, LogOut, Send } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import FlashAlerts from '@/components/flash-alerts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/sonner';
import { useInitials } from '@/hooks/use-initials';
import type { User } from '@/types';

interface ChatMessage {
    id: number;
    role: 'user' | 'bot';
    text: string;
    time: string;
}

const WELCOME_MESSAGE: ChatMessage = {
    id: 0,
    role: 'bot',
    text: "Hi! 👋 I'm GOJAI Assistant. How can I help you today? You can ask me about your schedule, grades, subjects, or school announcements.",
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
};

interface StudentLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function StudentLayout({ children, title }: StudentLayoutProps) {
    const { auth, systemSettings } = usePage<{
        auth: { user: User };
        systemSettings: { system_name: string; system_logo: string | null };
    }>().props;
    const user = auth.user;
    const getInitials = useInitials();

    // Chat state
    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = () => {
        const text = input.trim();
        if (!text) return;

        const now = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const userMsg: ChatMessage = { id: Date.now(), role: 'user', text, time: now };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');

        // Simulate bot reply
        setTimeout(() => {
            const botMsg: ChatMessage = {
                id: Date.now() + 1,
                role: 'bot',
                text: "Thanks for your message! This feature is coming soon. I'll be able to help you with your school-related questions.",
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, botMsg]);
            setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
        }, 800);

        setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-muted/40">
            {/* Top navbar — full width, no sidebar */}
            <header className="fixed top-0 right-0 left-0 z-40 flex h-[60px] items-center gap-4 border-b bg-background px-4 lg:px-6">
                {/* Logo + system name */}
                <Link href="/student/dashboard" className="flex items-center gap-2">
                    {systemSettings.system_logo ? (
                        <img
                            src={`/storage/${systemSettings.system_logo}`}
                            alt="Logo"
                            className="size-7 shrink-0 rounded object-contain"
                        />
                    ) : (
                        <AppLogoIcon className="size-7 shrink-0 fill-current" />
                    )}
                    <span className="hidden text-base font-bold sm:inline-block">
                        {systemSettings.system_name}
                    </span>
                </Link>

                <div className="flex-1" />

                {/* Chatbot */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" className="relative gap-1.5 rounded-full px-3">
                            <Bot className="size-5" />
                            <span className="hidden text-sm font-medium sm:inline">AI Assistant</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex w-full flex-col p-0 sm:max-w-md">
                        <SheetHeader className="border-b px-4 py-3">
                            <SheetTitle className="flex items-center gap-2 text-base">
                                <div className="flex size-8 items-center justify-center rounded-full bg-primary">
                                    <Bot className="size-4 text-primary-foreground" />
                                </div>
                                GOJAI Assistant
                            </SheetTitle>
                        </SheetHeader>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                                            msg.role === 'user'
                                                ? 'rounded-br-md bg-primary text-primary-foreground'
                                                : 'rounded-bl-md bg-muted'
                                        }`}
                                    >
                                        <p className="whitespace-pre-line">{msg.text}</p>
                                        <p
                                            className={`mt-1 text-[10px] ${
                                                msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                                            }`}
                                        >
                                            {msg.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input bar */}
                        <div className="border-t p-3">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1"
                                />
                                <Button type="submit" size="icon" disabled={!input.trim()}>
                                    <Send className="size-4" />
                                </Button>
                            </form>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="relative flex h-8 items-center gap-2 rounded-full px-2"
                        >
                            <Avatar className="size-8">
                                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                                    {getInitials(user.full_name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="hidden text-sm font-medium md:inline-block">
                                {user.full_name}
                            </span>
                            <ChevronDown className="hidden size-4 text-muted-foreground md:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                            <LogOut className="mr-2 size-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* Main content — full width */}
            <main className="min-h-screen pt-[60px] pb-[60px]">
                <div className="p-4 md:p-6">{children}</div>
            </main>

            {/* Footer — full width */}
            <footer className="fixed bottom-0 right-0 left-0 z-30 border-t bg-background px-4 py-3 text-xs text-muted-foreground lg:px-6">
                &copy; {new Date().getFullYear()} GOJAI School Information System. All rights reserved.
            </footer>

            <FlashAlerts />
            <Toaster position="top-right" richColors closeButton />
        </div>
    );
}
