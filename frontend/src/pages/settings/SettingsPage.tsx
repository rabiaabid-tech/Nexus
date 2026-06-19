import React, { useState, useEffect } from "react";
import { User, Lock, Bell, Globe, Palette, CreditCard } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Avatar } from "../../components/ui/Avatar";
import { useAuth } from "../../context/AuthContext";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Fallback to empty string for safety
  const profile = (user as any) || {};
  const isEntrepreneur = profile.role === "Entrepreneur";
  const isInvestor = profile.role === "Investor";

  // Single source of truth for form data
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    bio: profile?.bio || "",

    // Entrepreneur specific
    startupName: profile?.startupName || profile?.startup_name || "",
    industry: profile?.industry || "",
    location: profile?.location || "",
    foundedYear: profile?.foundedYear || profile?.founded_year || "",
    teamSize: profile?.teamSize || profile?.team_size || "",
    pitchSummary: profile?.pitchSummary || profile?.pitch_summary || "",
    fundingNeeded: profile?.fundingNeeded || profile?.funding_needed || "",

    // Investor specific
    minimumInvestment:
      profile?.minimumInvestment || profile?.minimum_investment || "",
    maximumInvestment:
      profile?.maximumInvestment || profile?.maximum_investment || "",
    investmentInterests: (
      profile?.investmentInterests ||
      profile?.investment_interests ||
      []
    ).join(", "),
  });

  // Sync state if context user changes after initial render
  useEffect(() => {
    if (user) {
      const p = user as any;
      setFormData((prev) => ({
        ...prev,
        name: p.name || "",
        bio: p.bio || "",
        startupName: p.startupName || p.startup_name || prev.startupName,
        industry: p.industry || prev.industry,
        location: p.location || prev.location,
        foundedYear: p.foundedYear || p.founded_year || prev.foundedYear,
        teamSize: p.teamSize || p.team_size || prev.teamSize,
        pitchSummary: p.pitchSummary || p.pitch_summary || prev.pitchSummary,
        fundingNeeded:
          p.fundingNeeded || p.funding_needed || prev.fundingNeeded,
        minimumInvestment:
          p.minimumInvestment || p.minimum_investment || prev.minimumInvestment,
        maximumInvestment:
          p.maximumInvestment || p.maximum_investment || prev.maximumInvestment,
        investmentInterests:
          (p.investmentInterests || p.investment_interests || []).join(", ") ||
          prev.investmentInterests,
      }));
    }
  }, [user]);

  if (!user) return null;

  // Universal Input Handler
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // API Submission Logic
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,

        investmentInterests: formData.investmentInterests
          ? formData.investmentInterests
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [],
      };

      const token = localStorage.getItem("business_nexus_token");

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      if (response.ok) {
        const updatedUser = { ...user, ...payload };
        localStorage.setItem(
          "business_nexus_user",
          JSON.stringify(updatedUser),
        );

        alert("Profile successfully updated in database.");
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Database Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Update failed", error);
      alert("Network failure. Make sure the backend server is running.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account preferences and settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="lg:col-span-1">
          <CardBody className="p-2">
            <nav className="space-y-1">
              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md">
                <User size={18} className="mr-3" />
                Profile
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Lock size={18} className="mr-3" />
                Security
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Bell size={18} className="mr-3" />
                Notifications
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Globe size={18} className="mr-3" />
                Language
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <Palette size={18} className="mr-3" />
                Appearance
              </button>

              <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md">
                <CreditCard size={18} className="mr-3" />
                Billing
              </button>
            </nav>
          </CardBody>
        </Card>

        {/* Main settings content */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Profile Settings
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar src={user.avatarUrl} alt={user.name} size="xl" />
                <div>
                  <Button variant="outline" size="sm">
                    Change Photo
                  </Button>
                  <p className="mt-2 text-sm text-gray-500">
                    JPG, GIF or PNG. Max size of 800K
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <Input
                  label="Email"
                  type="email"
                  defaultValue={user.email}
                  disabled
                />
                <Input label="Role" value={user.role} disabled />
                <Input
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

              <div className="relative z-50 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio || ""}
                  onChange={handleChange}
                  placeholder="Write a brief introduction about yourself..."
                  className="w-full p-3 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardBody>
          </Card>
          {/* Conditional Rendering: Entrepreneur Fields */}
          {isEntrepreneur && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Startup Profile
                </h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Startup Name"
                    name="startupName"
                    value={formData.startupName}
                    onChange={handleChange}
                  />
                  <Input
                    label="Industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                  />
                  <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                  <Input
                    label="Founded Year"
                    name="foundedYear"
                    type="number"
                    value={formData.foundedYear}
                    onChange={handleChange}
                  />
                  <Input
                    label="Team Size"
                    name="teamSize"
                    type="number"
                    value={formData.teamSize}
                    onChange={handleChange}
                  />
                  <Input
                    label="Funding Needed (e.g. $500K)"
                    name="fundingNeeded"
                    value={formData.fundingNeeded}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pitch Summary
                  </label>
                  <textarea
                    name="pitchSummary"
                    value={formData.pitchSummary}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Conditional Rendering: Investor Fields */}
          {isInvestor && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">
                  Investment Preferences
                </h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Minimum Investment"
                    name="minimumInvestment"
                    value={formData.minimumInvestment}
                    onChange={handleChange}
                    placeholder="e.g. $10K"
                  />
                  <Input
                    label="Maximum Investment"
                    name="maximumInvestment"
                    value={formData.maximumInvestment}
                    onChange={handleChange}
                    placeholder="e.g. $500K"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Interests (Comma separated)
                  </label>
                  <textarea
                    name="investmentInterests"
                    value={formData.investmentInterests}
                    onChange={handleChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    rows={2}
                    placeholder="SaaS, FinTech, AI"
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">
                Security Settings
              </h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                    <Badge variant="error" className="mt-1">
                      Not Enabled
                    </Badge>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                  Change Password
                </h3>
                <div className="space-y-4">
                  <Input label="Current Password" type="password" />

                  <Input label="New Password" type="password" />

                  <Input label="Confirm New Password" type="password" />

                  <div className="flex justify-end">
                    <Button>Update Password</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};;
