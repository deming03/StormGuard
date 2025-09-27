// @ts-ignore - React type resolution issue
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
// @ts-ignore - Module resolution issue, works at runtime
import { useForm } from 'react-hook-form'
// @ts-ignore - Module resolution issue, works at runtime
import { zodResolver } from '@hookform/resolvers/zod'
// @ts-ignore - Module resolution issue, works at runtime
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/authStore'
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react'
import type { UserRole } from '@/lib/database.types'

const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['citizen', 'responder', 'coordinator', 'admin'] as const),
  organization: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp, loading } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()

  const form = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'citizen',
      organization: '',
    },
  })

  const watchRole = form.watch('role')

  const onSubmit = async (data: SignUpForm) => {
    try {
      await signUp(data.email, data.password, {
        full_name: data.fullName,
        role: data.role,
        organization: data.organization || null,
      })
      toast({
        title: "Account created successfully!",
        description: "Welcome to DisasterGuard AI. You can now access your dashboard.",
      })
      navigate('/dashboard')
    } catch (error) {
      toast({
        title: "Sign up failed",
        description: error instanceof Error ? error.message : "An error occurred during sign up.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="text-gray-400 mt-2">Join DisasterGuard AI to help save lives</p>
        </div>

        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-white">Get started</CardTitle>
            <CardDescription className="text-gray-300">
              Create your account to access the disaster management platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  {...form.register('fullName')}
                />
                {form.formState.errors.fullName && (
                  <p className="text-sm text-red-400">{form.formState.errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-white">Role</Label>
                <Select 
                  value={form.watch('role')} 
                  onValueChange={(value: UserRole) => form.setValue('role', value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="citizen" className="text-white hover:bg-white/10">
                      Citizen - Report incidents and access resources
                    </SelectItem>
                    <SelectItem value="responder" className="text-white hover:bg-white/10">
                      First Responder - Emergency response professional
                    </SelectItem>
                    <SelectItem value="coordinator" className="text-white hover:bg-white/10">
                      Coordinator - Disaster management coordinator
                    </SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-400">{form.formState.errors.role.message}</p>
                )}
              </div>

              {(watchRole === 'responder' || watchRole === 'coordinator') && (
                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-white">Organization</Label>
                  <Input
                    id="organization"
                    placeholder="Fire Department, Red Cross, etc."
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    {...form.register('organization')}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10"
                    {...form.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-sm text-red-400">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 pr-10"
                    {...form.register('confirmPassword')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-400">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-gray-400">
                    Already have an account?
                  </span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <Link
                  to="/auth/signin"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  Sign in instead
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link to="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
