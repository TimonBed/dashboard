import React, { useState } from "react";
import { Tablet, Lightbulb, RotateCcw } from "lucide-react";
import { LightSwitchCard, SensorStateCard } from "./cards";

export const TabletDashboard: React.FC = () => {
  // Load saved data from localStorage or use defaults
  const loadSavedData = () => {
    const savedTitles = localStorage.getItem("tablet-dashboard-titles");
    const savedLightStates = localStorage.getItem("tablet-dashboard-light-states");
    const savedSensorTitles = localStorage.getItem("tablet-dashboard-sensor-titles");

    return {
      titles: savedTitles
        ? JSON.parse(savedTitles)
        : {
            livingRoom: { title: "Living Room Light", entityId: undefined },
            bedroom: { title: "Bedroom Light", entityId: undefined },
            kitchen: { title: "Kitchen Light", entityId: undefined },
          },
      lightStates: savedLightStates
        ? JSON.parse(savedLightStates)
        : {
            livingRoom: { isOn: true, brightness: 75, color: "#fbbf24" },
            bedroom: { isOn: false, brightness: 50, color: "#3b82f6" },
            kitchen: { isOn: false, brightness: 60, color: "#34d399" },
          },
      sensorTitles: savedSensorTitles
        ? JSON.parse(savedSensorTitles)
        : {
            temperature: { title: "Temperature", entityId: undefined },
            humidity: { title: "Humidity", entityId: undefined },
          },
    };
  };

  const savedData = loadSavedData();

  const [lightStates, setLightStates] = useState<{ [key: string]: { isOn: boolean; brightness: number; color: string } }>(savedData.lightStates);
  const [cardTitles, setCardTitles] = useState<{ [key: string]: { title: string; entityId?: string } }>(savedData.titles);
  const [sensorTitles, setSensorTitles] = useState<{ [key: string]: { title: string; entityId?: string } }>(savedData.sensorTitles);

  // Debug logging
  React.useEffect(() => {
    const livingRoomEntityId = cardTitles.livingRoom.entityId;
    const bedroomEntityId = cardTitles.bedroom.entityId;
    const kitchenEntityId = cardTitles.kitchen?.entityId;

    console.log("TabletDashboard state:", {
      livingRoom: {
        entityId: livingRoomEntityId,
        title: cardTitles.livingRoom.title,
        hasEntityId: !!livingRoomEntityId,
      },
      bedroom: {
        entityId: bedroomEntityId,
        title: cardTitles.bedroom.title,
        hasEntityId: !!bedroomEntityId,
      },
      kitchen: {
        entityId: kitchenEntityId,
        title: cardTitles.kitchen?.title,
        hasEntityId: !!kitchenEntityId,
      },
      sameEntityIdLivingBedroom: livingRoomEntityId === bedroomEntityId && livingRoomEntityId !== undefined,
      sameEntityIdLivingKitchen: livingRoomEntityId === kitchenEntityId && livingRoomEntityId !== undefined,
      sameEntityIdBedroomKitchen: bedroomEntityId === kitchenEntityId && bedroomEntityId !== undefined,
    });
  }, [cardTitles]);

  const handleLightToggle = (lightId: string) => {
    const newStates = {
      ...lightStates,
      [lightId]: {
        ...lightStates[lightId],
        isOn: !lightStates[lightId].isOn,
      },
    };
    setLightStates(newStates);
    localStorage.setItem("tablet-dashboard-light-states", JSON.stringify(newStates));
  };

  const handleBrightnessChange = (lightId: string, brightness: number) => {
    const newStates = {
      ...lightStates,
      [lightId]: {
        ...lightStates[lightId],
        brightness: Math.max(10, Math.min(100, brightness)),
      },
    };
    setLightStates(newStates);
    localStorage.setItem("tablet-dashboard-light-states", JSON.stringify(newStates));
  };

  const handleColorChange = (lightId: string, color: string) => {
    const newStates = {
      ...lightStates,
      [lightId]: {
        ...lightStates[lightId],
        color,
      },
    };
    setLightStates(newStates);
    localStorage.setItem("tablet-dashboard-light-states", JSON.stringify(newStates));
  };

  const handleTitleChange = (lightId: string, title: string, entityId?: string) => {
    const newTitles = {
      ...cardTitles,
      [lightId]: { ...cardTitles[lightId], title, entityId },
    };
    console.log(`TabletDashboard: Updating ${lightId} with entityId=${entityId}`);
    setCardTitles(newTitles);
    localStorage.setItem("tablet-dashboard-titles", JSON.stringify(newTitles));
  };

  const handleSensorTitleChange = (sensorId: string, title: string, entityId?: string) => {
    const newTitles = {
      ...sensorTitles,
      [sensorId]: { ...sensorTitles[sensorId], title, entityId },
    };
    console.log(`TabletDashboard: Updating sensor ${sensorId} with entityId=${entityId}`);
    setSensorTitles(newTitles);
    localStorage.setItem("tablet-dashboard-sensor-titles", JSON.stringify(newTitles));
  };

  const resetToDefaults = () => {
    const defaultTitles = {
      livingRoom: { title: "Living Room Light", entityId: undefined },
      bedroom: { title: "Bedroom Light", entityId: undefined },
      kitchen: { title: "Kitchen Light", entityId: undefined },
    };
    const defaultLightStates = {
      livingRoom: { isOn: true, brightness: 75, color: "#fbbf24" },
      bedroom: { isOn: false, brightness: 50, color: "#3b82f6" },
      kitchen: { isOn: false, brightness: 60, color: "#34d399" },
    };
    const defaultSensorTitles = {
      temperature: { title: "Temperature", entityId: undefined },
      humidity: { title: "Humidity", entityId: undefined },
    };

    setCardTitles(defaultTitles);
    setLightStates(defaultLightStates);
    setSensorTitles(defaultSensorTitles);
    localStorage.setItem("tablet-dashboard-titles", JSON.stringify(defaultTitles));
    localStorage.setItem("tablet-dashboard-light-states", JSON.stringify(defaultLightStates));
    localStorage.setItem("tablet-dashboard-sensor-titles", JSON.stringify(defaultSensorTitles));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <Tablet className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Tablet Dashboard</h1>
            <p className="text-gray-400 mt-1">Smart home control panel</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">2 Devices Connected</span>
            </div>
            <div className="text-gray-400">{new Date().toLocaleTimeString()}</div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-300 rounded-xl transition-all duration-300 border border-gray-600/50"
            title="Reset to default settings"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Reset</span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Living Room Light */}
        <LightSwitchCard
          key="livingRoom"
          title={cardTitles.livingRoom.title}
          entityId={cardTitles.livingRoom.entityId}
          isOn={lightStates.livingRoom.isOn}
          brightness={lightStates.livingRoom.brightness}
          color={lightStates.livingRoom.color}
          onClick={() => handleLightToggle("livingRoom")}
          onTitleChange={(title, entityId) => handleTitleChange("livingRoom", title, entityId)}
        />

        {/* Bedroom Light */}
        <LightSwitchCard
          key="bedroom"
          title={cardTitles.bedroom.title}
          entityId={cardTitles.bedroom.entityId}
          isOn={lightStates.bedroom.isOn}
          brightness={lightStates.bedroom.brightness}
          color={lightStates.bedroom.color}
          onClick={() => handleLightToggle("bedroom")}
          onTitleChange={(title, entityId) => handleTitleChange("bedroom", title, entityId)}
        />

        {/* Kitchen Light */}
        <LightSwitchCard
          key="kitchen"
          title={cardTitles.kitchen?.title || "Kitchen Light"}
          entityId={cardTitles.kitchen?.entityId}
          isOn={lightStates.kitchen?.isOn ?? false}
          brightness={lightStates.kitchen?.brightness ?? 60}
          color={lightStates.kitchen?.color ?? "#34d399"}
          onClick={() => handleLightToggle("kitchen")}
          onTitleChange={(title, entityId) => handleTitleChange("kitchen", title, entityId)}
        />

        {/* Temperature Sensor */}
        <SensorStateCard
          key="temperature"
          title={sensorTitles.temperature.title}
          entityId={sensorTitles.temperature.entityId}
          onTitleChange={(title, entityId) => handleSensorTitleChange("temperature", title, entityId)}
        />

        {/* Humidity Sensor */}
        <SensorStateCard
          key="humidity"
          title={sensorTitles.humidity.title}
          entityId={sensorTitles.humidity.entityId}
          onTitleChange={(title, entityId) => handleSensorTitleChange("humidity", title, entityId)}
        />
      </div>
    </div>
  );
};
