import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ImagePlus, Music, Play, Pause, Loader2, Search, X } from "lucide-react";
import { useStoryStore } from "@/stores/useStoryStore";
import { toast } from "sonner";

interface ITunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100: string;
  previewUrl: string;
}

export default function StoryCreatorModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ITunesTrack[]>([]);
  const [selectedMusic, setSelectedMusic] = useState<ITunesTrack | null>(null);
  
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createStory, loading } = useStoryStore();

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewFile(null);
      setSelectedMusic(null);
      setSearchQuery("");
      setSearchResults([]);
      stopAudio();
    } else {
      // Auto fetch some suggested music
      if (searchResults.length === 0 && !isSearchingMusic) {
        handleSuggestMusic();
      }
    }
  }, [open]);

  const handleSuggestMusic = async () => {
    try {
      setIsSearchingMusic(true);
      const res = await fetch(`https://itunes.apple.com/search?term=tiktok+remix+chill&entity=song&limit=10`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlayingTrackId(null);
  };

  const togglePlay = (track: ITunesTrack) => {
    if (playingTrackId === track.trackId) {
      stopAudio();
    } else {
      stopAudio();
      const newAudio = new Audio(track.previewUrl);
      newAudio.play().catch(e => console.error(e));
      newAudio.onended = () => setPlayingTrackId(null);
      audioRef.current = newAudio;
      setPlayingTrackId(track.trackId);
    }
  };

  const handleSearchMusic = async () => {
    if (!searchQuery.trim()) {
      handleSuggestMusic();
      return;
    }
    try {
      setIsSearchingMusic(true);
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=10`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      toast.error("Lỗi khi tìm nhạc");
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (selected.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
      const reader = new FileReader();
      reader.onload = (e) => setPreviewFile(e.target?.result as string);
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Vui lòng chọn ảnh hoặc video");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mediaType", mediaType);
    if (selectedMusic) {
      formData.append("musicTitle", selectedMusic.trackName);
      formData.append("musicArtist", selectedMusic.artistName);
      formData.append("musicCoverUrl", selectedMusic.artworkUrl100);
      formData.append("musicPreviewUrl", selectedMusic.previewUrl);
    }

    try {
      await createStory(formData);
      toast.success("Đăng Story thành công!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Đăng Story thất bại!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/40 rounded-3xl">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-center font-bold text-lg">Tạo Story mới</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[65vh] beautiful-scrollbar">
          {/* File Picker */}
          {!previewFile ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-[300px] border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <ImagePlus className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Nhấn để chọn ảnh / video</p>
            </div>
          ) : (
            <div className="relative w-full h-[300px] rounded-2xl overflow-hidden bg-black flex items-center justify-center group">
              {mediaType === "video" ? (
                <video src={previewFile} className="max-w-full max-h-full object-contain" controls />
              ) : (
                <img src={previewFile} alt="Preview" className="max-w-full max-h-full object-contain" />
              )}
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  setFile(null);
                  setPreviewFile(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <input type="file" hidden ref={fileInputRef} accept="image/*,video/*" onChange={handleFileChange} />

          {/* Music Selection */}
          <div className="space-y-3 bg-muted/20 p-3 rounded-2xl border border-border/40">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Music className="w-4 h-4 text-purple-500" />
              <span>Thêm nhạc</span>
            </div>
            
            {selectedMusic ? (
              <div className="flex items-center justify-between bg-background p-2 rounded-xl border border-purple-500/30">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img src={selectedMusic.artworkUrl100} className="w-10 h-10 rounded-md object-cover" alt="cover" />
                  <div className="truncate">
                    <p className="text-sm font-semibold truncate max-w-[200px]">{selectedMusic.trackName}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedMusic.artistName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => togglePlay(selectedMusic)} className="rounded-full w-8 h-8">
                    {playingTrackId === selectedMusic.trackId ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedMusic(null); stopAudio(); }} className="rounded-full w-8 h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm bài hát..." 
                      className="pl-9 bg-background rounded-xl border-border/50 h-9"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchMusic()}
                    />
                  </div>
                  <Button onClick={handleSearchMusic} disabled={isSearchingMusic} className="h-9 rounded-xl">
                    {isSearchingMusic ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tìm"}
                  </Button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="max-h-[150px] overflow-y-auto space-y-1 beautiful-scrollbar pr-1">
                    {!searchQuery.trim() && (
                      <p className="text-xs font-semibold text-muted-foreground pb-1 px-1">Gợi ý cho bạn</p>
                    )}
                    {searchResults.map(track => (
                      <div key={track.trackId} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg cursor-pointer group transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden flex-1" onClick={() => setSelectedMusic(track)}>
                          <img src={track.artworkUrl100} className="w-8 h-8 rounded object-cover" alt="cover" />
                          <div className="truncate">
                            <p className="text-sm font-medium truncate group-hover:text-purple-500 transition-colors">{track.trackName}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artistName}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); togglePlay(track); }} 
                          className="rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {playingTrackId === track.trackId ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  !isSearchingMusic && <p className="text-xs text-center text-muted-foreground py-2">Không có kết quả</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-border/40">
          <Button 
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md shadow-purple-500/25 h-11"
            disabled={!file || loading}
            onClick={handleSubmit}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Đăng Story
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
