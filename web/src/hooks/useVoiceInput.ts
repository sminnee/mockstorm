import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceInputOptions {
  onSubmit: (text: string) => void;
  silenceTimeoutMs?: number;
}

interface UseVoiceInputReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
}

const SILENCE_TIMEOUT_DEFAULT = 1500;
const MAX_RAPID_RESTARTS = 3;
const RAPID_RESTART_WINDOW = 2000;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function useVoiceInput({
  onSubmit,
  silenceTimeoutMs = SILENCE_TIMEOUT_DEFAULT,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTextRef = useRef("");
  const listeningRef = useRef(false);
  const restartTimesRef = useRef<number[]>([]);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const hasApi = typeof window !== "undefined" && getSpeechRecognitionClass() !== null;
  const isSupported = hasApi && serviceAvailable;

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    finalTextRef.current = "";
    setTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    resetState();
  }, [clearSilenceTimer, resetState]);

  const startListening = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return;

    // Stop any existing instance
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finals = finalTextRef.current;
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result?.[0]?.transcript ?? "";
        if (result?.isFinal) {
          finals += text;
          finalTextRef.current = finals;

          // Reset silence timer for pause detection
          clearSilenceTimer();
          silenceTimerRef.current = setTimeout(() => {
            const accumulated = finalTextRef.current.trim();
            if (accumulated) {
              onSubmitRef.current(accumulated);
            }
            finalTextRef.current = "";
            setTranscript("");
          }, silenceTimeoutMs);
        } else {
          interim += text;
        }
      }

      setTranscript(finals + interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("[voice] onerror:", {
        error: event.error,
        message: event.message,
      });
      if (event.error === "no-speech") {
        return;
      }
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Microphone access denied. Check browser permissions.");
        stopListening();
        return;
      }
      if (event.error === "network") {
        setError("Speech recognition service unavailable in this browser.");
        setServiceAvailable(false);
        stopListening();
        return;
      }
      if (event.error === "audio-capture") {
        setError("No microphone detected.");
        stopListening();
        return;
      }
      if (event.error === "aborted") {
        return;
      }
      setError(`Voice error: ${event.error}`);
      stopListening();
    };

    recognition.onend = () => {
      if (!listeningRef.current) return;

      // Guard against rapid restart loops
      const now = Date.now();
      restartTimesRef.current = restartTimesRef.current.filter(
        (t) => now - t < RAPID_RESTART_WINDOW,
      );
      if (restartTimesRef.current.length >= MAX_RAPID_RESTARTS) {
        console.warn("[voice] rapid restart limit reached, stopping");
        setError("Voice recognition keeps stopping. Try again later.");
        stopListening();
        return;
      }

      restartTimesRef.current.push(now);
      try {
        recognition.start();
      } catch {
        stopListening();
      }
    };

    setError(null);
    recognitionRef.current = recognition;
    listeningRef.current = true;
    restartTimesRef.current = [];
    setIsListening(true);
    resetState();

    try {
      recognition.start();
    } catch {
      stopListening();
    }
  }, [clearSilenceTimer, resetState, silenceTimeoutMs, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  };
}
