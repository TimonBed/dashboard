export interface HomeAssistantMessage {
  id?: number;
  type: string;
  [key: string]: any;
}

export interface AuthMessage extends HomeAssistantMessage {
  type: "auth";
  access_token: string;
}

export interface AuthRequiredMessage extends HomeAssistantMessage {
  type: "auth_required";
  ha_version: string;
}

export interface AuthOkMessage extends HomeAssistantMessage {
  type: "auth_ok";
  ha_version: string;
  core_version: string;
  time_zone: string;
  user: {
    id: string;
    name: string;
    is_owner: boolean;
    is_admin: boolean;
    credentials: any[];
  };
}

export interface StateChangedEvent extends HomeAssistantMessage {
  type: "event";
  event: {
    event_type: "state_changed";
    data: {
      entity_id: string;
      old_state: EntityState | null;
      new_state: EntityState;
    };
  };
}

export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface GetStatesMessage extends HomeAssistantMessage {
  type: "get_states";
}

export interface StatesResultMessage extends HomeAssistantMessage {
  type: "result";
  success: boolean;
  result: EntityState[];
}

export interface SubscribeEventsMessage extends HomeAssistantMessage {
  type: "subscribe_events";
  event_type: "state_changed";
}

export interface SensorEntity extends EntityState {
  entity_id: string;
  state: string;
  attributes: {
    friendly_name: string;
    unit_of_measurement?: string;
    device_class?: string;
    icon?: string;
    [key: string]: any;
  };
}
