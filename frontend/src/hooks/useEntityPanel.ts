import { useState } from 'react';

export function useEntityPanel<T>() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null);

  function openPanel(entity: T | null = null) {
    setSelectedEntity(entity);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setSelectedEntity(null);
  }

  return {
    panelOpen,
    selectedEntity,
    setPanelOpen,
    setSelectedEntity,
    openPanel,
    closePanel,
  };
}
