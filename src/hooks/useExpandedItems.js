import { useState, useCallback, useContext, useEffect } from 'react';
import { ProgramContext } from '../../src/context/programContext';

const useExpandedItems = (initialWorkouts = []) => {
  const [expandedItemId, setExpandedItemId] = useState(null);
  const [isProgramFormExpanded, setIsProgramFormExpanded] = useState(true);
  const { setActiveWorkout } = useContext(ProgramContext);

  const toggleItem = useCallback(
    itemId => {
      setExpandedItemId(prevId => {
        if (prevId === itemId) {
          // If the same item is clicked, collapse it and clear active workout
          // setActiveWorkout(null);
          return null;
        } else {
          // Expand the clicked item, set it as active, and collapse the program form
          // setActiveWorkout(itemId);
          setIsProgramFormExpanded(false);
          return itemId;
        }
      });
    },
    [setActiveWorkout]
  );

  useEffect(() => {
    // Now, react to changes in expandedItemId
    if (expandedItemId === null) {
      setActiveWorkout(null); // Collapse and clear active workout
    } else {
      setActiveWorkout(expandedItemId); // Set new active workout
    }
  }, []);

  const toggleProgramForm = useCallback(() => {
    setIsProgramFormExpanded(prev => {
      if (!prev) {
        // If we're expanding the program form, collapse any expanded workout and clear active workout
        setExpandedItemId(null);
        setActiveWorkout(null);
      }
      return !prev;
    });
  }, [setActiveWorkout]);

  const collapseAll = useCallback(() => {
    setExpandedItemId(null);
    setIsProgramFormExpanded(false);
    setActiveWorkout(null);
  }, [setActiveWorkout]);

  const isItemExpanded = useCallback(
    itemId => {
      return expandedItemId === itemId;
    },
    [expandedItemId]
  );

  return {
    expandedItemId,
    isProgramFormExpanded,
    toggleItem,
    toggleProgramForm,
    collapseAll,
    isItemExpanded
  };
};

export default useExpandedItems;
