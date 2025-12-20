// import '../fabricCustomRegistration';
import { useEffect, useCallback, useRef } from 'react';
import { useEventGuiStore, PROPERTIES_TO_INCLUDE } from '@/zustand';

const useUndoRedo = () => {
  const { canvas, addToUndoStack, undo, redo, undoStack } = useEventGuiStore();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // :::::::::::::::: Function: appends undo state
  const handleObjectModified = useCallback(() => {
    if (!canvas) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const jsonState = JSON.stringify(
        canvas.toJSON(PROPERTIES_TO_INCLUDE)
      );
      addToUndoStack(jsonState);
    }, 300);
  }, [canvas, addToUndoStack]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;

    const eventsToListen = [
      'object:modified',
      'object:added',
      'object:removed',
    ];

    // ::::::::::::::: Loop through events to call function
    eventsToListen.forEach((event) => {
      canvas.on(event, handleObjectModified);
    });

    return () => {
      eventsToListen.forEach((event) => {
        canvas.off(event, handleObjectModified);
      });
    };
  }, [canvas, addToUndoStack]);

  return { undo, redo };
};

export default useUndoRedo;
