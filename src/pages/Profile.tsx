import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Phone, Mail, LogOut, Moon, Sun, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    studentId: "",
    studentName: "",
    mobileNo: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileData({
          studentId: profile.student_id || "",
          studentName: profile.student_name || "",
          mobileNo: profile.mobile_no || "",
          email: profile.email || user.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          student_id: profileData.studentId,
          student_name: profileData.studentName,
          mobile_no: profileData.mobileNo,
          email: profileData.email,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  const handleExportOrders = () => {
    toast.success("Exporting orders as CSV...");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("Logged out successfully");
    navigate("/auth");
  };

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
    toast.success(checked ? "Dark mode enabled" : "Light mode enabled");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] p-4 pb-24 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <h1 className="text-2xl font-bold">Profile & Settings</h1>

        {/* Stats Card */}
        <Card className="p-6 bg-gradient-primary text-white shadow-elevated border-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{profileData.studentName}</h2>
              <p className="text-white/90 text-sm">{profileData.studentId}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">5</p>
              <p className="text-xs text-white/80 mt-0.5">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-white/80 mt-0.5">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-white/80 mt-0.5">Ready</p>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={profileData.studentId}
                onChange={(e) => setProfileData({ ...profileData, studentId: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentName">Full Name</Label>
              <Input
                id="studentName"
                value={profileData.studentName}
                onChange={(e) => setProfileData({ ...profileData, studentName: e.target.value })}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNo">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="mobileNo"
                  value={profileData.mobileNo}
                  onChange={(e) => setProfileData({ ...profileData, mobileNo: e.target.value })}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} className="w-full h-11 bg-gradient-primary">
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch to dark theme</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
        </Card>

        {/* Actions */}
        <Card className="p-6 space-y-3">
          <h3 className="font-semibold text-lg mb-2">Actions</h3>
          
          <Button variant="outline" className="w-full h-11 justify-start" onClick={handleExportOrders}>
            <Download className="w-4 h-4 mr-2" />
            Export Order History (CSV)
          </Button>

          <Button variant="destructive" className="w-full h-11 justify-start" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
