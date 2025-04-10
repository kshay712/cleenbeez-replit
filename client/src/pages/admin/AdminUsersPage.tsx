import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  Edit,
  Trash2,
  Search,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  User as UserIcon,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const AdminUsersPage = () => {
  const { isAdmin, user: currentUser } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // State for dialog controls, filters and sorting
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: '', 
    direction: null
  });

  // Define user type to match expected API response
  interface UserData {
    id: number;
    username: string;
    email: string;
    role: string;
    createdAt: string;
    lastLogin: string | null;
    firebaseUid?: string;
  }
  
  // Fetch users data
  const { data: users = [], isLoading, refetch } = useQuery<UserData[]>({
    queryKey: ['/api/users', searchQuery, roleFilter],
    staleTime: 0, // Always refetch to get latest users
    refetchOnMount: true, // Force refetch when component mounts
    gcTime: 0, // Don't cache the data (modern replacement for cacheTime)
  });
  
  // Refetch on component mount to ensure we have the latest data
  useEffect(() => {
    refetch();
    
    // Also set up a polling interval to refresh the data periodically
    const intervalId = setInterval(() => {
      refetch();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [refetch]);

  // Role update mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      return await apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User role updated",
        description: "The user's role has been updated successfully."
      });
      setEditUserDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      console.log(`Attempting to delete user with ID: ${userId}`);
      // Force a clean request with explicit credentials
      return await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(async (response) => {
        // Handle the response here
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error deleting user ${userId}:`, errorText);
          throw new Error(errorText || response.statusText);
        }
        return response;
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully."
      });
    },
    onError: (error: any) => {
      // Attempt to extract a more detailed error message
      let errorMessage = error.message || "Failed to delete user";
      
      // Handle special cases
      if (errorMessage.includes("Only the super admin can delete other admin")) {
        errorMessage = "Only the super admin (admin3@cleanbee.com) can delete other admin accounts. You can still delete regular user accounts.";
      } else if (errorMessage.includes("Cannot delete your own account")) {
        errorMessage = "You cannot delete your own account.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      console.error("Delete user error details:", error);
    }
  });

  // Handle user role update
  const handleRoleChange = (role: string) => {
    if (selectedUser) {
      updateUserRoleMutation.mutate({ userId: selectedUser.id, role });
    }
  };

  // Open user edit dialog
  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setEditUserDialogOpen(true);
  };

  // Filter role badge style
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case 'editor':
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      default:
        return "bg-neutral-100 text-neutral-800 hover:bg-neutral-100";
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert className="h-4 w-4 mr-1" />;
      case 'editor':
        return <Shield className="h-4 w-4 mr-1" />;
      default:
        return <UserIcon className="h-4 w-4 mr-1" />;
    }
  };

  // Handle sorting
  const handleSort = (key: string) => {
    // If clicking on the same column, toggle direction or reset
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        setSortConfig({ key, direction: 'descending' });
      } else if (sortConfig.direction === 'descending') {
        setSortConfig({ key: '', direction: null });  // Reset sorting
      } else {
        setSortConfig({ key, direction: 'ascending' });
      }
    } else {
      // New column, start with ascending
      setSortConfig({ key, direction: 'ascending' });
    }
  };

  // Get sort icon based on current sort state
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    
    if (sortConfig.direction === 'ascending') {
      return <ChevronUp className="h-4 w-4 ml-1" />;
    }
    
    if (sortConfig.direction === 'descending') {
      return <ChevronDown className="h-4 w-4 ml-1" />;
    }
    
    return <ArrowUpDown className="h-4 w-4 ml-1" />;
  };

  // Apply filters and sorting
  const filteredUsers = users.filter((user: UserData) => {
    let matches = true;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = user.username.toLowerCase().includes(query);
      const emailMatch = user.email.toLowerCase().includes(query);
      matches = nameMatch || emailMatch;
    }
    
    // Apply role filter (skip if "all" is selected)
    if (roleFilter && roleFilter !== "all" && matches) {
      matches = user.role === roleFilter;
    }
    
    return matches;
  }).sort((a: UserData, b: UserData) => {
    // If no sort config or direction is null, return original order
    if (!sortConfig.key || sortConfig.direction === null) {
      return 0;
    }
    
    // Define how to compare each field type
    let compareResult = 0;
    
    if (sortConfig.key === 'username') {
      compareResult = a.username.localeCompare(b.username);
    } else if (sortConfig.key === 'email') {
      compareResult = a.email.localeCompare(b.email);
    } else if (sortConfig.key === 'role') {
      compareResult = a.role.localeCompare(b.role);
    } else if (sortConfig.key === 'createdAt') {
      // Handle date comparison, ensuring proper conversion from string to Date if needed
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      compareResult = dateA - dateB;
    } else if (sortConfig.key === 'lastLogin') {
      // Sort lastLogin dates, treating null values as oldest (smallest timestamp)
      const dateA = a.lastLogin ? new Date(a.lastLogin).getTime() : 0;
      const dateB = b.lastLogin ? new Date(b.lastLogin).getTime() : 0;
      compareResult = dateA - dateB;
    }
    
    // Reverse the order for descending sort
    return sortConfig.direction === 'ascending' ? compareResult : -compareResult;
  });

  // Check for admin role
  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  return (
    <div className="container mx-auto py-10 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            placeholder="Search users by name or email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center">
                      Username
                      {getSortIcon('username')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {getSortIcon('email')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role
                      {getSortIcon('role')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center">
                      Joined
                      {getSortIcon('createdAt')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 transition-colors" 
                    onClick={() => handleSort('lastLogin')}
                  >
                    <div className="flex items-center">
                      Last Login
                      {getSortIcon('lastLogin')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.length > 0 ? (
                  filteredUsers.map((user: UserData) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`flex items-center w-fit ${getRoleBadgeStyle(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={user.id === currentUser?.id}
                              className="text-red-600"
                            >
                              <AlertDialog>
                                <AlertDialogTrigger className="flex items-center w-full" disabled={user.id === currentUser?.id}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete User
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the user
                                      account and remove all associated data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {deleteUserMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        "Delete"
                                      )}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      {searchQuery || roleFilter ? "No users match your search criteria." : "No users found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Role Descriptions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4 border-l-4 border-l-red-600">
                <div className="flex items-center">
                  <ShieldAlert className="h-5 w-5 text-red-600 mr-2" />
                  <span className="font-semibold">Admin</span>
                </div>
                <p className="text-sm mt-2">
                  Full access to all systems, including user management, product management,
                  and content creation.
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-blue-600">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-semibold">Editor</span>
                </div>
                <p className="text-sm mt-2">
                  Can create and edit products and blog content, but cannot manage users
                  or system settings.
                </p>
              </Card>
              <Card className="p-4 border-l-4 border-l-neutral-600">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-neutral-600 mr-2" />
                  <span className="font-semibold">User</span>
                </div>
                <p className="text-sm mt-2">
                  Regular user with standard permissions. Can browse products and read blog posts.
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
      
      {/* User Role Edit Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.username}. This will change their permissions on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="role-user"
                  name="role"
                  value="user"
                  checked={selectedUser?.role === "user"}
                  onChange={() => handleRoleChange("user")}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="role-user" className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-neutral-600" />
                  <div>
                    <span className="font-medium">User</span>
                    <p className="text-sm text-neutral-500">Standard access to the platform</p>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="role-editor"
                  name="role"
                  value="editor"
                  checked={selectedUser?.role === "editor"}
                  onChange={() => handleRoleChange("editor")}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="role-editor" className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  <div>
                    <span className="font-medium">Editor</span>
                    <p className="text-sm text-neutral-500">Can create and edit content</p>
                  </div>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="role-admin"
                  name="role"
                  value="admin"
                  checked={selectedUser?.role === "admin"}
                  onChange={() => handleRoleChange("admin")}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="role-admin" className="flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-red-600" />
                  <div>
                    <span className="font-medium">Admin</span>
                    <p className="text-sm text-neutral-500">Full access to all systems</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
