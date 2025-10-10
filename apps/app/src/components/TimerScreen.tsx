import { useEffect, useRef, useState } from "react";

interface TimerScreenProps {
  onBack: () => void;
}

export function TimerScreen({ onBack }: TimerScreenProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(90); // Default 90 seconds
  const [mode, setMode] = useState<"countdown" | "stopwatch">("countdown");
  const [presets] = useState([
    { name: "Opening Speech", duration: 90 },
    { name: "Closing Speech", duration: 60 },
    { name: "Point of Information", duration: 30 },
    { name: "Moderated Caucus", duration: 120 },
    { name: "Unmoderated Caucus", duration: 300 },
    { name: "Custom", duration: 0 },
  ]);
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (mode === "countdown") {
            if (prevTime <= 1) {
              setIsRunning(false);
              setIsFinished(true);
              playAlarm();
              return 0;
            }
            return prevTime - 1;
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode]);

  const playAlarm = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 1,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    setIsFinished(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsFinished(false);
    if (mode === "countdown") {
      setTime(selectedDuration);
    } else {
      setTime(0);
    }
  };

  const handlePresetSelect = (preset: (typeof presets)[0]) => {
    if (preset.name === "Custom") {
      const customDuration = customMinutes * 60 + customSeconds;
      setSelectedDuration(customDuration);
      setTime(mode === "countdown" ? customDuration : 0);
    } else {
      setSelectedDuration(preset.duration);
      setTime(mode === "countdown" ? preset.duration : 0);
    }
    setIsRunning(false);
    setIsFinished(false);
  };

  const handleModeChange = (newMode: "countdown" | "stopwatch") => {
    setMode(newMode);
    setIsRunning(false);
    setIsFinished(false);
    if (newMode === "countdown") {
      setTime(selectedDuration);
    } else {
      setTime(0);
    }
  };

  const getTimerColor = () => {
    if (isFinished) return "text-red-500";
    if (mode === "countdown" && time <= 10) return "text-red-500";
    if (mode === "countdown" && time <= 30) return "text-yellow-500";
    return "text-gray-900";
  };

  const getProgressPercentage = () => {
    if (mode === "stopwatch") return 0;
    return ((selectedDuration - time) / selectedDuration) * 100;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="mb-3 text-3xl font-bold text-gray-900">
          ⏱️ Speech Timer
        </h2>
        <p className="text-lg text-gray-600">
          Time your speeches and manage debate sessions
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* Mode Toggle */}
        <div className="mb-8 flex justify-center">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => handleModeChange("countdown")}
              className={`rounded-md px-6 py-2 font-medium transition-colors ${
                mode === "countdown"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Countdown Timer
            </button>
            <button
              onClick={() => handleModeChange("stopwatch")}
              className={`rounded-md px-6 py-2 font-medium transition-colors ${
                mode === "stopwatch"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Stopwatch
            </button>
          </div>
        </div>

        {/* Timer Display */}
        <div className="mb-8 text-center">
          <div
            className={`mb-4 font-mono text-8xl font-bold ${getTimerColor()}`}
          >
            {formatTime(time)}
          </div>

          {mode === "countdown" && (
            <div className="mx-auto mb-4 h-3 w-full max-w-md rounded-full bg-gray-200">
              <div
                className={`h-3 rounded-full transition-all duration-1000 ${
                  time <= 10
                    ? "bg-red-500"
                    : time <= 30
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          )}

          {isFinished && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-semibold text-red-800">⏰ Time's up!</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mb-8 flex justify-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="rounded-lg bg-green-500 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-green-600"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="rounded-lg bg-yellow-500 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-yellow-600"
            >
              Pause
            </button>
          )}
          <button
            onClick={handleReset}
            className="rounded-lg bg-gray-500 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-gray-600"
          >
            Reset
          </button>
        </div>

        {/* Presets */}
        {mode === "countdown" && (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-900">
              Quick Presets
            </h3>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              {presets.slice(0, -1).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selectedDuration === preset.duration
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatTime(preset.duration)}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Timer */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="mb-3 font-medium text-gray-900">
                Custom Duration
              </h4>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customMinutes}
                    onChange={(e) =>
                      setCustomMinutes(parseInt(e.target.value) || 0)
                    }
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-center"
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) =>
                      setCustomSeconds(parseInt(e.target.value) || 0)
                    }
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-center"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
                <button
                  onClick={() =>
                    handlePresetSelect({ name: "Custom", duration: 0 })
                  }
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  Set Custom Timer
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Custom duration:{" "}
                {formatTime(customMinutes * 60 + customSeconds)}
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <h3 className="mb-3 font-semibold text-blue-900">💡 Timer Tips</h3>
          <div className="grid grid-cols-1 gap-4 text-sm text-blue-800 md:grid-cols-2">
            <div>
              <h4 className="mb-1 font-medium">For Speeches:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Opening speeches: 90 seconds</li>
                <li>• Closing speeches: 60 seconds</li>
                <li>• Points of Information: 30 seconds</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-1 font-medium">For Caucuses:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Moderated caucus: 2 minutes</li>
                <li>• Unmoderated caucus: 5 minutes</li>
                <li>• Use stopwatch for open discussions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
