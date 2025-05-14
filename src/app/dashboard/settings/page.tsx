'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { 
  Settings, 
  Store, 
  Bell, 
  UserCircle, 
  CreditCard, 
  TruckIcon,
  Palette,
  Save,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

// Define interfaces for our settings
interface ProfileSettings {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string | null;
}

interface StoreSettings {
  storeName: string;
  storeDescription: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
  logo_url: string | null;
  currency: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  orderUpdates: boolean;
  marketingEmails: boolean;
  newSales: boolean;
  lowStockAlerts: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  reducedAnimations: boolean;
  compactMode: boolean;
  highContrastMode: boolean;
}

export default function SettingsPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState<User | null>(null);
  
  // Settings state
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: null
  });
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: '',
    storeDescription: '',
    contactEmail: '',
    supportPhone: '',
    address: '',
    logo_url: null,
    currency: 'USD'
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    orderUpdates: true,
    marketingEmails: false,
    newSales: true,
    lowStockAlerts: true
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    theme: 'light',
    reducedAnimations: false,
    compactMode: false,
    highContrastMode: false
  });

  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingStore, setIsLoadingStore] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingAppearance, setIsLoadingAppearance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user and settings on load
  useEffect(() => {
    async function loadUserAndSettings() {
      setIsLoading(true);
      try {
        // Get user data
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Load profile settings
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (profileData) {
            setProfileSettings({
              fullName: profileData.full_name || '',
              email: user.email || '',
              phone: profileData.phone || '',
              bio: profileData.bio || '',
              avatar_url: profileData.avatar_url
            });
          }
          
          // Load store settings
          const { data: storeData } = await supabase
            .from('seller_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (storeData) {
            setStoreSettings({
              storeName: storeData.store_name || '',
              storeDescription: storeData.description || '',
              contactEmail: storeData.contact_email || user.email || '',
              supportPhone: storeData.support_phone || '',
              address: storeData.address || '',
              logo_url: storeData.logo_url,
              currency: storeData.currency || 'USD'
            });
          }
          
          // Load notification preferences
          const { data: notificationData } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (notificationData) {
            setNotificationSettings({
              emailNotifications: notificationData.email_notifications || true,
              orderUpdates: notificationData.order_updates || true,
              marketingEmails: notificationData.marketing_emails || false,
              newSales: notificationData.new_sales || true,
              lowStockAlerts: notificationData.low_stock_alerts || true
            });
          }
          
          // Load appearance settings
          const { data: appearanceData } = await supabase
            .from('appearance_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (appearanceData) {
            setAppearanceSettings({
              theme: appearanceData.theme || 'light',
              reducedAnimations: appearanceData.reduced_animations || false,
              compactMode: appearanceData.compact_mode || false,
              highContrastMode: appearanceData.high_contrast_mode || false
            });
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadUserAndSettings();
  }, [supabase]);

  // Save profile settings
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileSettings.fullName,
          phone: profileSettings.phone,
          bio: profileSettings.bio,
          avatar_url: profileSettings.avatar_url,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile settings have been saved successfully.",
      });
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Save store settings
  const handleSaveStore = async () => {
    if (!user) return;
    
    setIsLoadingStore(true);
    try {
      const { error } = await supabase
        .from('seller_settings')
        .upsert({
          user_id: user.id,
          store_name: storeSettings.storeName,
          description: storeSettings.storeDescription,
          contact_email: storeSettings.contactEmail,
          support_phone: storeSettings.supportPhone,
          address: storeSettings.address,
          logo_url: storeSettings.logo_url,
          currency: storeSettings.currency,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Store settings updated",
        description: "Your store settings have been saved successfully.",
      });
      
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error('Error saving store settings:', error);
      toast({
        title: "Error",
        description: "Failed to update store settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStore(false);
    }
  };

  // Save notification settings
  const handleSaveNotifications = async () => {
    if (!user) return;
    
    setIsLoadingNotifications(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          email_notifications: notificationSettings.emailNotifications,
          order_updates: notificationSettings.orderUpdates,
          marketing_emails: notificationSettings.marketingEmails,
          new_sales: notificationSettings.newSales,
          low_stock_alerts: notificationSettings.lowStockAlerts,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Save appearance settings
  const handleSaveAppearance = async () => {
    if (!user) return;
    
    setIsLoadingAppearance(true);
    try {
      const { error } = await supabase
        .from('appearance_settings')
        .upsert({
          user_id: user.id,
          theme: appearanceSettings.theme,
          reduced_animations: appearanceSettings.reducedAnimations,
          compact_mode: appearanceSettings.compactMode,
          high_contrast_mode: appearanceSettings.highContrastMode,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "Appearance settings updated",
        description: "Your appearance preferences have been saved successfully.",
      });
      
      // Apply theme changes immediately
      document.documentElement.className = appearanceSettings.theme;
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast({
        title: "Error",
        description: "Failed to update appearance settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAppearance(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <TabsList className="grid grid-cols-4 gap-4 bg-gray-100">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            >
              <UserCircle className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="store" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            >
              <Store className="h-4 w-4 mr-2" />
              Store
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700"
            >
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName"
                    value={profileSettings.fullName}
                    onChange={(e) => setProfileSettings({...profileSettings, fullName: e.target.value})}
                    placeholder="Jane Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    value={profileSettings.email}
                    disabled
                    placeholder="jane@example.com"
                  />
                  <p className="text-xs text-gray-500">To change your email, go to account security settings.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    value={profileSettings.phone}
                    onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                      {profileSettings.avatar_url ? (
                        <img 
                          src={profileSettings.avatar_url} 
                          alt="Avatar" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Upload Image
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea 
                    id="bio"
                    value={profileSettings.bio}
                    onChange={(e) => setProfileSettings({...profileSettings, bio: e.target.value})}
                    placeholder="Tell us a little about yourself"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline">Cancel</Button>
              <Button 
                onClick={handleSaveProfile}
                disabled={isLoadingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Customize your store details and branding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input 
                    id="storeName"
                    value={storeSettings.storeName}
                    onChange={(e) => setStoreSettings({...storeSettings, storeName: e.target.value})}
                    placeholder="My Awesome Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input 
                    id="contactEmail"
                    value={storeSettings.contactEmail}
                    onChange={(e) => setStoreSettings({...storeSettings, contactEmail: e.target.value})}
                    placeholder="store@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input 
                    id="supportPhone"
                    value={storeSettings.supportPhone}
                    onChange={(e) => setStoreSettings({...storeSettings, supportPhone: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <select
                    id="currency"
                    value={storeSettings.currency}
                    onChange={(e) => setStoreSettings({...storeSettings, currency: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea 
                    id="address"
                    value={storeSettings.address}
                    onChange={(e) => setStoreSettings({...storeSettings, address: e.target.value})}
                    placeholder="Street address, city, state/province, postal code, country"
                    rows={2}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea 
                    id="storeDescription"
                    value={storeSettings.storeDescription}
                    onChange={(e) => setStoreSettings({...storeSettings, storeDescription: e.target.value})}
                    placeholder="Describe your store and what you sell"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Store Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                      {storeSettings.logo_url ? (
                        <img 
                          src={storeSettings.logo_url} 
                          alt="Store Logo" 
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Store className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline">Cancel</Button>
              <Button 
                onClick={handleSaveStore}
                disabled={isLoadingStore}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoadingStore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Store Settings
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment processors and integrations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-indigo-600" />
                  <div>
                    <h3 className="font-medium">Payment Processing</h3>
                    <p className="text-sm text-gray-500">
                      Configure payment methods accepted by your store
                    </p>
                  </div>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings</CardTitle>
              <CardDescription>Configure your shipping options and pricing.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between border p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <TruckIcon className="h-8 w-8 text-indigo-600" />
                  <div>
                    <h3 className="font-medium">Shipping Rules</h3>
                    <p className="text-sm text-gray-500">
                      Set up shipping zones, methods, and pricing
                    </p>
                  </div>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage which emails and alerts you receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive all notifications via email</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, emailNotifications: checked})
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Updates</Label>
                    <p className="text-sm text-gray-500">Get notified about new and updated orders</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.orderUpdates}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, orderUpdates: checked})
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-500">Receive tips, product updates and offers</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, marketingEmails: checked})
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Sales</Label>
                    <p className="text-sm text-gray-500">Get notified when you make a sale</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.newSales}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, newSales: checked})
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-gray-500">Receive alerts when products are running low</p>
                  </div>
                  <Switch 
                    checked={notificationSettings.lowStockAlerts}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({...notificationSettings, lowStockAlerts: checked})
                    }
                    disabled={!notificationSettings.emailNotifications}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <Button 
                onClick={handleSaveNotifications}
                disabled={isLoadingNotifications}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoadingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Notification Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize how your dashboard looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer",
                        appearanceSettings.theme === 'light'
                          ? "border-indigo-600"
                          : "border-gray-200"
                      )}
                      onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'light'})}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full bg-gray-50 border border-gray-300"></div>
                        </div>
                        <span className="text-sm font-medium">Light</span>
                      </div>
                    </div>
                    
                    <div
                      className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer",
                        appearanceSettings.theme === 'dark'
                          ? "border-indigo-600"
                          : "border-gray-200"
                      )}
                      onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'dark'})}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-12 w-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full bg-gray-800 border border-gray-700"></div>
                        </div>
                        <span className="text-sm font-medium">Dark</span>
                      </div>
                    </div>
                    
                    <div
                      className={cn(
                        "border-2 rounded-lg p-4 cursor-pointer",
                        appearanceSettings.theme === 'system'
                          ? "border-indigo-600"
                          : "border-gray-200"
                      )}
                      onClick={() => setAppearanceSettings({...appearanceSettings, theme: 'system'})}
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-white to-gray-900 border border-gray-300 flex items-center justify-center">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-50 to-gray-800 border border-gray-400"></div>
                        </div>
                        <span className="text-sm font-medium">System</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Reduced Motion</Label>
                      <p className="text-sm text-gray-500">Reduce animations and transitions</p>
                    </div>
                    <Switch 
                      checked={appearanceSettings.reducedAnimations}
                      onCheckedChange={(checked) => 
                        setAppearanceSettings({...appearanceSettings, reducedAnimations: checked})
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-gray-500">Display more content with less spacing</p>
                    </div>
                    <Switch 
                      checked={appearanceSettings.compactMode}
                      onCheckedChange={(checked) => 
                        setAppearanceSettings({...appearanceSettings, compactMode: checked})
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>High Contrast Mode</Label>
                      <p className="text-sm text-gray-500">Increase contrast for better visibility</p>
                    </div>
                    <Switch 
                      checked={appearanceSettings.highContrastMode}
                      onCheckedChange={(checked) => 
                        setAppearanceSettings({...appearanceSettings, highContrastMode: checked})
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t p-6">
              <Button 
                onClick={handleSaveAppearance}
                disabled={isLoadingAppearance}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isLoadingAppearance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Appearance Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 