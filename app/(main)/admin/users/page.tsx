"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminUser } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    isActive: boolean;
  }>({ open: false, userId: "", userName: "", isActive: false });

  useEffect(() => {
    if (user?.is_admin) {
      // Reset to page 1 when search changes
      if (debouncedSearch !== search && page !== 1) {
        setPage(1);
        return;
      }
      loadUsers();
    }
  }, [user, page, debouncedSearch]);

  const loadUsers = async () => {
    if (!user?.is_admin) return;
    setLoading(true);
    try {
      const response = await adminApi.getUsers(
        user.id,
        page,
        10,
        undefined,
        undefined,
        debouncedSearch || undefined
      );
      setUsers(response.users || []);
      setTotalUsers(response.total || 0);
    } catch (error: any) {
      toast.error(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatusClick = (userId: string, userName: string, isActive: boolean) => {
    // Only show confirmation for deactivation
    if (!isActive) {
      setConfirmDialog({ open: true, userId, userName, isActive });
    } else {
      // Activate immediately without confirmation
      handleToggleStatus(userId, true);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    if (!user?.is_admin) return;

    try {
      await adminApi.toggleUserStatus(user.id, userId, { is_active: isActive });
      toast.success(`User ${isActive ? "activated" : "deactivated"} successfully`);
      setConfirmDialog({ open: false, userId: "", userName: "", isActive: false });
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
    }
  };

  if (!user?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:max-w-sm"
            />
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {debouncedSearch ? (
                        <div className="space-y-2">
                          <p>No users match your search "{debouncedSearch}"</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSearch("");
                              setPage(1);
                            }}
                          >
                            Clear Search
                          </Button>
                        </div>
                      ) : (
                        "No users found"
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email_id}</TableCell>
                    <TableCell>{u.country?.name || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          u.is_active
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.is_admin ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatusClick(u.id, u.name, u.is_active)}
                          aria-label={u.is_active ? `Deactivate user ${u.name}` : `Activate user ${u.name}`}
                          className="min-h-[44px]"
                        >
                          {u.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {!loading && users.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(totalUsers / 10) || 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="min-h-[44px]"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 10 >= totalUsers}
                  className="min-h-[44px]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{confirmDialog.userName}</strong>? 
              They will not be able to access the system until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleToggleStatus(confirmDialog.userId, false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

