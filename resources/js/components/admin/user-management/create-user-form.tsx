import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import React from 'react';

type Props = {
    onSuccess?: (payload: any) => void;
    onError?: (error: any) => void;
};

export default function CreateUserForm({ onSuccess, onError }: Props) {
    const page = usePage();
    const availableRoles = (page.props as any).roles ?? [];
    const firstRoleValue = availableRoles[0]?.value ?? '';

    const form = useForm<{
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
        role: string;
    }>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: firstRoleValue,
    });

    async function submit(e: React.FormEvent) {
        e.preventDefault();

        // Reset previous non-field error
        onError?.(null);

        try {
            // Ensure Sanctum CSRF cookie is present then call the API endpoint
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.post('/api/admin/users', form.data);

            const json = res.data;

            if (res.status === 201) {
                form.reset();
                onSuccess?.(json);
                return;
            }

            if (res.status === 422 && json.errors) {
                // validation errors — map and set each field error on the Inertia form
                Object.entries(json.errors).forEach(([field, msgs]) => {
                    const message = Array.isArray(msgs)
                        ? msgs.join(' ')
                        : String(msgs);
                    // set single field error (use setError per Inertia types)
                    // @ts-ignore - setError exists at runtime even if TS types differ
                    form.setError(field as any, message);
                });
                onError?.(json);
                return;
            }

            // other errors
            onError?.(json || { message: 'Failed to create user' });
        } catch (err: any) {
            // onError?.({ message: err?.message ?? 'Network error' });
        }
    }

    return (
        <form onSubmit={submit} className="mt-4 space-y-4">
            <div className="flex flex-col gap-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                />
                {form.errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.name}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={form.data.email}
                    onChange={(e) => form.setData('email', e.target.value)}
                />
                {form.errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.email}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                    defaultValue={form.data.role || undefined}
                    onValueChange={(v) => form.setData('role', v)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableRoles.map((r: any) => (
                            <SelectItem key={r.value} value={r.value}>
                                {r.label ?? r.value}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.errors.role && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.role}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="P4ssw0rd!"
                    value={form.data.password}
                    onChange={(e) => form.setData('password', e.target.value)}
                />
                {form.errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.password}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-y-2">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="P4ssw0rd!"
                    value={form.data.password_confirmation}
                    onChange={(e) =>
                        form.setData('password_confirmation', e.target.value)
                    }
                />
                {form.errors.password_confirmation && (
                    <p className="mt-1 text-sm text-red-600">
                        {form.errors.password_confirmation}
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-2">
                <Button type="submit" disabled={form.processing}>
                    Create
                </Button>
            </div>
        </form>
    );
}
