import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Schema for promoting a user
const promoteUserSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  role: z.enum(['admin', 'editor', 'user'], {
    required_error: 'Please select a role',
  }),
});

// Schema for creating a test user
const createUserSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['admin', 'editor', 'user'], {
    required_error: 'Please select a role',
  }),
});

type PromoteUserFormValues = z.infer<typeof promoteUserSchema>;
type CreateUserFormValues = z.infer<typeof createUserSchema>;

const AdminUtilPage = () => {
  const { toast } = useToast();
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form for promoting users
  const promoteForm = useForm<PromoteUserFormValues>({
    resolver: zodResolver(promoteUserSchema),
    defaultValues: {
      email: '',
      role: 'admin',
    },
  });

  // Form for creating test users
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      role: 'admin',
    },
  });

  // Handle promote user form submission
  const onPromoteSubmit = async (data: PromoteUserFormValues) => {
    setError(null);
    setPromoteSuccess(null);
    
    try {
      const response = await fetch('/api/admin-util/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to promote user');
      }
      
      const result = await response.json();
      setPromoteSuccess(`User ${data.email} has been promoted to ${data.role}`);
      
      toast({
        title: 'Success',
        description: `User has been promoted to ${data.role}`,
      });
      
      promoteForm.reset();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to promote user',
      });
    }
  };

  // Handle create test user form submission
  const onCreateSubmit = async (data: CreateUserFormValues) => {
    setError(null);
    setCreateSuccess(null);
    
    try {
      const response = await fetch('/api/admin-util/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create test user');
      }
      
      const result = await response.json();
      setCreateSuccess(`Test user ${data.email} (${data.role}) has been created successfully`);
      
      toast({
        title: 'Success',
        description: 'Test user has been created successfully',
      });
      
      createForm.reset();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to create test user',
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Utilities</h1>
          <p className="text-neutral-500 mt-2">
            These tools are for development purposes only. Use them to create and manage test users.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Tabs defaultValue="promote">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="promote">Promote User</TabsTrigger>
            <TabsTrigger value="create">Create Test User</TabsTrigger>
          </TabsList>
          
          <TabsContent value="promote">
            <Card>
              <CardHeader>
                <CardTitle>Promote Existing User</CardTitle>
                <CardDescription>
                  Change the role of an existing user to give them admin or editor privileges.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {promoteSuccess && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {promoteSuccess}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Form {...promoteForm}>
                  <form onSubmit={promoteForm.handleSubmit(onPromoteSubmit)} className="space-y-6">
                    <FormField
                      control={promoteForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="user@example.com" />
                          </FormControl>
                          <FormDescription>
                            Enter the email address of the user you want to promote.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={promoteForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admin" id="admin" />
                                <Label htmlFor="admin" className="font-medium">Admin</Label>
                                <span className="text-xs text-neutral-500">(Full access to all features)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="editor" id="editor" />
                                <Label htmlFor="editor" className="font-medium">Editor</Label>
                                <span className="text-xs text-neutral-500">(Can manage products and content)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="user" id="user" />
                                <Label htmlFor="user" className="font-medium">User</Label>
                                <span className="text-xs text-neutral-500">(Regular user privileges)</span>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">
                      Promote User
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create Test User</CardTitle>
                <CardDescription>
                  Create a new test user with specified role for development purposes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {createSuccess && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Success</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {createSuccess}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-6">
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="user@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="username" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••" />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={createForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="admin" id="create-admin" />
                                <Label htmlFor="create-admin" className="font-medium">Admin</Label>
                                <span className="text-xs text-neutral-500">(Full access to all features)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="editor" id="create-editor" />
                                <Label htmlFor="create-editor" className="font-medium">Editor</Label>
                                <span className="text-xs text-neutral-500">(Can manage products and content)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="user" id="create-user" />
                                <Label htmlFor="create-user" className="font-medium">User</Label>
                                <span className="text-xs text-neutral-500">(Regular user privileges)</span>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">
                      Create Test User
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500">
            Note: These tools are for development purposes only and should be removed in production.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminUtilPage;