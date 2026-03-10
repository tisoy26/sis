import { Head, useForm, usePage } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

type Props = {
    student: {
        id: number;
        student_id: string;
        full_name: string;
    };
    signature: string;
    expires: string;
};

export default function StudentSetup() {
    const { student, signature, expires } = usePage<Props>().props;

    const form = useForm({
        username: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/student-setup/${student.id}?signature=${signature}&expires=${expires}`);
    };

    return (
        <AuthLayout
            title="Set Up Your Account"
            description="Create your username and password for the student portal"
        >
            <Head title="Set Up Account" />

            <div className="mb-6 rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Setting up account for:</p>
                <p className="font-semibold">{student.full_name}</p>
                <p className="text-sm text-muted-foreground">Student ID: {student.student_id}</p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-6">
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            value={form.data.username}
                            onChange={(e) => form.setData('username', e.target.value)}
                            required
                            autoFocus
                            placeholder="Choose a username"
                        />
                        <InputError message={form.errors.username} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            required
                            placeholder="Minimum 8 characters"
                        />
                        <InputError message={form.errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">Confirm Password</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={form.data.password_confirmation}
                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                            required
                            placeholder="Re-enter your password"
                        />
                    </div>

                    <Button
                        type="submit"
                        className="mt-4 w-full"
                        disabled={form.processing}
                    >
                        {form.processing && <Spinner />}
                        Create Account
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
