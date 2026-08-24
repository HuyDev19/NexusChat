import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PenguinIcon } from "@/components/ui/PenguinIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Link, useNavigate, useLocation } from "react-router";
import { toast } from "sonner";
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { authService } from "@/services/authService";

// Sign In Validation Schema
const signInSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
type SignInFormValues = z.infer<typeof signInSchema>;

// Sign Up Validation Schema
const signUpSchema = z
  .object({
    firstname: z.string().min(1, "Tên bắt buộc phải có"),
    lastname: z.string().min(1, "Họ bắt buộc phải có"),
    username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z
      .string()
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
      .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất 1 chữ hoa (A-Z)")
      .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất 1 chữ thường (a-z)")
      .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất 1 chữ số (0-9)"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmPassword"],
  });
type SignUpFormValues = z.infer<typeof signUpSchema>;

export function AuthContainer({ className, ...props }: React.ComponentProps<"div"> = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp, sendOtp, resetPassword } = useAuthStore();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Managed internal state for smooth continuous sliding transition
  const [isSignUp, setIsSignUp] = useState(() => location.pathname === "/signup");

  // Sign Up OTP State
  const [signUpStep, setSignUpStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Forgot Password State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [confirmPasswordVal, setConfirmPasswordVal] = useState("");
  const [forgotResendTimer, setForgotResendTimer] = useState(0);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  // Username & Email Check States
  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });

  const [emailCheck, setEmailCheck] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });

  // Sync state if URL changes directly or on back/forward
  useEffect(() => {
    setIsSignUp(location.pathname === "/signup");
    setSignUpStep(1);
    setOtpCode("");
  }, [location.pathname]);

  // Resend Timer for Sign Up OTP
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Resend Timer for Forgot Password OTP
  useEffect(() => {
    if (forgotResendTimer <= 0) return;
    const interval = setInterval(() => {
      setForgotResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [forgotResendTimer]);

  // Smooth toggle mode handler
  const handleToggleMode = (targetPath: "/signin" | "/signup") => {
    setIsSignUp(targetPath === "/signup");
    setSignUpStep(1);
    setOtpCode("");
    window.history.pushState({}, "", targetPath);
  };

  // Form Hooks
  const {
    register: registerSignIn,
    handleSubmit: handleSubmitSignIn,
    formState: { errors: errorsSignIn, isSubmitting: isSubmittingSignIn },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
  });

  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    trigger: triggerSignUp,
    getValues: getValuesSignUp,
    watch: watchSignUp,
    formState: { errors: errorsSignUp, isSubmitting: isSubmittingSignUp },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
  });

  const signUpPasswordVal = watchSignUp("password") || "";
  const hasUppercase = /[A-Z]/.test(signUpPasswordVal);
  const hasLowercase = /[a-z]/.test(signUpPasswordVal);
  const hasNumber = /[0-9]/.test(signUpPasswordVal);

  const handleCheckUsernameBlur = async () => {
    const val = getValuesSignUp("username")?.trim();
    if (!val || val.length < 3) {
      setUsernameCheck({ checking: false, available: null, message: "" });
      return;
    }
    try {
      setUsernameCheck({ checking: true, available: null, message: "Đang kiểm tra tên đăng nhập..." });
      const res = await authService.checkUsername(val);
      setUsernameCheck({ checking: false, available: res.available, message: res.message });
    } catch (error: any) {
      setUsernameCheck({ checking: false, available: false, message: error.response?.data?.message || "Tên đăng nhập không hợp lệ" });
    }
  };

  const handleCheckEmailBlur = async () => {
    const val = getValuesSignUp("email")?.trim();
    if (!val || !val.includes("@")) {
      setEmailCheck({ checking: false, available: null, message: "" });
      return;
    }
    try {
      setEmailCheck({ checking: true, available: null, message: "Đang kiểm tra email..." });
      const res = await authService.checkEmail(val);
      setEmailCheck({ checking: false, available: res.available, message: res.message });
    } catch (error: any) {
      setEmailCheck({ checking: false, available: false, message: error.response?.data?.message || "Email không hợp lệ" });
    }
  };

  // Handlers
  const onSignInSubmit = async (data: SignInFormValues) => {
    if (!data.username?.trim() || !data.password) {
      toast.error("Bạn cần nhập đủ thông tin!");
      return;
    }
    try {
      await signIn(data.username, data.password);
      navigate("/chat");
    } catch (error) {
      // Toast thông báo lỗi đã được kích hoạt trong store
    }
  };

  const onSignInInvalid = () => {
    toast.error("Bạn cần nhập đủ thông tin!");
  };

  // Handle requesting OTP for Sign Up
  const handleRequestSignUpOtp = async () => {
    const values = getValuesSignUp();
    if (
      !values.lastname?.trim() ||
      !values.firstname?.trim() ||
      !values.username?.trim() ||
      !values.email?.trim() ||
      !values.password ||
      !values.confirmPassword
    ) {
      toast.error("Bạn cần nhập đủ thông tin!");
      return;
    }

    if (usernameCheck.available === false) {
      toast.error("Tên đăng nhập này đã được sử dụng! Vui lòng chọn tên khác.");
      return;
    }
    if (emailCheck.available === false) {
      toast.error("Email này đã được đăng ký! Vui lòng sử dụng email khác.");
      return;
    }

    const isValid = await triggerSignUp();
    if (!isValid) {
      toast.error("Bạn cần nhập đủ thông tin!");
      return;
    }

    try {
      setIsSendingOtp(true);
      await sendOtp(values.email, "register");
      setSignUpStep(2);
      setResendTimer(60);
    } catch (error) {
      // toast shown in store
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP for Sign Up
  const handleResendSignUpOtp = async () => {
    if (resendTimer > 0) return;
    const email = getValuesSignUp("email");
    try {
      setIsSendingOtp(true);
      await sendOtp(email, "register");
      setResendTimer(60);
    } catch (error) {
      // error handled in store
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Final Sign Up Submission with OTP
  const onSignUpSubmit = async (data: SignUpFormValues) => {
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP!");
      return;
    }

    try {
      await signUp(
        data.username,
        data.password,
        data.email,
        data.firstname,
        data.lastname,
        otpCode.trim()
      );
      handleToggleMode("/signin");
    } catch (error) {
      // error handled in store
    }
  };

  // Forgot Password: Request OTP
  const handleRequestForgotOtp = async () => {
    if (!forgotEmail?.trim()) {
      toast.error("Bạn cần nhập đủ thông tin!");
      return;
    }
    if (!forgotEmail.includes("@")) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ!");
      return;
    }
    try {
      setIsForgotLoading(true);
      await sendOtp(forgotEmail.trim(), "reset_password");
      setForgotStep(2);
      setForgotResendTimer(60);
    } catch (error) {
      // toast in store
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Forgot Password: Resend OTP
  const handleResendForgotOtp = async () => {
    if (forgotResendTimer > 0) return;
    try {
      setIsForgotLoading(true);
      await sendOtp(forgotEmail.trim(), "reset_password");
      setForgotResendTimer(60);
    } catch (error) {
      // error handled in store
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Forgot Password: Complete Reset
  const handleCompletePasswordReset = async () => {
    if (!forgotOtp?.trim() || !newPasswordVal || !confirmPasswordVal) {
      toast.error("Bạn cần nhập đủ thông tin!");
      return;
    }
    if (forgotOtp.trim().length !== 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số mã OTP!");
      return;
    }
    if (newPasswordVal.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      toast.error("Mật khẩu mới không trùng khớp!");
      return;
    }
    try {
      setIsForgotLoading(true);
      await resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPasswordVal);
      setShowForgotPassword(false);
      setForgotStep(1);
      setForgotEmail("");
      setForgotOtp("");
      setNewPasswordVal("");
      setConfirmPasswordVal("");
      handleToggleMode("/signin");
    } catch (error) {
      // error handled in store
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className={cn("w-full relative", className)} {...props}>
      <Card className="overflow-hidden p-0 border border-purple-500/30 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-purple-500/15 rounded-3xl relative">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[530px] h-[530px] relative">
          
          {/* ========================================================= */}
          {/* LEFT SIDE: Sign In Form (Positioned on Left 50%)          */}
          {/* ========================================================= */}
          <div
            className={cn(
              "p-6 sm:p-8 flex flex-col justify-between h-full transition-opacity duration-300",
              isSignUp ? "md:opacity-0 opacity-0 pointer-events-none hidden md:flex" : "opacity-100"
            )}
          >
            <form
              className="flex flex-col justify-between h-full space-y-4"
              onSubmit={handleSubmitSignIn(onSignInSubmit, onSignInInvalid)}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col gap-1.5">
                  <Link to="/" className="flex items-center gap-2 w-fit group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform p-1.5">
                      <PenguinIcon className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
                      NexusChat
                    </span>
                  </Link>

                  <div className="pt-1">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      Chào mừng quay lại!
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Nhập thông tin đăng nhập của bạn để tiếp tục vào ứng dụng
                    </p>
                  </div>
                </div>

                {/* Fields */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label htmlFor="signin-username" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Tên đăng nhập
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signin-username"
                        type="text"
                        placeholder="Nhập tên đăng nhập..."
                        className="pl-9 h-9.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                        {...registerSignIn("username")}
                      />
                    </div>
                    {errorsSignIn.username && (
                      <p className="text-destructive text-[11px] font-medium mt-0.5">
                        {errorsSignIn.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Mật khẩu
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotStep(1);
                        }}
                        className="text-[11px] font-medium text-purple-500 hover:text-purple-400 hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-9 pr-9 h-9.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                        {...registerSignIn("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errorsSignIn.password && (
                      <p className="text-destructive text-[11px] font-medium mt-0.5">
                        {errorsSignIn.password.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmittingSignIn}
                  className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-purple-500/25 transition-all gap-2 text-xs"
                >
                  {isSubmittingSignIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang đăng nhập...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Đăng nhập</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Link */}
              <div className="pt-2 border-t border-border/40 text-center text-xs">
                <span className="text-muted-foreground">Chưa có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => handleToggleMode("/signup")}
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:underline underline-offset-4"
                >
                  Đăng ký tài khoản mới
                </button>
              </div>
            </form>
          </div>

          {/* ========================================================= */}
          {/* RIGHT SIDE: Sign Up Form with OTP Step (Right 50%)       */}
          {/* ========================================================= */}
          <div
            className={cn(
              "p-6 sm:p-8 flex flex-col justify-between h-full transition-opacity duration-300",
              !isSignUp ? "md:opacity-0 opacity-0 pointer-events-none hidden md:flex" : "opacity-100"
            )}
          >
            <form
              className="flex flex-col justify-between h-full space-y-2"
              onSubmit={handleSubmitSignUp(onSignUpSubmit)}
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex flex-col gap-1">
                  <Link to="/" className="flex items-center gap-2 w-fit group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform p-1.5">
                      <PenguinIcon className="w-5 h-5 text-white drop-shadow-sm" />
                    </div>
                    <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent">
                      NexusChat
                    </span>
                  </Link>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      {signUpStep === 1 ? "Tạo tài khoản mới" : "Xác thực mã OTP"}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {signUpStep === 1
                        ? "Đăng ký ngay để bắt đầu trò chuyện cùng mọi người"
                        : `Nhập mã OTP 6 chữ số đã được gửi đến ${getValuesSignUp("email")}`}
                    </p>
                  </div>
                </div>

                {/* STEP 1: Registration Form Inputs */}
                {signUpStep === 1 && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <Label htmlFor="signup-lastname" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Họ
                        </Label>
                        <Input
                          id="signup-lastname"
                          type="text"
                          placeholder="Nguyễn"
                          className="h-8.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                          {...registerSignUp("lastname")}
                        />
                        {errorsSignUp.lastname && (
                          <p className="text-destructive text-[10px] font-medium">
                            {errorsSignUp.lastname.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <Label htmlFor="signup-firstname" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Tên
                        </Label>
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="Văn A"
                          className="h-8.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                          {...registerSignUp("firstname")}
                        />
                        {errorsSignUp.firstname && (
                          <p className="text-destructive text-[10px] font-medium">
                            {errorsSignUp.firstname.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Username Input */}
                    <div className="space-y-0.5">
                      <Label htmlFor="signup-username" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Tên đăng nhập
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="signup-username"
                          type="text"
                          placeholder="nexus_user"
                          className="pl-9 h-8.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                          {...registerSignUp("username", {
                            onBlur: handleCheckUsernameBlur,
                          })}
                        />
                      </div>
                      {usernameCheck.checking ? (
                        <p className="text-purple-400 text-[10px] flex items-center gap-1 mt-0.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{usernameCheck.message}</span>
                        </p>
                      ) : usernameCheck.available === true ? (
                        <p className="text-emerald-400 text-[10px] flex items-center gap-1 mt-0.5 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{usernameCheck.message}</span>
                        </p>
                      ) : usernameCheck.available === false ? (
                        <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-0.5 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          <span>{usernameCheck.message}</span>
                        </p>
                      ) : errorsSignUp.username ? (
                        <p className="text-destructive text-[10px] font-medium">
                          {errorsSignUp.username.message}
                        </p>
                      ) : null}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-0.5">
                      <Label htmlFor="signup-email" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="user@example.com"
                          className="pl-9 h-8.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                          {...registerSignUp("email", {
                            onBlur: handleCheckEmailBlur,
                          })}
                        />
                      </div>
                      {emailCheck.checking ? (
                        <p className="text-purple-400 text-[10px] flex items-center gap-1 mt-0.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>{emailCheck.message}</span>
                        </p>
                      ) : emailCheck.available === true ? (
                        <p className="text-emerald-400 text-[10px] flex items-center gap-1 mt-0.5 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{emailCheck.message}</span>
                        </p>
                      ) : emailCheck.available === false ? (
                        <p className="text-rose-400 text-[10px] flex items-center gap-1 mt-0.5 font-medium">
                          <AlertCircle className="w-3 h-3" />
                          <span>{emailCheck.message}</span>
                        </p>
                      ) : errorsSignUp.email ? (
                        <p className="text-destructive text-[10px] font-medium">
                          {errorsSignUp.email.message}
                        </p>
                      ) : null}
                    </div>

                    {/* Password Input & Security Strength */}
                    <div className="space-y-0.5">
                      <Label htmlFor="signup-password" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Mật khẩu
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-9 h-8.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                          {...registerSignUp("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Live Security Strength Indicators */}
                      {signUpPasswordVal.length > 0 && (
                        <div className="flex items-center gap-1 pt-1 text-[9px]">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-0.5 transition-colors",
                              hasUppercase
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-muted/30 text-muted-foreground/60 border-border/40"
                            )}
                          >
                            {hasUppercase ? "✓" : "✗"} Chữ hoa (A-Z)
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-0.5 transition-colors",
                              hasLowercase
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-muted/30 text-muted-foreground/60 border-border/40"
                            )}
                          >
                            {hasLowercase ? "✓" : "✗"} Chữ thường (a-z)
                          </span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded-md font-medium border flex items-center gap-0.5 transition-colors",
                              hasNumber
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-muted/30 text-muted-foreground/60 border-border/40"
                            )}
                          >
                            {hasNumber ? "✓" : "✗"} Chữ số (0-9)
                          </span>
                        </div>
                      )}

                      {errorsSignUp.password && (
                        <p className="text-destructive text-[10px] font-medium mt-0.5">
                          {errorsSignUp.password.message}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-0.5">
                      <Label htmlFor="signup-confirm-password" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Nhập lại mật khẩu
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type={showSignUpConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-9 h-8.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                          {...registerSignUp("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showSignUpConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {errorsSignUp.confirmPassword && (
                        <p className="text-destructive text-[10px] font-medium mt-0.5">
                          {errorsSignUp.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleRequestSignUpOtp}
                      disabled={isSendingOtp}
                      className="w-full h-9 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-purple-500/25 transition-all gap-2 text-xs mt-1"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang gửi OTP...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Tiếp tục (Nhận mã OTP)</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* STEP 2: Enter OTP Code */}
                {signUpStep === 2 && (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="signup-otp" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                        <span>Mã OTP 6 chữ số</span>
                        <span className="text-[10px] text-purple-400 font-normal">Hạn dùng 5 phút</span>
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                        <Input
                          id="signup-otp"
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          className="pl-9 h-11 rounded-xl bg-purple-950/20 border-purple-500/40 text-center font-bold tracking-[8px] text-base focus:border-purple-500 focus:ring-purple-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => setSignUpStep(1)}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Sửa thông tin</span>
                      </button>

                      <button
                        type="button"
                        disabled={resendTimer > 0 || isSendingOtp}
                        onClick={handleResendSignUpOtp}
                        className={cn(
                          "flex items-center gap-1 font-medium",
                          resendTimer > 0
                            ? "text-muted-foreground cursor-not-allowed"
                            : "text-purple-500 hover:text-purple-400"
                        )}
                      >
                        <RotateCcw className={cn("w-3.5 h-3.5", isSendingOtp && "animate-spin")} />
                        <span>
                          {resendTimer > 0 ? `Gửi lại sau (${resendTimer}s)` : "Gửi lại OTP"}
                        </span>
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmittingSignUp || otpCode.length !== 6}
                      className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-purple-500/25 transition-all gap-2 text-xs"
                    >
                      {isSubmittingSignUp ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang đăng ký...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Xác nhận & Đăng ký</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Link */}
              <div className="pt-2 border-t border-border/40 text-center text-xs">
                <span className="text-muted-foreground">Đã có tài khoản? </span>
                <button
                  type="button"
                  onClick={() => handleToggleMode("/signin")}
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:underline underline-offset-4"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </form>
          </div>

          {/* ========================================================================= */}
          {/* FLOATING SLIDING PENGUIN MASCOT OVERLAY PANEL (DESKTOP ONLY)              */}
          {/* ========================================================================= */}
          <div
            className={cn(
              "hidden md:flex absolute top-0 bottom-0 left-0 w-1/2 h-full bg-gradient-to-br from-purple-900/95 via-indigo-950 to-slate-950 text-white z-20 flex-col items-center justify-between p-6 sm:p-8 text-center shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]",
              isSignUp
                ? "translate-x-0 rounded-l-3xl rounded-r-none border-r border-white/10"
                : "translate-x-full rounded-r-3xl rounded-l-none border-l border-white/10"
            )}
          >
            {/* Background Glows */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-purple-500/30 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-indigo-500/30 blur-[80px] rounded-full pointer-events-none" />

            {/* Main Penguin Mascot Display */}
            <div className="relative z-10 my-auto flex flex-col items-center gap-3.5">
              <div className="relative group">
                <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 opacity-40 blur-lg group-hover:opacity-75 transition duration-500 animate-pulse" />
                
                <div className="relative w-40 h-40 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3 flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={isSignUp ? "/placeholderSignUp.png" : "/placeholder.png"}
                    alt="Penguin Mascot"
                    className="w-full h-full object-contain drop-shadow-2xl transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-1 max-w-xs">
                <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                  NexusChat
                </h2>
                <p className="text-[11px] text-purple-200/70 font-medium">
                  {isSignUp ? "Tạo tài khoản & trò chuyện tức thì" : "Ứng dụng trò chuyện thời gian thực hiện đại"}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleToggleMode(isSignUp ? "/signin" : "/signup")}
                className="mt-2 rounded-full border-white/30 hover:border-white hover:bg-white/10 text-white text-xs h-8 px-4 gap-1.5 backdrop-blur-sm bg-transparent"
              >
                <span>{isSignUp ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}</span>
                {isSignUp ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </Button>
            </div>

            <div className="relative z-10 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-purple-200 font-medium">
              Đồ án Công nghệ phần mềm 2026
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ========================================================= */}
      {/* FORGOT PASSWORD MODAL OVERLAY                             */}
      {/* ========================================================= */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card/95 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-5 text-foreground overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight">Đặt lại mật khẩu</h3>
                  <p className="text-[11px] text-muted-foreground">Xác thực OTP qua Email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="forgot-email" className="text-xs font-medium text-muted-foreground">
                    Nhập địa chỉ Email tài khoản của bạn:
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="user@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-9 h-10 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 h-9 rounded-xl text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="button"
                    onClick={handleRequestForgotOtp}
                    disabled={isForgotLoading || !forgotEmail}
                    className="flex-1 h-9 rounded-xl text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white gap-2 font-medium"
                  >
                    {isForgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Nhận mã OTP</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Enter OTP & New Password */}
            {forgotStep === 2 && (
              <div className="space-y-3.5">
                <div className="text-xs text-muted-foreground">
                  Mã OTP đã được gửi đến: <strong className="text-purple-400">{forgotEmail}</strong>
                </div>

                {/* OTP Input */}
                <div className="space-y-1">
                  <Label htmlFor="forgot-otp" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Mã OTP 6 chữ số
                  </Label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <Input
                      id="forgot-otp"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                      className="pl-9 h-10 rounded-xl bg-purple-950/20 border-purple-500/40 text-center font-bold tracking-[6px] text-sm focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPasswordVal}
                      onChange={(e) => setNewPasswordVal(e.target.value)}
                      className="pl-9 pr-9 h-9.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Xác nhận mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPasswordVal}
                      onChange={(e) => setConfirmPasswordVal(e.target.value)}
                      className="pl-9 pr-9 h-9.5 rounded-xl bg-muted/40 border-border/80 text-xs focus:border-purple-500 focus:ring-purple-500/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Đổi Email</span>
                  </button>

                  <button
                    type="button"
                    disabled={forgotResendTimer > 0 || isForgotLoading}
                    onClick={handleResendForgotOtp}
                    className={cn(
                      "flex items-center gap-1 font-medium",
                      forgotResendTimer > 0
                        ? "text-muted-foreground cursor-not-allowed"
                        : "text-purple-500 hover:text-purple-400"
                    )}
                  >
                    <RotateCcw className={cn("w-3.5 h-3.5", isForgotLoading && "animate-spin")} />
                    <span>
                      {forgotResendTimer > 0 ? `Gửi lại sau (${forgotResendTimer}s)` : "Gửi lại OTP"}
                    </span>
                  </button>
                </div>

                <Button
                  type="button"
                  onClick={handleCompletePasswordReset}
                  disabled={isForgotLoading || forgotOtp.length !== 6 || !newPasswordVal || !confirmPasswordVal}
                  className="w-full h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-purple-500/25 transition-all gap-2 text-xs"
                >
                  {isForgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Đặt lại mật khẩu</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
