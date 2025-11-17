import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMic, FiPause, FiPlay, FiTrash2, FiSend } from 'react-icons/fi';

const VoiceRecorder = ({
  onRecordingComplete,
  disabled = false,
  className = ''
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        clearInterval(recordingTimerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    setPlaybackTime(0);
    setDuration(0);
  };

  const playPauseAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
        cancelAnimationFrame(animationFrameRef.current);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
        updatePlaybackTime();
      }
    }
  };

  const updatePlaybackTime = () => {
    if (audioRef.current) {
      setPlaybackTime(audioRef.current.currentTime);
      animationFrameRef.current = requestAnimationFrame(updatePlaybackTime);
    }
  };

  const handleAudioLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackTime(0);
    cancelAnimationFrame(animationFrameRef.current);
  };

  const sendRecording = () => {
    if (audioBlob && onRecordingComplete) {
      onRecordingComplete({
        blob: audioBlob,
        url: audioUrl,
        duration: recordingTime,
        type: 'audio/webm',
        name: `Voice message ${formatTime(recordingTime)}`
      });
      deleteRecording();
    }
  };

  const handleSeek = (e) => {
    const newTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setPlaybackTime(newTime);
    }
  };

  return (
    <div className={`bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 ${className}`}>
      {audioUrl ? (
        /* Recording Preview */
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={playPauseAudio}
              className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600
                       rounded-full flex items-center justify-center text-white
                       shadow-lg hover:shadow-xl transition-shadow"
            >
              {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
            </motion.button>
          </div>

          <div className="flex-1">
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Voice Message</span>
                <span>{formatTime(playbackTime)} / {formatTime(duration || recordingTime)}</span>
              </div>
              <div
                className="h-2 bg-gray-200 rounded-full overflow-hidden cursor-pointer"
                onClick={handleSeek}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-pink-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((playbackTime || 0) / (duration || recordingTime)) * 100}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={deleteRecording}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50
                       rounded-lg transition-colors"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={sendRecording}
              className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white
                       hover:from-blue-600 hover:to-blue-700 rounded-lg
                       transition-colors shadow-md hover:shadow-lg"
              title="Send"
            >
              <FiSend className="w-4 h-4" />
            </motion.button>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            onLoadedMetadata={handleAudioLoaded}
            onEnded={handleAudioEnded}
            className="hidden"
          />
        </div>
      ) : (
        /* Recording Interface */
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <motion.div
              animate={isRecording && !isPaused ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600
                       rounded-full flex items-center justify-center text-white
                       shadow-lg"
            >
              <FiMic className="w-5 h-5" />
            </motion.div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AnimatePresence mode="wait">
                {isRecording && (
                  <motion.div
                    key="recording"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: isPaused ? 4 : [4, 16, 8, 16, 4],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.1,
                            repeatType: 'reverse'
                          }}
                          className="w-1 bg-red-500 rounded-full"
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium text-red-600">
                      {isPaused ? 'Paused' : 'Recording'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="text-sm font-medium text-gray-700">
                {formatTime(recordingTime)}
              </span>
            </div>

            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-pink-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(recordingTime / 300) * 100}%` }} // Max 5 minutes
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isRecording ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startRecording}
                disabled={disabled}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600
                         text-white rounded-lg font-medium text-sm
                         hover:from-red-600 hover:to-pink-700
                         transition-colors shadow-md hover:shadow-lg
                         disabled:opacity-50"
              >
                Start Recording
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={pauseRecording}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100
                           rounded-lg transition-colors"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? <FiPlay className="w-4 h-4" /> : <FiPause className="w-4 h-4" />}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200
                           rounded-lg transition-colors font-medium text-sm"
                  title="Stop"
                >
                  Stop
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteRecording}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50
                           rounded-lg transition-colors"
                  title="Cancel"
                >
                  <FiTrash2 className="w-4 h-4" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;