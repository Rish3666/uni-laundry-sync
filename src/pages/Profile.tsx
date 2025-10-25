import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, QrCode, Download } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useUserRole } from "@/hooks/useUserRole";
import { ThemeToggle } from "@/components/ThemeToggle";

const Profile = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ student_name: "", mobile_no: "", student_id: "", room_number: "", gender: "" });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(data);
      if (data) setFormData({ student_name: data.student_name || "", mobile_no: data.mobile_no || "", student_id: data.student_id || "", room_number: data.room_number || "", gender: data.gender || "" });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update(formData).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById("qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `smartwash-${profile.customer_number}.png`;
        link.href = url;
        link.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/auth");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-gradient-primary shadow-elevated">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-primary-foreground">Profile</h1>
          <p className="text-primary-foreground/80 text-sm">{isAdmin ? "Admin Account" : "Customer Account"}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {!isAdmin && profile?.qr_code && (
          <div className="bg-card rounded-lg p-6 shadow-card text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <QrCode className="w-5 h-5" /><h2 className="text-lg font-semibold">Your QR Code</h2>
            </div>
            <div className="inline-block p-4 bg-white rounded-lg">
              <QRCodeSVG id="qr-code" value={profile.qr_code} size={200} level="H" includeMargin />
            </div>
            <p className="font-mono font-semibold text-primary">{profile.customer_number}</p>
            <Button onClick={downloadQR} variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Download</Button>
          </div>
        )}

        <div className="bg-card rounded-lg p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Personal Info</h2>
            {!editing && <Button onClick={() => setEditing(true)} variant="outline" size="sm">Edit</Button>}
          </div>
          {editing ? (
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={formData.student_name} onChange={e => setFormData({...formData, student_name: e.target.value})} /></div>
              <div><Label>Mobile</Label><Input value={formData.mobile_no} onChange={e => setFormData({...formData, mobile_no: e.target.value})} /></div>
              <div><Label>ID</Label><Input value={formData.student_id} onChange={e => setFormData({...formData, student_id: e.target.value})} /></div>
              <div><Label>Room Number</Label><Input value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} /></div>
              <div>
                <Label>Gender</Label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProfile} className="flex-1">Save</Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Name</span><span className="font-medium">{profile?.student_name || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Student ID</span><span className="font-medium">{profile?.student_id || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Email</span><span className="font-medium">{profile?.email}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Mobile</span><span className="font-medium">{profile?.mobile_no || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Room Number</span><span className="font-medium">{profile?.room_number || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Gender</span><span className="font-medium">{profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "Not set"}</span></div>
            </div>
          )}
        </div>

        <div className="bg-card rounded-lg p-6 shadow-card space-y-4">
          <h2 className="text-lg font-semibold">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {isAdmin && <Button onClick={() => navigate("/admin")} className="w-full">Admin Dashboard</Button>}
        <Button onClick={handleLogout} variant="destructive" className="w-full" size="lg"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
      </div>
    </div>
  );
};

export default Profile;
