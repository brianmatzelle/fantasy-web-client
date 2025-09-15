'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AdminPanel() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async (page = 1, searchTerm = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        fetchUsers(pagination?.page || 1, search);
      } else {
        const data = await response.json();
        console.error('Failed to update user role:', data.error);
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [status, session]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (session?.user?.role === 'admin') {
        fetchUsers(1, search);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1014]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#697565] to-[#697565]/70 flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-2xl">⚙️</span>
          </div>
          <p className="text-[#C4B8A8]/80">Loading...</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1014]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
            <span className="text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-[#ECDFCC]">Access Denied</h1>
          <p className="text-[#C4B8A8]/80">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1014] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#ECDFCC] mb-2">Admin Panel</h1>
          <p className="text-[#C4B8A8]/80">Manage users and system settings</p>
        </div>

        <div className="bg-[#1A1C20] rounded-2xl border border-[#1A1C20]/50 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#ECDFCC] mb-4">User Management</h2>
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md bg-[#0F1014] border-[#1A1C20]/50 text-[#ECDFCC]"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#697565] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[#C4B8A8]/80">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A1C20]/50">
                      <th className="text-left py-3 px-4 font-medium text-[#ECDFCC]">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ECDFCC]">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ECDFCC]">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ECDFCC]">Created</th>
                      <th className="text-left py-3 px-4 font-medium text-[#ECDFCC]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-[#1A1C20]/30">
                        <td className="py-3 px-4 text-[#ECDFCC]">{user.name}</td>
                        <td className="py-3 px-4 text-[#C4B8A8]/80">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-red-500/10 text-red-400' 
                              : user.role === 'premium'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#C4B8A8]/80">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {user.role !== 'admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRole(user.id, 'admin')}
                                disabled={updating === user.id}
                                className="text-xs"
                              >
                                Make Admin
                              </Button>
                            )}
                            {user.role !== 'premium' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRole(user.id, 'premium')}
                                disabled={updating === user.id}
                                className="text-xs"
                              >
                                Make Premium
                              </Button>
                            )}
                            {user.role !== 'user' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRole(user.id, 'user')}
                                disabled={updating === user.id}
                                className="text-xs"
                              >
                                Make User
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={page === pagination.page ? "default" : "outline"}
                      onClick={() => fetchUsers(page, search)}
                      className="w-10 h-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
