import { useFriendStore } from "@/stores/useFriendStore";
import FriendRequestItem from "./FriendRequestItem";
import { Button } from "../ui/button";
import { toast } from "sonner";

const SentRequests = () => {
  const { sentList, cancelRequest, loading } = useFriendStore();

  const handleCancel = async (requestId: string) => {
    try {
      await cancelRequest(requestId);
      toast.info("Đã hủy yêu cầu kết bạn");
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi hủy yêu cầu");
    }
  };

  if (!sentList || sentList.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Bạn chưa gửi lời mời kết bạn nào.
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      <>
        {sentList.map((req) => (
          <FriendRequestItem
            key={req._id}
            requestInfo={req}
            type="sent"
            actions={
              <div className="flex items-center gap-3">
                <p className="text-muted-foreground text-sm">Đang chờ trả lời...</p>
                <Button
                  size="sm"
                  variant="destructiveOutline"
                  onClick={() => handleCancel(req._id)}
                  disabled={loading}
                >
                  Hủy
                </Button>
              </div>
            }
          />
        ))}
      </>
    </div>
  );
};

export default SentRequests;