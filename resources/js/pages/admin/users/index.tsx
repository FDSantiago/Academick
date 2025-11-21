import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

import { Badge } from "@/components/ui/badge"
import CreateUserForm from '@/components/admin/user-management/create-user-form';
import EditUserForm from '@/components/admin/user-management/edit-user-form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircleIcon, CheckCircle2Icon, Plus, Edit, Trash2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Table components
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin',
        href: '',
    },
    {
        title: 'User Management',
        href: '/admin/users',
    },
];

type User = {
    id: number;
    name: string;
    email: string;
    role_name?: string;
};

export default function AdminUsers() {
    const [apiMessage, setApiMessage] = useState<null | {
        type: 'success' | 'error';
        text: string;
    }>(null);
    
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Fetch users
    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.get('/api/admin/users');
            
            if (res.status === 200) {
                setUsers(res.data);
            }
        } catch (err: any) {
            setApiMessage({
                type: 'error',
                text: err?.message ?? 'Failed to fetch users',
            });
        } finally {
            setLoading(false);
        }
    }

    function handleSuccess(payload: any) {
        setApiMessage({
            type: 'success',
            text: payload?.message ?? 'Operation completed successfully.',
        });
        
        // Close dialogs
        setIsEditDialogOpen(false);
        setIsDeleteDialogOpen(false);
        
        // Refresh users
        fetchUsers();
    }

    function handleError(err: any) {
        const text =
            err?.message ??
            (err?.error
                ? String(err.error)
                : 'Operation failed. Please try again.');
        setApiMessage({ type: 'error', text });
    }

    function handleEdit(user: User) {
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    }

    function handleDelete(user: User) {
        setSelectedUser(user);
        setIsDeleteDialogOpen(true);
    }

    async function confirmDelete() {
        if (!selectedUser) return;
        
        try {
            await axios.get('/sanctum/csrf-cookie');
            const res = await axios.delete(`/api/admin/users/${selectedUser.id}`);
            
            if (res.status === 200) {
                handleSuccess(res.data);
            } else {
                handleError(res.data);
            }
        } catch (err: any) {
            handleError({ message: err?.message ?? 'Network error' });
        }
    }

    return (
        <>
            <Head title="User Management" />
            <AppLayout {...{ breadcrumbs }}>
                <div className="space-y-6 p-4">
                    {/* API Message */}
                    {apiMessage && (
                        <Alert variant={apiMessage.type === 'success' ? 'default' : 'destructive'}>
                            {apiMessage.type === 'success' ? <CheckCircle2Icon /> : <AlertCircleIcon />}
                            <AlertDescription>
                                {apiMessage.text}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {/* Create User Dialog */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus />
                                Create User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create User</DialogTitle>
                                <DialogDescription>
                                    Fill out the form below to create a new user.
                                </DialogDescription>
                            </DialogHeader>

                            <CreateUserForm
                                onSuccess={handleSuccess}
                                onError={handleError}
                            />
                        </DialogContent>
                    </Dialog>
                    
                    {/* Users Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            Loading users...
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="default">
                                                    {user.role_name ? user.role_name.charAt(0).toUpperCase() + user.role_name.slice(1).replaceAll('_', ' ') : 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(user)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    {/* Edit User Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                    Update the user details below.
                                </DialogDescription>
                            </DialogHeader>

                            {selectedUser && (
                                <EditUserForm
                                    user={selectedUser}
                                    onSuccess={handleSuccess}
                                    onError={handleError}
                                    onCancel={() => setIsEditDialogOpen(false)}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                    
                    {/* Delete User Dialog */}
                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this user? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            
                            {selectedUser && (
                                <div className="space-y-4">
                                    <div className="rounded-md border p-4">
                                        <div className="font-medium">{selectedUser.name}</div>
                                        <div className="text-sm text-gray-500">{selectedUser.email}</div>
                                    </div>
                                    
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDeleteDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={confirmDelete}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </AppLayout>
        </>
    );
}