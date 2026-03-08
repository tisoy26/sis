import { Head, router, usePage } from '@inertiajs/react';
import { ImagePlus, Loader2, Save, Trash2 } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { User } from '@/types';

type PageProps = {
    auth: { user: User };
    settings: {
        system_name: string;
        system_logo: string | null;
        login_background: string | null;
    };
};

export default function AdminSettingsIndex() {
    const { auth, settings } = usePage<PageProps>().props;
    const user = auth.user;

    const [systemName, setSystemName] = useState(settings.system_name);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        settings.system_logo ? `/storage/${settings.system_logo}` : null,
    );
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);

    const [bgPreview, setBgPreview] = useState<string | null>(
        settings.login_background ? `/storage/${settings.login_background}` : null,
    );
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [removeBg, setRemoveBg] = useState(false);

    const [processing, setProcessing] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const bgInputRef = useRef<HTMLInputElement>(null);

    const handleFilePreview = (
        e: ChangeEvent<HTMLInputElement>,
        setFile: (f: File | null) => void,
        setPreview: (p: string | null) => void,
        setRemove: (r: boolean) => void,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);
        setRemove(false);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveFile = (
        setFile: (f: File | null) => void,
        setPreview: (p: string | null) => void,
        setRemove: (r: boolean) => void,
        inputRef: React.RefObject<HTMLInputElement | null>,
    ) => {
        setFile(null);
        setPreview(null);
        setRemove(true);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData();
        formData.append('system_name', systemName);
        formData.append('_method', 'PUT');

        if (logoFile) formData.append('system_logo', logoFile);
        if (removeLogo) formData.append('remove_logo', '1');

        if (bgFile) formData.append('login_background', bgFile);
        if (removeBg) formData.append('remove_login_background', '1');

        router.post('/admin/settings', formData, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <AppLayout
            title="System Settings"
            breadcrumbs={[
                { label: 'Home', href: `/${user.type}/dashboard` },
                { label: 'Settings' },
            ]}
        >
            <Head title="System Settings" />

            <div className="mx-auto max-w-2xl space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Settings Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>
                                Configure the system name and logo that appear across the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* System Name */}
                            <div className="space-y-2">
                                <Label htmlFor="system_name">System Name</Label>
                                <Input
                                    id="system_name"
                                    value={systemName}
                                    onChange={(e) => setSystemName(e.target.value)}
                                    placeholder="Enter system name..."
                                    maxLength={100}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    This name is displayed in the sidebar, login page, and PDF reports.
                                </p>
                            </div>

                            {/* System Logo */}
                            <div className="space-y-2">
                                <Label>System Logo</Label>
                                <div className="flex items-start gap-4">
                                    <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                                        {logoPreview ? (
                                            <img
                                                src={logoPreview}
                                                alt="Logo preview"
                                                className="size-20 rounded object-contain"
                                            />
                                        ) : (
                                            <ImagePlus className="size-8 text-muted-foreground/50" />
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2">
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                            onChange={(e) => handleFilePreview(e, setLogoFile, setLogoPreview, setRemoveLogo)}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-fit"
                                            onClick={() => logoInputRef.current?.click()}
                                        >
                                            <ImagePlus className="mr-2 size-4" />
                                            {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                        </Button>
                                        {logoPreview && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-fit text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveFile(setLogoFile, setLogoPreview, setRemoveLogo, logoInputRef)}
                                            >
                                                <Trash2 className="mr-2 size-4" />
                                                Remove Logo
                                            </Button>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            PNG, JPG, SVG or WebP. Max 2MB. Recommended: 128×128px.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Login Page Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Login Page</CardTitle>
                            <CardDescription>
                                Customize the background image shown on the login page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Background Image</Label>
                                <div className="flex items-start gap-4">
                                    <div className="flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                                        {bgPreview ? (
                                            <img
                                                src={bgPreview}
                                                alt="Background preview"
                                                className="h-full w-full rounded object-cover"
                                            />
                                        ) : (
                                            <ImagePlus className="size-8 text-muted-foreground/50" />
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2">
                                        <input
                                            ref={bgInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={(e) => handleFilePreview(e, setBgFile, setBgPreview, setRemoveBg)}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-fit"
                                            onClick={() => bgInputRef.current?.click()}
                                        >
                                            <ImagePlus className="mr-2 size-4" />
                                            {bgPreview ? 'Change Image' : 'Upload Image'}
                                        </Button>
                                        {bgPreview && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-fit text-destructive hover:text-destructive"
                                                onClick={() => handleRemoveFile(setBgFile, setBgPreview, setRemoveBg, bgInputRef)}
                                            >
                                                <Trash2 className="mr-2 size-4" />
                                                Remove Image
                                            </Button>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            PNG, JPG or WebP. Max 5MB. Recommended: 1920×1080px.
                                        </p>
                                        {!bgPreview && (
                                            <p className="text-xs text-muted-foreground italic">
                                                Falls back to the default background if none is set.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing || !systemName.trim()}>
                            {processing ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 size-4" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
