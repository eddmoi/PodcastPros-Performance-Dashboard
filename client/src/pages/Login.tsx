import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [password, setPassword] = useState("");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check current auth status
  const { data: authStatus } = useQuery({
    queryKey: ["/api/auth/status"],
    queryFn: () => fetch("/api/auth/status", { credentials: 'include' }).then(res => res.json())
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "You now have admin access to upload CSV files and manage data",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      setPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password change failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Password Change Request Submitted",
        description: data.message,
      });
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      loginMutation.mutate(password);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 8 characters long for security",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };

  const isAdmin = authStatus?.isAdmin;

  return (
    <div className="page-wrapper">
      <div className="max-w-2xl mx-auto px-4 py-8">
      <Card className="overflow-hidden" data-testid="card-admin-login">
        <CardHeader className="championship-gold-bg text-black p-6 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">
            {isAdmin ? 'Admin Dashboard' : 'Admin Login Required'}
          </CardTitle>
          <p className="text-lg opacity-90 mt-2">
            {isAdmin ? 'You have admin access' : 'Enter admin password to access CSV upload and management features'}
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          {isAdmin ? (
            <div className="space-y-4">
              <div className="success-green-bg text-white p-4 rounded-lg text-center">
                <h3 className="font-bold text-lg mb-2">✅ Admin Access Active</h3>
                <p>You can now:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Upload CSV files for productivity data</li>
                  <li>Upload contractor roster data</li>
                  <li>Export all reports and data</li>
                  <li>Manage contractor information</li>
                </ul>
              </div>

              {!showPasswordChange ? (
                <div className="flex justify-center space-x-3">
                  <Button 
                    onClick={() => setShowPasswordChange(true)}
                    variant="outline"
                    className="flex items-center space-x-2"
                    data-testid="button-change-password"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Change Password</span>
                  </Button>
                  
                  <Button 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    variant="outline"
                    className="flex items-center space-x-2"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">Change Admin Password</h4>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword" className="text-sm font-medium">
                        Current Password
                      </Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="mt-1"
                        data-testid="input-current-password"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword" className="text-sm font-medium">
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        className="mt-1"
                        data-testid="input-new-password"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="mt-1"
                        data-testid="input-confirm-password"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button 
                        type="submit" 
                        disabled={changePasswordMutation.isPending}
                        className="electric-blue-bg hover:opacity-90"
                        data-testid="button-submit-password-change"
                      >
                        {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                      </Button>
                      
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setShowPasswordChange(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        data-testid="button-cancel-password-change"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                  
                  <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                    <p className="text-green-700 text-sm">
                      <strong>Info:</strong> Password changes are now immediately active and securely stored. 
                      No additional configuration required.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Admin Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="mt-1"
                  data-testid="input-admin-password"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Contact your administrator if you need the current admin password.
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={loginMutation.isPending || !password.trim()}
                className="w-full electric-blue-bg hover:opacity-90"
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login as Admin'}
              </Button>
            </form>
          )}

          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h4 className="font-semibold text-yellow-800 mb-2">Why Admin Access?</h4>
            <p className="text-yellow-700 text-sm">
              Admin authentication protects sensitive operations like CSV uploads and data exports. 
              This ensures only authorized users can modify contractor data and productivity records.
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}