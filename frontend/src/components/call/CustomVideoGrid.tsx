import React from "react";
import { Track, RoomEvent } from "livekit-client";
import { useTracks } from "@livekit/components-react";
import CustomParticipantTile from "./CustomParticipantTile";

const CustomVideoGrid = () => {
  // Lấy tất cả các luồng camera và screen share (bao gồm cả local participant chưa subscribe)
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { updateOnlyOn: [RoomEvent.ActiveSpeakersChanged], onlySubscribed: false }
  );

  // Phân tách screen share và camera
  const screenShareTracks = tracks.filter((t) => t.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((t) => t.source === Track.Source.Camera);

  // Nếu có người đang share màn hình
  if (screenShareTracks.length > 0) {
    const mainTrack = screenShareTracks[0]; // Hiển thị màn hình share đầu tiên (nếu có nhiều)
    return (
      <div className="flex flex-col md:flex-row w-full h-full gap-2 p-2">
        {/* Vùng chính (Màn hình Share) */}
        <div className="flex-1 rounded-xl overflow-hidden min-h-0 bg-black">
          <CustomParticipantTile trackRef={mainTrack} />
        </div>

        {/* Sidebar chứa Camera của mọi người */}
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto w-full md:w-64 shrink-0 max-h-48 md:max-h-full scrollbar-thin">
          {cameraTracks.map((track) => (
            <div key={track.participant.sid + track.source} className="w-32 md:w-full h-24 md:h-36 shrink-0">
              <CustomParticipantTile trackRef={track} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cấu hình CSS Grid dựa vào số lượng Camera Track
  const count = cameraTracks.length;
  let gridClass = "grid-cols-1";
  
  if (count === 2) gridClass = "grid-cols-1 md:grid-cols-2";
  else if (count === 3 || count === 4) gridClass = "grid-cols-2";
  else if (count > 4) gridClass = "grid-cols-2 md:grid-cols-3";

  return (
    <div className={`w-full h-full p-2 grid gap-2 ${gridClass} auto-rows-fr`}>
      {cameraTracks.map((track) => (
        <div key={track.participant.sid} className="w-full h-full min-h-0">
          <CustomParticipantTile trackRef={track} />
        </div>
      ))}
    </div>
  );
};

export default CustomVideoGrid;
