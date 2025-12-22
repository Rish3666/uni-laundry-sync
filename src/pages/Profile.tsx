import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LogOut,
  QrCode,
  Download,
  MessageCircle,
  Mail,
  ChevronRight,
  FileText,
  Shield,
  XCircle,
  RotateCcw,
  Info,
  UserX
} from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { useUserRole } from "@/hooks/useUserRole";
import { ThemeToggle } from "@/components/ThemeToggle";
import { profileUpdateSchema } from "@/lib/validation";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { ScrollArea } from "@/components/ui/scroll-area";

const Profile = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { data: user } = useAuth();
  const { data: profileData, isLoading: loading } = useProfile(user?.id);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    student_name: "",
    mobile_no: "",
    student_id: "",
    room_number: "",
    gender: ""
  });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [cancellationOpen, setCancellationOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [suggestionText, setSuggestionText] = useState("");
  const [suggestionEmail, setSuggestionEmail] = useState("");
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) {
      toast.error("Please enter your suggestion");
      return;
    }

    setSubmittingSuggestion(true);
    try {
      const { error } = await supabase.from("suggestions").insert({
        user_id: user?.id,
        suggestion_text: suggestionText.trim(),
        email: suggestionEmail.trim() || null,
      });

      if (error) throw error;

      toast.success("Thank you for your suggestion!");
      setSuggestionText("");
      setSuggestionEmail("");
    } catch (error: any) {
      console.error("Error submitting suggestion:", error);
      toast.error("Failed to submit suggestion. Please try again.");
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-message", {
        body: {
          userName: profileData?.student_name || "Customer",
          userEmail: profileData?.email || "",
          message: emailMessage,
        },
      });

      if (error) throw error;

      toast.success("Message sent to admin successfully");
      setEmailMessage("");
      setEmailDialogOpen(false);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (profileData) {
      setFormData({
        student_name: profileData.student_name || "",
        mobile_no: profileData.mobile_no || "",
        student_id: profileData.student_id || "",
        room_number: profileData.room_number || "",
        gender: profileData.gender || ""
      });
    }
  }, [user, profileData, navigate]);

  const handleUpdateProfile = async () => {
    try {
      // Create update payload without gender
      const { gender, ...updatePayload } = formData;
      const validatedData = profileUpdateSchema.parse(updatePayload);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update(validatedData).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
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
        link.download = `smartwash-${profileData?.customer_number}.png`;
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

  const handleDeleteAccount = async () => {
    try {
      // Sign out the user (actual deletion would require admin/server-side operation)
      await supabase.auth.signOut();
      toast.success("Account deletion request submitted. You have been logged out.");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to process request. Please contact support.");
    }
  };

  const MenuButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </button>
  );

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
        {!isAdmin && profileData?.qr_code && (
          <div className="bg-card rounded-lg p-6 shadow-card text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary mb-2">
              <QrCode className="w-5 h-5" /><h2 className="text-lg font-semibold">Your QR Code</h2>
            </div>
            <div className="inline-block p-4 bg-white rounded-lg">
              <QRCodeSVG id="qr-code" value={profileData.qr_code} size={200} level="H" includeMargin />
            </div>
            <p className="font-mono font-semibold text-primary">{profileData.customer_number}</p>
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
              <div><Label>Name</Label><Input value={formData.student_name} onChange={e => setFormData({ ...formData, student_name: e.target.value })} /></div>
              <div><Label>Mobile</Label><Input value={formData.mobile_no} onChange={e => setFormData({ ...formData, mobile_no: e.target.value })} /></div>
              <div><Label>ID</Label><Input value={formData.student_id} onChange={e => setFormData({ ...formData, student_id: e.target.value })} /></div>
              <div>
                <Label>Room Number</Label>
                <Input value={formData.room_number} onChange={e => setFormData({ ...formData, room_number: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateProfile} className="flex-1">Save</Button>
                <Button onClick={() => setEditing(false)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Name</span><span className="font-medium">{profileData?.student_name || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Student ID</span><span className="font-medium">{profileData?.student_id || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Email</span><span className="font-medium">{profileData?.email}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Mobile</span><span className="font-medium">{profileData?.mobile_no || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Room Number</span><span className="font-medium">{profileData?.room_number || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Gender</span><span className="font-medium">{profileData?.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : "Not set"}</span></div>
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

        <div className="bg-card rounded-lg p-6 shadow-card space-y-4">
          <h2 className="text-lg font-semibold">Contact Support</h2>
          <a href="https://wa.me/919182199961" target="_blank" rel="noopener noreferrer" className="block">
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              size="lg"
              type="button"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message Admin on WhatsApp
            </Button>
          </a>

          <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Message Admin</DialogTitle>
                <DialogDescription>
                  Send a message to the admin via email. We'll get back to you as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="email-message">Your Message</Label>
                  <Textarea
                    id="email-message"
                    placeholder="Type your message here..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={5}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleSendEmail}
                  className="w-full"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="w-full"
                size="lg"
                variant="outline"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Suggestions
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Suggestions</DialogTitle>
                <DialogDescription>
                  Share your ideas to help us improve the app.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="suggestion-text">Your Suggestion</Label>
                  <Textarea
                    id="suggestion-text"
                    placeholder="Tell us how we can improve..."
                    value={suggestionText}
                    onChange={(e) => setSuggestionText(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="suggestion-email">Email (optional)</Label>
                  <Input
                    id="suggestion-email"
                    type="email"
                    placeholder="your@email.com"
                    value={suggestionEmail}
                    onChange={(e) => setSuggestionEmail(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">So we can follow up with you</p>
                </div>
                <Button
                  onClick={handleSubmitSuggestion}
                  className="w-full"
                  disabled={submittingSuggestion}
                >
                  {submittingSuggestion ? "Submitting..." : "Submit Suggestion"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Policies Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground px-1">Policies</h2>

          <MenuButton icon={FileText} label="Terms & Conditions" onClick={() => setTermsOpen(true)} />
          <MenuButton icon={Shield} label="Privacy Policy" onClick={() => setPrivacyOpen(true)} />
          <MenuButton icon={XCircle} label="Cancellation Policy" onClick={() => setCancellationOpen(true)} />
          <MenuButton icon={RotateCcw} label="Return & Refund Policy" onClick={() => setRefundOpen(true)} />
          <MenuButton icon={Info} label="About Us" onClick={() => setAboutOpen(true)} />
        </div>

        {/* Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-card rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-colors">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-destructive" />
                <span className="font-medium text-destructive">Delete Account</span>
              </div>
              <ChevronRight className="w-5 h-5 text-destructive" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button onClick={handleLogout} variant="destructive" className="w-full" size="lg">
          <LogOut className="w-4 h-4 mr-2" />Logout
        </Button>

        <p className="text-center text-sm text-muted-foreground">App Version: 1.0.0</p>
      </div>

      {/* Terms & Conditions Dialog */}
      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terms & Conditions</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Welcome to SmartWash. By using our services, you agree to be bound by the following terms and conditions.</p>
              <h3 className="font-semibold text-foreground">1. Service Usage</h3>
              <p>Our laundry services are available to registered users only. You must provide accurate information during registration.</p>
              <h3 className="font-semibold text-foreground">2. Orders</h3>
              <p>All orders are subject to availability. We reserve the right to refuse service at our discretion.</p>
              <h3 className="font-semibold text-foreground">3. Payment</h3>
              <p>Payment must be made at the time of order placement or upon delivery as per the chosen payment method.</p>
              <h3 className="font-semibold text-foreground">4. Liability</h3>
              <p>We take utmost care of your garments. However, we are not liable for damage to delicate items not declared at the time of order.</p>
              <h3 className="font-semibold text-foreground">5. Changes to Terms</h3>
              <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Your privacy is important to us. This policy explains how we collect, use, and protect your information.</p>
              <h3 className="font-semibold text-foreground">Information We Collect</h3>
              <p>We collect personal information such as name, email, phone number, and room number to provide our services.</p>
              <h3 className="font-semibold text-foreground">How We Use Your Information</h3>
              <p>Your information is used to process orders, communicate updates, and improve our services.</p>
              <h3 className="font-semibold text-foreground">Data Security</h3>
              <p>We implement appropriate security measures to protect your personal information from unauthorized access.</p>
              <h3 className="font-semibold text-foreground">Third-Party Sharing</h3>
              <p>We do not sell or share your personal information with third parties except as required by law.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Cancellation Policy Dialog */}
      <Dialog open={cancellationOpen} onOpenChange={setCancellationOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Cancellation Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>We understand that plans can change. Here's our cancellation policy:</p>
              <h3 className="font-semibold text-foreground">Order Cancellation</h3>
              <p>Orders can be cancelled within 1 hour of placement for a full refund.</p>
              <h3 className="font-semibold text-foreground">After Pickup</h3>
              <p>Once your laundry has been picked up, cancellation is not possible as processing may have begun.</p>
              <h3 className="font-semibold text-foreground">Subscription Cancellation</h3>
              <p>Subscriptions can be cancelled anytime. Unused credits will be forfeited upon cancellation.</p>
              <h3 className="font-semibold text-foreground">How to Cancel</h3>
              <p>Contact our support team via WhatsApp or email to request cancellation.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Return & Refund Policy Dialog */}
      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Return & Refund Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>We strive for 100% customer satisfaction. Here's our refund policy:</p>
              <h3 className="font-semibold text-foreground">Quality Issues</h3>
              <p>If you're not satisfied with the quality of our service, please report within 24 hours of delivery for a free re-wash.</p>
              <h3 className="font-semibold text-foreground">Missing Items</h3>
              <p>Report any missing items within 24 hours. We will investigate and compensate appropriately.</p>
              <h3 className="font-semibold text-foreground">Damage Claims</h3>
              <p>For damaged items, please provide photos within 24 hours of delivery. Valid claims will be compensated based on item value.</p>
              <h3 className="font-semibold text-foreground">Refund Processing</h3>
              <p>Approved refunds will be processed within 5-7 business days to the original payment method.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* About Us Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>About Us</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>SmartWash is your trusted laundry service partner, providing convenient and quality laundry solutions.</p>
              <h3 className="font-semibold text-foreground">Our Mission</h3>
              <p>To make laundry hassle-free for everyone with reliable, affordable, and eco-friendly services.</p>
              <h3 className="font-semibold text-foreground">Our Services</h3>
              <p>We offer wash & fold, dry cleaning, ironing, and specialized care for delicate fabrics.</p>
              <h3 className="font-semibold text-foreground">Why Choose Us</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Convenient pickup and delivery</li>
                <li>Quality cleaning products</li>
                <li>Affordable pricing</li>
                <li>Quick turnaround time</li>
                <li>Dedicated customer support</li>
              </ul>
              <h3 className="font-semibold text-foreground">Contact</h3>
              <p>For any queries, reach out to us via WhatsApp or email through the Contact Support section.</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
