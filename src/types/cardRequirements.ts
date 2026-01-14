/**
 * Card type requirements configuration
 * Defines required fields for each card type
 */

export interface CardFieldRequirement {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  label: string;
  placeholder?: string;
  description?: string;
}

export interface CardTypeRequirements {
  type: string;
  label: string;
  requiredFields: CardFieldRequirement[];
}

export const CARD_REQUIREMENTS: Record<string, CardTypeRequirements> = {
  link: {
    type: "link",
    label: "Link",
    requiredFields: [
      {
        name: "url",
        type: "string",
        label: "URL",
        placeholder: "https://example.com",
        description: "The link URL to open",
      },
      {
        name: "icon",
        type: "string",
        label: "Icon",
        placeholder: "home or https://example.com/icon.png",
        description: "Icon name or image URL",
      },
    ],
  },
  weather: {
    type: "weather",
    label: "Weather",
    requiredFields: [
      {
        name: "zipCode",
        type: "string",
        label: "Zip Code",
        placeholder: "21033",
        description: "Zip code for weather forecast",
      },
    ],
  },
  calendar: {
    type: "calendar",
    label: "Calendar",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "calendar.my_calendar",
        description: "Home Assistant calendar entity",
      },
    ],
  },
  "light-switch": {
    type: "light-switch",
    label: "Light Switch",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "light.living_room",
        description: "Home Assistant light entity",
      },
    ],
  },
  "sensor-state": {
    type: "sensor-state",
    label: "Sensor State",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "sensor.temperature",
        description: "Home Assistant sensor entity",
      },
    ],
  },
  "binary-switch": {
    type: "binary-switch",
    label: "Binary Switch",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "switch.living_room",
        description: "Home Assistant switch entity",
      },
    ],
  },
  button: {
    type: "button",
    label: "Button",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "button.doorbell",
        description: "Home Assistant button entity",
      },
    ],
  },
  shutter: {
    type: "shutter",
    label: "Shutter",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "cover.living_room",
        description: "Home Assistant cover entity",
      },
    ],
  },
  trash: {
    type: "trash",
    label: "Trash Schedule",
    requiredFields: [
      {
        name: "entities",
        type: "array",
        label: "Entities",
        placeholder: '["sensor.trash_general", "sensor.trash_bio"]',
        description: "Array of trash sensor entities",
      },
    ],
  },
  "time-remaining": {
    type: "time-remaining",
    label: "Time Remaining",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "sensor.washing_machine_end",
        description: "Home Assistant time sensor entity",
      },
    ],
  },
  person: {
    type: "person",
    label: "Person",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "person.john_doe",
        description: "Home Assistant person entity",
      },
    ],
  },
  uptime: {
    type: "uptime",
    label: "Uptime",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "sensor.uptime",
        description: "Home Assistant uptime sensor entity",
      },
    ],
  },
  "helios-ventilation": {
    type: "helios-ventilation",
    label: "Helios Ventilation",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "climate.helios",
        description: "Helios ventilation entity",
      },
    ],
  },
  "bus-departure": {
    type: "bus-departure",
    label: "Bus Departure",
    requiredFields: [
      {
        name: "entityId",
        type: "string",
        label: "Entity ID",
        placeholder: "sensor.bus_stop",
        description: "Bus departure sensor entity",
      },
    ],
  },
  "room-header": {
    type: "room-header",
    label: "Room Header",
    requiredFields: [],
  },
  "plant-sensor": {
    type: "plant-sensor",
    label: "Plant Sensor",
    requiredFields: [
      {
        name: "plants",
        type: "array",
        label: "Plants",
        placeholder: '[{"name": "Plant 1", "moistureEntity": "..."}]',
        description: "Array of plant configurations",
      },
    ],
  },
};

/**
 * Get requirements for a card type
 */
export const getCardRequirements = (cardType: string): CardTypeRequirements | undefined => {
  return CARD_REQUIREMENTS[cardType];
};

/**
 * Validate if a card config meets requirements
 */
export const validateCardConfig = (cardType: string, config: any): { isValid: boolean; missingFields: string[] } => {
  const requirements = getCardRequirements(cardType);
  if (!requirements) {
    return { isValid: true, missingFields: [] };
  }

  const missingFields: string[] = [];

  for (const field of requirements.requiredFields) {
    const value = config[field.name];

    if (value === undefined || value === null || value === "") {
      missingFields.push(field.label);
    } else if (field.type === "array" && Array.isArray(value) && value.length === 0) {
      missingFields.push(field.label);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};
