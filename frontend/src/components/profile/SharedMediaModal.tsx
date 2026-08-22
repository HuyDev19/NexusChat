import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useChatStore } from "@/stores/useChatStore";
import { FileText, Link, Image as ImageIcon, Download, File } from "lucide-react";

interface SharedMediaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  defaultTab?: "media" | "docs" | "links";
}

const SharedMediaModal = ({ open, onOpenChange, conversationId, defaultTab = "media" }: SharedMediaModalProps) => {
  const messages = useChatStore(state => state.messages[conversationId]?.items || []);

  const images = messages.filter(m => !!m.imgUrl);
  const files = messages.filter(m => !!m.audioUrl); // Mapping audio to files for now since no other file uploads
  const links = messages.filter(m => m.content && /https?:\/\/[^\s]+/.test(m.content));

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Kho lưu trữ chung</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="size-4" />
              <span className="hidden sm:inline">Ảnh & Video</span>
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <FileText className="size-4" />
              <span className="hidden sm:inline">Tài liệu</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <Link className="size-4" />
              <span className="hidden sm:inline">Links</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="media" className="flex-1 overflow-y-auto beautiful-scrollbar mt-4">
            {images.length === 0 ? (
              <EmptyState icon={ImageIcon} text="Chưa có ảnh/video nào được chia sẻ" />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {images.map(img => (
                  <div key={img._id} className="aspect-square relative group rounded-md overflow-hidden bg-muted">
                    <img src={img.imgUrl!} alt="Shared" className="w-full h-full object-cover" />
                    <a
                      href={img.imgUrl!}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Download className="size-6" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="flex-1 overflow-y-auto beautiful-scrollbar mt-4">
            {files.length === 0 ? (
              <EmptyState icon={FileText} text="Chưa có tài liệu nào được chia sẻ" />
            ) : (
              <div className="space-y-2">
                {files.map(file => (
                  <div key={file._id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 border border-border/50">
                    <div className="size-10 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center shrink-0">
                      <File className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">File âm thanh / Tài liệu đính kèm</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(file.createdAt)}
                      </p>
                    </div>
                    <a href={file.audioUrl!} target="_blank" rel="noreferrer" className="p-2 hover:bg-muted rounded-full">
                      <Download className="size-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="flex-1 overflow-y-auto beautiful-scrollbar mt-4">
            {links.length === 0 ? (
              <EmptyState icon={Link} text="Chưa có link nào được chia sẻ" />
            ) : (
              <div className="space-y-2">
                {links.map(link => {
                  const urlMatch = link.content?.match(/https?:\/\/[^\s]+/);
                  const url = urlMatch ? urlMatch[0] : "#";
                  return (
                    <a key={link._id} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 border border-border/50 transition-colors">
                      <div className="size-10 bg-teal-500/10 text-teal-500 rounded-lg flex items-center justify-center shrink-0">
                        <Link className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-blue-500 hover:underline">{url}</p>
                        <p className="text-xs text-muted-foreground truncate">{link.content}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const EmptyState = ({ icon: Icon, text }: { icon: any, text: string }) => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
    <div className="size-16 rounded-full bg-muted flex items-center justify-center">
      <Icon className="size-8" />
    </div>
    <p>{text}</p>
  </div>
);

export default SharedMediaModal;
