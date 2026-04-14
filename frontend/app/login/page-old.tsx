'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Camera, User, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [loginMethod, setLoginMethod] = useState('credentials')
  const router = useRouter()
  const { login, loginWithFace } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(formData.username, formData.password)
      toast({
        title: "Login Successful",
        description: "Welcome back to TulsiHealth!",
      })
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select your role to continue.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Registration logic would go here
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully.",
      })
      router.push('/dashboard')
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFaceLogin = async () => {
    // Face login implementation would go here
    toast({
      title: "Face Recognition",
      description: "Face login feature coming soon!",
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-tulsi-dark via-tulsi-green-900 to-tulsi-green-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-morphism border-tulsi-gold-200/20">
          <CardHeader className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold tulsi-gradient-text mb-2">TulsiHealth</h1>
              <p className="text-sm text-muted-foreground">
                India's First AYUSH + ICD-11 Dual-Coding EMR Platform
              </p>
            </motion.div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={loginMethod} onValueChange={setLoginMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="credentials">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="credentials" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="pl-10 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>
                </form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleFaceLogin}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Face Recognition Login
                </Button>
              </TabsContent>
              
              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regUsername">Username</Label>
                    <Input
                      id="regUsername"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="regPassword">Password</Label>
                    <Input
                      id="regPassword"
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Select Your Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Doctor</Badge>
                            <span className="text-sm">Medical Practitioner</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="clinician">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Clinician</Badge>
                            <span className="text-sm">Healthcare Worker</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="patient">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Patient</Badge>
                            <span className="text-sm">Patient Access</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <Alert>
                <AlertDescription className="text-xs">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                  This platform is FHIR R4-compliant and follows Indian healthcare data standards.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
