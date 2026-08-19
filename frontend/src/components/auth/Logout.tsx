
import { useAuthStore } from "@/stores/useAuthStore";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";

const Logout = () => {
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      onClick={handleLogout}
      className="flex items-center gap-2 w-full cursor-pointer"
    >
      <LogOut className="text-destructive size-4" />
      <span>Logout</span>
    </div>
  );
};

export default Logout;