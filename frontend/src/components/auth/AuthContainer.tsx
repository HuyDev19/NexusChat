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
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  MessageSquare,
  Loader2,
  LogIn,
  UserPlus,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// Sign In Validation Schema
const signInSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
type SignInFormValues = z.infer<typeof signInSchema>;

// Sign Up Validation Schema
const signUpSchema = z.object({
  firstname: z.string().min(1, "Tên bắt buộc phải có"),
  lastname: z.string().min(1, "Họ bắt buộc phải có"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
type SignUpFormValues = z.infer<typeof signUpSchema>;

export function AuthContainer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, signUp } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  // Managed internal state for smooth continuous sliding transition
  const [isSignUp, setIsSignUp] = useState(() => location.pathname === "/signup");

  // Keep state synced if URL changes directly or on back/forward
  useEffect(() => {
    setIsSignUp(location.pathname === "/signup");
  }, [location.pathname]);

  // Smooth toggle mode handler
  const handleToggleMode = (targetPath: "/signin" | "/signup") => {
    setIsSignUp(targetPath === "/signup");
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
    formState: { errors: errorsSignUp, isSubmitting: isSubmittingSignUp },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  // Handlers
  const onSignInSubmit = async (data: SignInFormValues) => {
    await signIn(data.username, data.password);
    navigate("/chat");
  };

  const onSignUpSubmit = async (data: SignUpFormValues) => {
    await signUp(
      data.username,
      data.password,
      data.email,
      data.firstname,
      data.lastname
    );
    handleToggleMode("/signin");
  };

  return (
    <div className="w-full">
      <Card className="overflow-hidden p-0 border border-purple-500/30 bg-card/95 backdrop-blur-2xl shadow-2xl shadow-purple-500/15 rounded-3xl relative">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[510px] h-[510px] relative">
          
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
              onSubmit={handleSubmitSignIn(onSignInSubmit)}
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
                    <Label htmlFor="signin-password" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Mật khẩu
                    </Label>
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
          {/* RIGHT SIDE: Sign Up Form (Positioned on Right 50%)        */}
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
                      Tạo tài khoản mới
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Đăng ký ngay để bắt đầu trò chuyện cùng mọi người
                    </p>
                  </div>
                </div>

                {/* Fields */}
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
                        {...registerSignUp("username")}
                      />
                    </div>
                    {errorsSignUp.username && (
                      <p className="text-destructive text-[10px] font-medium">
                        {errorsSignUp.username.message}
                      </p>
                    )}
                  </div>

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
                        {...registerSignUp("email")}
                      />
                    </div>
                    {errorsSignUp.email && (
                      <p className="text-destructive text-[10px] font-medium">
                        {errorsSignUp.email.message}
                      </p>
                    )}
                  </div>

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
                    {errorsSignUp.password && (
                      <p className="text-destructive text-[10px] font-medium">
                        {errorsSignUp.password.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmittingSignUp}
                  className="w-full h-9 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-purple-500/25 transition-all gap-2 text-xs mt-1"
                >
                  {isSubmittingSignUp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Tạo tài khoản</span>
                    </>
                  )}
                </Button>
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
                {/* Outer Glow */}
                <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 opacity-40 blur-lg group-hover:opacity-75 transition duration-500 animate-pulse" />
                
                {/* Penguin Image Card */}
                <div className="relative w-40 h-40 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-3 flex items-center justify-center shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={isSignUp ? "/placeholderSignUp.png" : "/placeholder.png"}
                    alt="Penguin Mascot"
                    className="w-full h-full object-contain drop-shadow-2xl transition-all duration-300"
                  />
                </div>
              </div>

              {/* Minimal Text */}
              <div className="space-y-1 max-w-xs">
                <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                  NexusChat
                </h2>
                <p className="text-[11px] text-purple-200/70 font-medium">
                  {isSignUp ? "Tạo tài khoản & trò chuyện tức thì" : "Ứng dụng trò chuyện thời gian thực hiện đại"}
                </p>
              </div>

              {/* Action button inside sliding banner */}
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

            {/* Minimal Badge */}
            <div className="relative z-10 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] text-purple-200 font-medium">
              Đồ án Công nghệ phần mềm 2026
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
