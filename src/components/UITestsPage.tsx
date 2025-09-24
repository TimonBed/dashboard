import React, { useState } from "react";
import { TestTube, Code, Eye, Copy } from "lucide-react";
import { useHomeAssistantStore } from "../store/useHomeAssistantStore";
import * as Cards from "./cards";

export const UITestsPage: React.FC = () => {
  const [activeExample, setActiveExample] = useState("buttons");
  const [selectedCard, setSelectedCard] = useState("ButtonCard");
  // Load saved titles from localStorage or use defaults
  const loadSavedTitles = () => {
    const savedTitles = localStorage.getItem("ui-tests-card-titles");
    return savedTitles
      ? JSON.parse(savedTitles)
      : {
          ButtonCard: { title: "Sample Action", description: "This is a sample description" },
          ShutterCard: { title: "Sample Shutter", description: "This is a sample shutter" },
          LightSwitchCard: { title: "Sample Light", description: "This is a sample light" },
          SensorStateCard: { title: "Sample Sensor", description: "This is a sample sensor" },
        };
  };

  const [cardTitles, setCardTitles] = useState<{ [key: string]: { title: string; description?: string; entityId?: string } }>(loadSavedTitles());
  const { isConnected, isLoading, error, entities, sensors } = useHomeAssistantStore();

  const handleTitleChange = (cardId: string, title: string, description?: string, entityId?: string) => {
    const newTitles = {
      ...cardTitles,
      [cardId]: { title, description, entityId },
    };
    setCardTitles(newTitles);
    localStorage.setItem("ui-tests-card-titles", JSON.stringify(newTitles));
  };

  // Dynamically generate card components from the cards folder
  const cardComponents = Object.keys(Cards).map((cardName) => {
    const descriptions: { [key: string]: string } = {
      ButtonCard: "Basic interactive button card",
      ShutterCard: "Compact shutter control with position",
      LightSwitchCard: "Compact light switch - whole card is clickable",
      SensorStateCard: "Display sensor state and value from Home Assistant",
    };

    return {
      id: cardName,
      name: cardName
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      description: descriptions[cardName] || "Interactive card component",
    };
  });

  const renderSelectedCard = () => {
    const CardComponent = (Cards as any)[selectedCard];

    if (!CardComponent) {
      return <div className="text-red-500">Card component not found: {selectedCard}</div>;
    }

    const currentCardData = cardTitles[selectedCard] || { title: "Sample Card", description: "This is a sample card" };

    // Special handling for different card types
    if (selectedCard === "ButtonCard") {
      return (
        <CardComponent
          title={currentCardData.title}
          description={currentCardData.description}
          onClick={() => console.log(`${selectedCard} clicked`)}
          onTitleChange={(title, description, entityId) => handleTitleChange(selectedCard, title, description, entityId)}
          variant="primary"
        />
      );
    }

    if (selectedCard === "ShutterCard") {
      return (
        <CardComponent
          title={currentCardData.title}
          description={currentCardData.description}
          entityId={currentCardData.entityId}
          position={75}
          state="up"
          onUp={() => console.log("Up clicked")}
          onDown={() => console.log("Down clicked")}
          onSetPosition={(pos) => console.log(`Set position: ${pos}%`)}
          onTitleChange={(title, description, entityId) => handleTitleChange(selectedCard, title, description, entityId)}
        />
      );
    }

    if (selectedCard === "LightSwitchCard") {
      return (
        <CardComponent
          title={currentCardData.title}
          description={currentCardData.description}
          entityId={currentCardData.entityId}
          isOn={true}
          brightness={75}
          color="#fbbf24"
          onClick={() => console.log("Light clicked")}
          onTitleChange={(title, description, entityId) => handleTitleChange(selectedCard, title, description, entityId)}
        />
      );
    }

    if (selectedCard === "SensorStateCard") {
      return (
        <CardComponent
          title={currentCardData.title}
          description={currentCardData.description}
          entityId={currentCardData.entityId}
          onTitleChange={(title, description, entityId) => handleTitleChange(selectedCard, title, description, entityId)}
        />
      );
    }

    // Default props for other cards
    const commonProps = {
      title: currentCardData.title,
      description: currentCardData.description,
      entityId: currentCardData.entityId,
      onClick: () => console.log(`${selectedCard} clicked`),
      onTitleChange: (title: string, description?: string, entityId?: string) => handleTitleChange(selectedCard, title, description, entityId),
    };

    return <CardComponent {...commonProps} />;
  };

  const getCardCode = () => {
    // Special handling for ButtonCard to add variant
    if (selectedCard === "ButtonCard") {
      return `<${selectedCard}
  title="Sample Action"
  description="This is a sample description"
  onClick={() => console.log("${selectedCard} clicked")}
  variant="primary"
/>`;
    }

    // Special handling for shutter cards
    if (selectedCard === "ShutterCard") {
      return `<${selectedCard}
  title="Sample Shutter"
  description="This is a sample shutter"
  position={75}
  state="up"
  onUp={() => console.log("Up clicked")}
  onDown={() => console.log("Down clicked")}
  onSetPosition={(pos) => console.log(\`Set position: \${pos}%\`)}
/>`;
    }

    // Special handling for light switch cards
    if (selectedCard === "LightSwitchCard") {
      return `<${selectedCard}
  title="Sample Light"
  description="This is a sample light"
  isOn={true}
  brightness={75}
  color="#fbbf24"
  onClick={() => console.log("Light clicked")}
/>`;
    }

    // Special handling for sensor state cards
    if (selectedCard === "SensorStateCard") {
      return `<${selectedCard}
  title="Sample Sensor"
  description="This is a sample sensor"
  entityId="sensor.temperature_living_room"
/>`;
    }

    // Default props for other cards
    const commonProps = `  title="Sample Action"
  description="This is a sample description"
  onClick={() => console.log("${selectedCard} clicked")}`;

    return `<${selectedCard}
${commonProps}
/>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getCardCode());
  };

  // Fallback if no card components are found
  if (cardComponents.length === 0) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">UI Tests Page</h1>
            <p className="text-gray-600">No card components found. Check console for errors.</p>
            <p className="text-sm text-gray-500 mt-2">Cards object: {JSON.stringify(Object.keys(Cards))}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Simple test content */}
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">UI Development Playground</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Available Card Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardComponents.map((card) => (
              <div key={card.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{card.name}</h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Selected Card Preview</h2>
          <div className="max-w-md">{renderSelectedCard()}</div>
        </div>
      </div>
    </div>
  );
};
