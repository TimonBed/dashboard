/**
 * Common props shared by all card components
 * This reduces code duplication across card implementations
 */

export interface BaseCardProps {
  title?: string;
  entityId?: string;
  onTitleChange?: (title: string, entityId?: string) => void;
  onJsonSave?: (config: any) => void;
  onCardDelete?: () => void;
  cardConfig?: any;
  disabled?: boolean;
  className?: string;
}

/**
 * Helper type to merge base card props with component-specific props
 */
export type CardComponentProps<T = {}> = BaseCardProps & T;
