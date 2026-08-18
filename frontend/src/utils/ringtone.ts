let audioCtx: AudioContext | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

export const startRingtone = () => {
  if (typeof window === "undefined") return;
  
  // Tránh tạo nhiều interval nếu gọi liên tục
  if (intervalId) return;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  // Khôi phục AudioContext nếu nó bị suspend (chính sách trình duyệt)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const playTone = () => {
    if (!audioCtx) return;
    
    // Một chuỗi nốt nhạc nhẹ nhàng (Arpeggio) thay vì tiếng chuông gắt
    const notes = [
      { freq: 523.25, time: 0 },    // C5
      { freq: 659.25, time: 0.15 }, // E5
      { freq: 783.99, time: 0.3 },  // G5
      { freq: 1046.50, time: 0.5 }  // C6
    ];

    notes.forEach(note => {
      const oscillator = audioCtx!.createOscillator();
      const gainNode = audioCtx!.createGain();

      // Dùng sóng sine hoặc triangle để âm thanh mềm mại giống tiếng chuông mộc/marimba
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(note.freq, audioCtx!.currentTime + note.time);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx!.destination);

      // Attack nhanh, Decay dài tạo cảm giác mượt mà (Pluck effect)
      gainNode.gain.setValueAtTime(0, audioCtx!.currentTime + note.time);
      gainNode.gain.linearRampToValueAtTime(0.15, audioCtx!.currentTime + note.time + 0.02); // mượt mà hơn
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx!.currentTime + note.time + 0.8);

      oscillator.start(audioCtx!.currentTime + note.time);
      oscillator.stop(audioCtx!.currentTime + note.time + 1.0);
    });
  };

  playTone(); // Phát ngay lần đầu tiên
  
  // Lặp lại mỗi 2 giây
  intervalId = setInterval(() => {
    playTone();
  }, 2000); 
};

export const stopRingtone = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};
